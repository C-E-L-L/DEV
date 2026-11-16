# CELL 운영 안정성 검증 및 Windows 보호

이 도구는 운영 DB와 분리된 **합성 데이터 환경**에서 재현 가능한 측정과 보고서를 만듭니다. 공인 시험기관 인증서가 아닙니다. 응답시간 기준은 프로젝트 운영 SLO입니다.

## 구성

- 현재 운영 이미지와 실제 MySQL 스키마만 사용합니다. 운영 계정·답안·업로드 데이터는 복사하지 않습니다.
- 학생 60명, 과제 3개, crop 600개를 합성합니다. 학생별 행동 간격은 1–3초입니다.
- 전용 Docker 내부 네트워크와 별도 SSD 영속 볼륨을 사용합니다. 부하 스크립트는 전용 응답 헤더가 없으면 쓰기 요청을 거부합니다.
- 1분 ramp-up, 30분 지속, 30초 ramp-down으로 실행합니다. 운영 API와 host 자원을 별도로 관측합니다.
- 운영 API가 연속 3회 실패하거나 여유 RAM이 1 GiB 미만으로 3회 관측되면 부하를 중단합니다.
- 격리 MySQL 프로세스 강제 종료 후 체크섬과 데이터 무결성, 백엔드/프록시 복구를 검증합니다. 운영 MySQL을 중지하지 않습니다.
- 시험 중 자동 배포만 일시정지하여 버전을 고정하고 종료 후 소유한 pause를 해제합니다.

## 실행

서버의 Docker Desktop 계정으로 저장소 루트에서 실행합니다. 동일 host를 공유하므로 사용량이 낮은 시간에 실행합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\ops\reliability\Run-StabilityValidation.ps1 -Users 60 -Hold 30m -IncludeAi
```

결과는 `C:\CELL\reliability\runs\날짜-시간\results`에 저장됩니다. `report.pdf`, `report.html`, 원본 CSV/JSON, 자원 그래프와 SHA256 체크섬을 함께 보관합니다. 런타임 폴더의 임시 비밀번호와 TLS private key를 보고서에 포함하지 않습니다.

AI 시험은 저장소의 비식별 현미경 이미지 `data/diagnostic_gt/raw/images/1000_99.jpg`를 사용합니다. 동일 운영 모델을 read-only로 연결하고 1건 및 3건 동시 요청을 각각 3회 실행합니다. 의료적 정확도 검증을 의미하지 않습니다.

## Windows 절전 방지와 로그인 후 복구

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\ops\reliability\Install-ServerWatchdog.ps1
```

`CELL-ServerWatchdog`는 현재 Windows 로그인 계정으로 실행됩니다. 화면 잠금은 괜찮지만 로그아웃하면 Docker Desktop 운영이 중단될 수 있습니다. 이 작업은 다음을 수행합니다.

- Win32 `SetThreadExecutionState`로 자동 idle sleep을 방지합니다. 모니터를 계속 켜 두지는 않습니다.
- 로그인 후 Docker Desktop이 실행되지 않았으면 시작합니다.
- 현재 배포의 digest 고정 이미지로 누락/중지된 서비스만 시작합니다. 이미지 빌드/업데이트/DB 초기화는 하지 않습니다.
- 유지보수 pause, 배포 잠금 및 기존 `dev_mysql-data`·`dev_colorizer-data` 볼륨을 확인합니다. 볼륨이 없으면 재생성을 차단합니다.
- 복구 후 Nginx를 reload하여 백엔드 주소를 재해석합니다.
- HTTPS API, 컨테이너 상태, 자동 절전 방지 상태를 `C:\CELL\reliability\service`에 기록합니다.

이 감시 작업은 사용자 지정 종료, 장시간 전원 버튼, 정전 또는 Windows Update 강제 재시작을 막는 기능이 아닙니다. Windows 11 Home은 24시간 영구 재부팅 차단 정책을 보장하지 않습니다. 보안 업데이트를 끄거나 자동 로그인을 설정하지 않습니다.

## 관리자 전원 설정

아래 스크립트는 관리자 PowerShell에서 실행해야 합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\ops\reliability\Apply-AdminReliability.ps1
```

변경 전 전원 계획을 백업하고 AC/DC 자동 절전·최대절전·unattended sleep·디스크 idle을 끄며, 짧은 전원/절전 버튼을 '동작 없음'으로 설정합니다. 최대절전과 빠른 시작을 끄고 지원되는 NIC 절전 옵션을 조정합니다. NIC를 즉시 재시작하지 않으므로 드라이버에 따라 적용 확인에 유지보수가 필요할 수 있습니다. Windows Update는 유지합니다. 관리자 승인이 취소되면 적용됐다고 간주하지 않습니다.

정전 대비 UPS, BIOS의 AC 전원 복구 옵션, 실제 재부팅 후 로그인 없는 운영은 별도 작업입니다. 완전한 무인 운영이 필요하면 Docker Engine이 system service로 실행되는 Linux 서버/VM 구성이 적합합니다.

## 검사 코드 검증

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\ops\reliability\tests\Test-Watchdog.ps1
```

실제 Docker 대신 fixture를 사용하여 정상 서버 무변경, 유지보수 중 복구 금지, 영속 볼륨 누락 시 차단, 현재 이미지 복구와 Nginx reload를 검증합니다.

## 장애/중단 후 정리

진행 중인 부하는 임의의 운영 컨테이너 대신 해당 시험의 `...-k6` 컨테이너만 중지합니다. 다음 명령은 이미 종료된 시험만 정리합니다.

```powershell
$run = Get-Content C:\CELL\reliability\active-run.json -Raw -Encoding UTF8 | ConvertFrom-Json
powershell -NoProfile -ExecutionPolicy Bypass -File .\ops\reliability\Complete-StabilityTest.ps1 -Work $run.work
```

프로젝트 이름과 Docker label이 일치하는 시험 자원만 제거합니다. 운영 볼륨과 보고서 파일은 유지합니다. pause의 소유자가 바뀌었으면 그 pause를 자동 해제하지 않습니다.

## 근거 문서

- [Grafana k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Grafana k6 soak test duration and limitations](https://grafana.com/docs/k6/latest/testing-guides/test-types/soak-testing/)
- [Microsoft powercfg](https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/powercfg-command-line-options)
- [Microsoft SetThreadExecutionState](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate)
- [Microsoft update restarts](https://learn.microsoft.com/en-us/windows/deployment/update/waas-restart)
- [Docker Desktop startup](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
