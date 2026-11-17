"""Build a standalone internal validation report from measured artifacts."""
import csv
import hashlib
import html
import json
import re
from collections import defaultdict
from datetime import datetime, timezone, timedelta
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

ROOT = Path('/work')
OUT = ROOT / 'results'
KST = timezone(timedelta(hours=9))

def read_json(path, default=None):
    return json.loads(path.read_text(encoding='utf-8-sig')) if path.exists() else default

def esc(value):
    return html.escape(str(value))

def table(headers, rows):
    return '<table><thead><tr>' + ''.join(f'<th>{esc(v)}</th>' for v in headers) + '</tr></thead><tbody>' + ''.join(
        '<tr>'+''.join(f'<td>{esc(v)}</td>' for v in row)+'</tr>' for row in rows)+'</tbody></table>'

meta = read_json(ROOT / 'metadata.json')
env = read_json(OUT / 'environment.json')
raw = read_json(OUT / 'interim-metrics.json')
summary = read_json(OUT / 'summary.json', {})
exit_state = read_json(OUT / 'k6-exit.json', {})
post = read_json(OUT / 'post-checks.json', {})
admin = read_json(OUT / 'admin-settings.json')
admin_applied = bool(admin and admin.get('administrator') and all(a.get('success') for a in admin.get('actions',[])))
watchdog = read_json(OUT / 'watchdog-status.json', {})
ai = read_json(OUT / 'ai-benchmark.json')
tls = read_json(OUT / 'tls-check.json', {})
renewal = read_json(OUT / 'certificate-status.json', {})
renewal_dryrun = read_json(OUT / 'certificate-dryrun.json', {})
deployment = read_json(OUT / 'final-service-status.json', {})
with (OUT / 'host-samples.csv').open(encoding='utf-8-sig', newline='') as stream:
    host = list(csv.DictReader(stream))
availability = sum(row['production_http']=='200' for row in host) / len(host) if host else 0
memory_min = min(float(row['free_memory_mb']) for row in host) if host else 0
cpu_max = max(float(row['cpu_percent']) for row in host if row['cpu_percent']) if host else 0
thresholds=[]
for metric, data in summary.get('metrics',{}).items():
    for expression, result in data.get('thresholds',{}).items():
        thresholds.append((metric, expression, bool(result['ok'])))
passed = bool(thresholds) and all(row[2] for row in thresholds) and exit_state.get('ExitCode')==0
passed = passed and availability==1 and not (OUT / 'safety-abort.txt').exists()
passed = passed and post.get('invalid_answers')==0 and post.get('duplicate_answers')==0 and post.get('recovery_passed') is True
passed = passed and post.get('database_recovery_passed') is True and post.get('production_unchanged') is True
if ai is not None:
    passed = passed and ai.get('passed') is True
status = 'PASS' if passed else 'FAIL / 검토 필요'

times=[datetime.fromisoformat(row['time']) for row in host]
fig, axes=plt.subplots(3,1,figsize=(10,8),sharex=True,layout='constrained')
axes[0].plot(times,[float(r['cpu_percent'] or 0) for r in host],color='#2457a7')
axes[0].set_ylabel('Host CPU (%)');axes[0].set_ylim(bottom=0);axes[0].grid(alpha=.25)
axes[1].plot(times,[float(r['free_memory_mb'])/1024 for r in host],color='#18865e')
axes[1].axhline(1,color='#ba2b37',linestyle='--',label='Safety abort: 1 GiB')
axes[1].set_ylabel('Free RAM (GiB)');axes[1].legend(loc='best');axes[1].grid(alpha=.25)
axes[2].plot(times,[float(r['production_seconds'] or 0)*1000 for r in host],color='#8b4ca5')
axes[2].set_ylabel('Production API (ms)');axes[2].set_xlabel('Time (KST)');axes[2].grid(alpha=.25)
axes[2].xaxis.set_major_formatter(mdates.DateFormatter('%H:%M',tz=KST))
fig.suptitle('Measured host resources and production availability during isolated load')
fig.savefig(OUT / 'host-resources.png',dpi=150);plt.close(fig)

def mib(value):
    match=re.match(r'([\d.]+)\s*(GiB|MiB|KiB|GB|MB|kB|B)',value.strip())
    if not match:return 0
    multiplier={'GiB':1024,'MiB':1,'KiB':1/1024,'GB':1e9/2**20,'MB':1e6/2**20,'kB':1000/2**20,'B':1/2**20}[match[2]]
    return float(match[1])*multiplier

resources=defaultdict(list)
if (OUT / 'container-samples.csv').exists():
    with (OUT / 'container-samples.csv').open(encoding='utf-8-sig',newline='') as stream:
        for row in csv.DictReader(stream):
            resources[row['container']].append((datetime.fromisoformat(row['time']),mib(row['memory'].split('/')[0])))
fig, ax=plt.subplots(figsize=(10,4),layout='constrained')
for name, points in resources.items():
    if name.endswith('-backend-1') or name.endswith('-mysql-1'):
        label=name.replace(meta['project'],'test')
        ax.plot([p[0] for p in points],[p[1] for p in points],label=label)
ax.set_ylabel('Container RAM (MiB)');ax.set_xlabel('Time (KST)');ax.grid(alpha=.25)
ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M',tz=KST));ax.legend(loc='best',fontsize=8)
fig.savefig(OUT / 'container-memory.png',dpi=150);plt.close(fig)

endpoint_rows=[]
for name, data in raw['endpoints'].items():
    endpoint_rows.append([name,data['requests'],data['p95_ms'],data['p99_ms'],f"{(data['failure_rate'] or 0)*100:.4f}%"])
resource_rows=[]
for name, points in sorted(resources.items()):
    resource_rows.append([name.replace(meta['project'],'test'),round(points[0][1],1),round(max(p[1] for p in points),1),round(points[-1][1],1)])
setting_rows=[
    ['전원 연결 시 자동 절전/최대절전','기존 타이머 0(사용 안 함); 설정 스냅샷 첨부'],
    ['실행 중 자동 절전 방지',f"Win32 실행 상태 요청 성공: {watchdog.get('power_guard',False)}"],
    ['Docker 로그인 후 자동 복구','CELL-ServerWatchdog 등록 및 실행 확인; 실제 Windows 재부팅 시험은 미실시'],
    ['컨테이너 복구','현재 digest 고정 이미지로만 복구; 유지보수 pause와 배포 잠금 존중'],
    ['Windows Update',f"유지: 활성 시간 {env['update_active_hours']['ActiveHoursStart']:02d}:00–{env['update_active_hours']['ActiveHoursEnd']:02d}:00, 재부팅 대기={env['reboot_pending']}"],
    ['관리자 전원/네트워크 설정',('적용 완료' if admin_applied else '관리자 실행 결과 일부 항목 확인 필요') if admin else 'UAC 승인 취소로 미적용; 관리자 실행 스크립트 제공'],
    ['정전 후 복구 / UPS','운영체제 설정만으로 보장 불가; BIOS 전원 복구 옵션과 UPS 별도 확인 필요'],
    ['TLS 사전 확인',f"검증={tls.get('verified')}, 만료일={tls.get('certificate_expires')}"],
    ['인증서 자동 갱신',f"webroot 검증={renewal_dryrun.get('success','미측정')}, 갱신 점검={renewal.get('success','미측정')}, 새 만료일={renewal.get('certificate',{}).get('expires_utc','미측정')}"],
    ['시험 종료 후 운영 상태',f"자동 배포 pause={deployment.get('deployment_paused','미측정')}, API={deployment.get('api_status','미측정')}, 현재 버전={deployment.get('production_sha','미측정')}"],
]
if admin:
    setting_rows += [[a['action'], '성공' if a.get('success') else '미적용/지원 여부 확인'] for a in admin['actions']]
event_rows=[[r['provider'],','.join(map(str,r['event_ids'])),r['count']] for r in env['recent_events']]
test_rows=[
    ['가상 사용자',f"{meta['users']}명, 사용자별 1–3초 행동 간격"],
    ['데이터','합성 학생 60명, 공개 상태의 합성 과제 3개, 합성 crop 600개'],
    ['시험 구조','같은 데스크탑의 별도 Docker 내부 네트워크·별도 MySQL. 운영 데이터는 복제하지 않고 스키마만 복제'],
    ['부하 프로필',f"30초 10명 → 30초 {meta['users']}명 → {meta.get('hold_duration','30m')} 유지 → 30초 종료"],
    ['요청 혼합','과제 조회 10%, crop 조회 10%, 저장 답안 조회 10%, crop 이미지 10%, 답안 저장 60%'],
    ['안전 조건','운영 API 3회 연속 실패 또는 여유 RAM 1 GiB 미만 3회 연속 시 격리 부하 중단'],
    ['샘플 구간',f"{times[0].strftime('%Y-%m-%d %H:%M:%S')}–{times[-1].strftime('%H:%M:%S')} KST"],
    ['시험 이미지',meta['production_sha']],
    ['DB 저장장치',meta.get('mysql_storage','not recorded')+' / dedicated Docker volume on the server SSD'],
    ['k6 이미지',meta['k6_image']],
]
hardware_rows=[
    ['OS',env['os']['caption']+' / '+env['os']['version']],
    ['CPU',f"{env['cpu']['name']} ({env['cpu']['cores']} cores / {env['cpu']['logical_processors']} threads)"],
    ['RAM',str(env['memory_gib'])+' GiB'],
    ['유선 링크',' / '.join(n['LinkSpeed'] for n in env['network'])],
    ['C: 여유 공간',str(env['system_drive_free_gib'])+' GiB'],
    ['격리 환경 제한','Backend 4 CPU / 1536 MiB, MySQL 2 CPU / 1024 MiB, frontend 1 CPU / 256 MiB, k6 2 CPU / 512 MiB'],
]
summary_rows=[
    ['HTTP 요청 수',raw['requests']],['HTTP 실패율',f"{raw['http_failure_rate']*100:.5f}%"],
    ['전체 p95 / p99',f"{raw['response']['p95_ms']} / {raw['response']['p99_ms']} ms"],
    ['답안 저장 p95 / p99',f"{raw['submission']['p95_ms']} / {raw['submission']['p99_ms']} ms"],
    ['답안 저장·재조회 일치율',f"{raw['answer_consistency_rate']*100:.2f}%"],
    ['운영 API 관측 성공률',f"{availability*100:.2f}% ({len(host)} samples)"],
    ['관측 중 최소 여유 RAM',f'{memory_min:.1f} MiB'],['관측 중 최대 host CPU',f'{cpu_max:.0f}%'],
    ['격리 DB 무결성',f"orphan/invalid={post.get('invalid_answers')}, duplicate={post.get('duplicate_answers')}"],
    ['격리 백엔드 재시작 복구',post.get('recovery_passed')],
    ['격리 DB 강제종료 후 복구',post.get('database_recovery_passed')],
    ['운영 컨테이너 변경/중단 없음',post.get('production_unchanged')],
]
ai_html=''
if ai:
    ai_html='<h2>AI 추론 점검</h2>'+table(['항목','결과'],[['성공/전체',f"{ai['successful']}/{ai['requests_total']}"],['시험 이미지',ai['test_image']],['자원 제한',ai['resource_limit']]])
    ai_html+=table(['동시 요청','요청 수','성공','평균 응답(초)','최대 응답(초)','탐지 세포 수'],[[g['concurrency'],g['requests'],g['successful'],g['average_seconds'],g['maximum_seconds'],g['detected_cells']] for g in ai['groups']])
    ai_html+='<p>비식별 저장소 현미경 이미지의 YOLO→DenseNet 처리 경로 점검이며 의료적 정확도 검증은 포함하지 않습니다. 동시 요청 응답시간에는 큐 대기 시간이 포함됩니다.</p>'
report=f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>CELL 서버 안정성 검증 보고서</title>
<style>@page{{size:A4;margin:16mm}}body{{font-family:"Malgun Gothic",Arial,sans-serif;color:#17283e;font-size:10pt;line-height:1.65;max-width:1050px;margin:30px auto}}h1{{font-size:23pt}}h2{{font-size:15pt;margin-top:28px;border-bottom:2px solid #d8e2ee;padding-bottom:5px}}table{{width:100%;border-collapse:collapse;margin:12px 0;font-size:9pt;table-layout:auto}}th,td{{border:1px solid #d3dce8;padding:7px;vertical-align:top;overflow-wrap:anywhere}}th{{background:#edf3fa;text-align:left}}img{{width:100%;height:auto}}.banner{{padding:18px;background:#edf5f1;border-left:5px solid #18865e}}.note{{background:#fff5e4;padding:14px}}tr{{break-inside:avoid}}.small{{font-size:9pt;color:#53647a}}code{{overflow-wrap:anywhere}}@media print{{body{{margin:0}}h2{{break-after:avoid}}img{{break-inside:avoid}}}}</style></head><body>
<h1>C.E.L.L. 서버 안정성 검증 보고서</h1><p class="small">작성 {datetime.now(KST).strftime('%Y-%m-%d %H:%M:%S KST')} · 시험 ID {esc(meta['project'])}</p>
<div class="banner"><strong>지속 부하·기능 시험: {esc(status)}</strong><br>Windows 운영 설정: {'관리자 적용 결과 확인' if admin_applied else '일부 관리자 설정 미적용'} · 공인기관 시험성적서/인증서가 아닌 재현 가능한 내부 검증 보고서입니다.</div>
<h2>1. 결과 요약</h2>{table(['지표','측정값'],summary_rows)}
<h2>2. 시험 방법과 범위</h2>{table(['항목','내용'],test_rows)}
<p>HTTP 응답, TLS 검증, 인증, 학생 권한 보호, 조회, 이미지 전송, 답안 저장과 재조회, 복구 후 데이터 유지 여부를 점검했습니다. 유지보수 중 버전 변화를 막기 위해 자동 배포만 일시정지하고 종료 후 원래 상태로 복구합니다.</p>
<h2>3. 사전 정의한 합격 기준</h2>{table(['지표','기준','판정'],[[m,e,'PASS' if ok else 'FAIL'] for m,e,ok in thresholds])}
<p class="small">응답시간 단위는 ms입니다. 기준은 프로젝트 운영 SLO이며 국제 인증 기준으로 간주하지 않습니다.</p>
<h2>4. 요청별 응답시간</h2>{table(['요청','요청 수','p95 (ms)','p99 (ms)','실패율'],endpoint_rows)}
<h2>5. 하드웨어 및 자원 관측</h2>{table(['항목','내용'],hardware_rows)}
<img src="host-resources.png" alt="Host resources"><img src="container-memory.png" alt="Container memory">
{table(['컨테이너','첫 관측 MiB','최대 MiB','마지막 MiB'],resource_rows)}
<h2>6. Windows 및 복구 설정</h2>{table(['항목','상태'],setting_rows)}
<h2>7. 최근 7일 운영체제 이벤트</h2>{table(['Provider','Event IDs','건수'],event_rows)}
<p class="small">이벤트 ID는 provider별로 구분했습니다. 같은 번호의 정상 Windows Update/부팅 이벤트를 하드웨어 오류로 집계하지 않습니다.</p>
{ai_html}
<h2>8. 해석과 남은 제한</h2><div class="note"><ul>
<li>이 결과는 동일 호스트의 제한된 격리 자원에서 60명의 가상 사용자와 1–3초의 행동 간격으로 측정한 결과입니다. 동시 60 TPS 또는 모든 사용자의 동시 AI 업로드를 보증하지 않습니다.</li>
<li>실제 인터넷·100Mbps 유선 링크·사용자 단말의 다운로드 대역폭은 부하 경로에 포함하지 않았습니다.</li>
<li>본 지속 구간은 수일/수주 장기 soak, 정전, 물리 전원 차단, 실제 Windows 재부팅 시험을 대체하지 않습니다.</li>
<li>대용량 DICOM 일괄 처리, AI 재학습, 대량 내보내기 등은 이 60명 학생 부하 시나리오에 포함하지 않았습니다.</li>
<li>Windows 11 Home의 업데이트 재시작을 24시간 영구 차단한다고 보증할 수 없습니다. 업데이트 재부팅 대기 상태를 계획된 유지보수 시간에 처리해야 합니다.</li>
<li>Docker Desktop은 Windows 로그인 세션이 필요합니다. 잠금 상태로는 운영되지만 로그아웃/정전 후 로그인 없는 복구는 검증하지 않았습니다.</li>
<li>전원 버튼 장시간 누름, 전원 케이블 분리, 정전, 과열 보호 종료는 이 설정으로 차단할 수 없습니다. UPS 및 BIOS 전원 복구 설정을 별도로 확인해야 합니다.</li>
</ul></div>
<h2>9. 원본 자료 및 재현</h2><p>summary.json, metrics.csv, host-samples.csv, container-samples.csv, environment.json, post-checks.json, k6-exit.json 및 SHA256SUMS.txt를 함께 보관합니다. 실행 절차와 소스는 저장소 ops/reliability 및 load_test/stability.k6.js에 있습니다. 실제 계정·비밀번호·JWT·환자 자료는 이 보고서에 포함하지 않습니다.</p>
<h2>10. 기준 문서</h2><ul>
<li><a href="https://grafana.com/docs/k6/latest/using-k6/thresholds/">Grafana k6: Thresholds</a></li>
<li><a href="https://grafana.com/docs/k6/latest/testing-guides/test-types/soak-testing/">Grafana k6: Soak testing and long-duration limitations</a></li>
<li><a href="https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options">Microsoft: Powercfg command-line options</a></li>
<li><a href="https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate">Microsoft: SetThreadExecutionState</a></li>
<li><a href="https://learn.microsoft.com/en-us/windows/deployment/update/waas-restart">Microsoft: Manage device restarts after updates</a></li>
<li><a href="https://docs.docker.com/desktop/settings-and-maintenance/settings/">Docker Desktop startup settings</a></li>
<li><a href="https://eff-certbot.readthedocs.io/en/stable/using.html#webroot">Certbot: Webroot and automated renewals</a></li>
</ul></body></html>'''
(OUT / 'report.html').write_text(report,encoding='utf-8')
conclusion={'performance_passed':passed,'windows_admin_settings_applied':admin_applied,'production_availability':availability,
            'production_health_samples':len(host),'host_minimum_free_memory_mb':memory_min,'host_maximum_cpu_percent':cpu_max,
            'requests':raw['requests'],'p95_ms':raw['response']['p95_ms'],'submission_p95_ms':raw['submission']['p95_ms']}
(OUT / 'conclusion.json').write_text(json.dumps(conclusion,indent=2),encoding='utf-8')
print(json.dumps(conclusion,indent=2))
