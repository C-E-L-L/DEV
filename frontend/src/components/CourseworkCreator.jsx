import { useEffect, useState } from 'react';
import { taskApi, diagnosticApi, labelingApi } from '../api';
import { distributeQuestions } from '../utils/coursework';

const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';

/** New coursework form: a diagnostic from the answer pool, or a practice from uploaded smears. Creates a draft. */
export default function CourseworkCreator({ species, onCancel, onCreated }) {
  const [kind, setKind] = useState('DIAGNOSTIC');
  const [title, setTitle] = useState('');
  const [speciesId, setSpeciesId] = useState(species.find(s => s.code === 'DOG')?.id || species[0]?.id || '');
  const [pool, setPool] = useState(null);
  const [total, setTotal] = useState(20);
  const [distribution, setDistribution] = useState({});
  const [files, setFiles] = useState([]);
  const [labelMode, setLabelMode] = useState('NONE');
  const [busy, setBusy] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (kind !== 'DIAGNOSTIC' || !speciesId) return;
    let active = true; setPool(null); setError('');
    diagnosticApi.getPoolStats(speciesId).then(({ data }) => {
      if (!active) return;
      setPool(data); const count = Math.min(20, data.totalAvailable); setTotal(count); setDistribution(distributeQuestions(count, data.availableByClass));
    }).catch(e => active && setError(errorMessage(e)));
    return () => { active = false; };
  }, [speciesId, kind]);
  const addFiles = event => setFiles(current => [...current, ...Array.from(event.target.files).map(file => ({ file, speciesId, labels: null }))]);
  const create = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    let draftId = null;
    try {
      if (kind === 'DIAGNOSTIC') {
        const { data } = await diagnosticApi.createTask({ title, speciesId: Number(speciesId), totalQuestions: Number(total), classDistribution: distribution });
        draftId = data.taskId;
      } else {
        if (!files.length) throw new Error('도말 이미지를 한 장 이상 선택해주세요.');
        if (labelMode === 'FILE' && files.some(item => !item.labels)) throw new Error('각 도말의 라벨 파일을 선택해주세요.');
        // Validate every JSON file before uploading any image.
        const manifests = labelMode === 'FILE' ? await Promise.all(files.map(async item => JSON.parse(await item.labels.text()))) : [];
        const form = new FormData(); form.append('title', title);
        files.forEach(item => { form.append('files', item.file); form.append('speciesIds', item.speciesId); });
        const { data } = await taskApi.createAssignment(form);
        draftId = data.tasks[0].taskId;
        if (labelMode === 'FILE') {
          for (let i = 0; i < manifests.length; i++) await labelingApi.importTask(data.tasks[i].taskId, manifests[i]);
        }
      }
      onCreated(draftId);
    } catch (e) {
      if (draftId) setSavedDraftId(draftId);
      setError(draftId ? `${errorMessage(e)} 이미지는 작성 중 과제로 저장되었습니다. 목록에서 이어서 라벨을 가져올 수 있습니다.` : errorMessage(e));
    } finally { setBusy(false); }
  };
  const validDistribution = Number(total) > 0 && Object.values(distribution).reduce((sum, n) => sum + n, 0) === Number(total);
  return <form className="pw-card pw-creator" onSubmit={create}>
    <div className="pw-section-heading"><div><h2>과제 만들기</h2><p>자료를 준비한 다음, 검토 화면에서 게시 여부를 결정합니다.</p></div><button type="button" onClick={onCancel} disabled={busy}>취소</button></div>
    <fieldset disabled={busy}><legend>1. 과제 종류</legend><div className="pw-type-options">{[['DIAGNOSTIC', '진단평가', '정답이 있는 세포 크롭으로 학생 수준을 확인합니다.'], ['PRACTICE', '분류 실습', '도말을 탐지·검토하고 학생에게 세포 분류를 배정합니다.']].map(([key, label, text]) => <label key={key}><input type="radio" name="kind" checked={kind === key} onChange={() => { setKind(key); setError(''); }} /><strong>{label}</strong><span>{text}</span></label>)}</div></fieldset>
    <label className="pw-field">과제 제목<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 1주차 개 혈액세포 진단평가" disabled={busy} /></label>
    <label className="pw-field">동물 종<select value={speciesId} onChange={e => setSpeciesId(Number(e.target.value))} disabled={busy}>{species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    {kind === 'DIAGNOSTIC' ? <fieldset disabled={busy || !pool}><legend>2. 진단 문항 구성</legend>
      {!pool ? <p role="status">서버의 정답 크롭 데이터를 확인하는 중…</p> : pool.totalAvailable === 0 ? <p className="pw-notice">이 동물 종에 등록된 정답 크롭 데이터가 없습니다. 서버에 데이터를 등록한 뒤 진단평가를 만들 수 있습니다.</p> : <>
        <p>사용 가능한 정답 크롭 {pool.totalAvailable}개. 클래스별 문항 수는 아래에서 조정할 수 있습니다.</p>
        <div className="pw-actions"><label>전체 문항 수 <input aria-label="전체 문항 수" type="number" min="1" max={pool.totalAvailable} value={total} onChange={e => setTotal(e.target.value)} /></label><button type="button" onClick={() => setDistribution(distributeQuestions(total, pool.availableByClass))}>균등 배분</button></div>
        <div className="pw-distribution">{Object.entries(pool.availableByClass).map(([label, available]) => <label key={label}>{label}<small>보유 {available}개</small><input aria-label={`${label} 문항 수`} type="number" min="0" max={available} value={distribution[label] || 0} onChange={e => setDistribution(d => ({ ...d, [label]: Number(e.target.value) }))} /></label>)}</div>
        <p className={!validDistribution ? 'pw-warning' : ''}>선택 합계 {Object.values(distribution).reduce((a, b) => a + b, 0)} / {total}문항</p>
        <p className="pw-muted">클래스별 응답이 적으면 혼동행렬의 신뢰도가 낮을 수 있습니다. 진단 이후 도말 실습으로 보완하세요.</p>
      </>}
    </fieldset> : <fieldset disabled={busy}><legend>2. 도말 자료 준비</legend>
      <label className="pw-field">도말 이미지<input type="file" accept="image/*" multiple onChange={addFiles} /></label>
      <div className="pw-actions"><label><input type="radio" name="labelMode" checked={labelMode === 'NONE'} onChange={() => setLabelMode('NONE')} /> 라벨 없음</label><label><input type="radio" name="labelMode" checked={labelMode === 'FILE'} onChange={() => setLabelMode('FILE')} /> 라벨 파일 있음</label></div>
      <p className="pw-muted">라벨이 없어도 다음 화면에서 직접 라벨링하거나, 정답 없이 게시할 수 있습니다. JSON은 세포 ID 또는 바운딩박스와 라벨을 연결해야 합니다.</p>
      {files.map((item, index) => <div className="pw-upload-row" key={index}><span>{item.file.name}</span><select aria-label={`${item.file.name} 동물 종`} value={item.speciesId} onChange={e => setFiles(v => v.map((f, i) => i === index ? { ...f, speciesId: Number(e.target.value) } : f))}>{species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>{labelMode === 'FILE' && <input aria-label={`${item.file.name} 라벨 파일`} type="file" accept=".json,application/json" onChange={e => setFiles(v => v.map((f, i) => i === index ? { ...f, labels: e.target.files[0] } : f))} />}<button type="button" onClick={() => setFiles(v => v.filter((_, i) => i !== index))}>제거</button></div>)}
      <details><summary>지원 라벨 JSON 예시</summary><pre>{JSON.stringify({ annotations: [{ bbox: [90, 110, 205, 235], label: 'Segment' }] }, null, 2)}</pre><p>좌표는 원본 이미지 기준 [왼쪽, 위, 오른쪽, 아래]입니다. 탐지 세포와 명확하게 연결되지 않는 항목은 오류로 안내합니다.</p></details>
    </fieldset>}
    {error && <p role="alert" className="pw-error">{error}</p>}
    {savedDraftId && <button type="button" className="pw-primary" onClick={() => onCreated(savedDraftId)}>저장된 과제에서 라벨 가져오기 계속</button>}
    <div className="pw-actions"><button className="pw-primary" disabled={busy || savedDraftId || !speciesId || (kind === 'DIAGNOSTIC' && (!pool?.totalAvailable || !validDistribution))}>{busy ? '자료를 준비하고 있습니다…' : '자료 준비 시작'}</button><span className="pw-muted">이 단계에서는 학생에게 공개되지 않습니다.</span></div>
  </form>;
}
