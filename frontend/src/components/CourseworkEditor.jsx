import { cellChoices, answerLabel } from '../utils/cellClasses';
import { useEffect, useState } from 'react';
import { courseworkApi } from '../api/coursework';
import { labelingApi } from '../api';
import { CELL_TYPES, imageUrl } from '../constants';
import { isDiagnostic, savePayload } from '../utils/coursework';
import AuthImage from './AuthImage';

const message = e => e?.response?.data?.message || e.message || '저장하지 못했습니다. 다시 시도해주세요.';
function parseBox(value) { try { const box = typeof value === 'string' ? JSON.parse(value.replaceAll("'", '"')) : value; return box?.flat(); } catch { return null; } }

export default function CourseworkEditor({ id, onBack, onDirty, onPublished }) {
  const [workspace, setWorkspace] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', deadlineAt: '', requireLabels: false, resultsAfterDeadline: false });
  const [edits, setEdits] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [dimensions, setDimensions] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dirty, setDirty] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [cellFilter, setCellFilter] = useState('ALL');
  const apply = data => {
    setWorkspace(data);
    const first = data.tasks[0].task;
    setMetadata({ title: first.title || '', deadlineAt: first.deadlineAt?.slice(0, 16) || '', requireLabels: first.requireLabels || isDiagnostic(first), resultsAfterDeadline: first.resultsAfterDeadline || false });
    const crops = data.tasks.flatMap(t => t.crops);
    setEdits(Object.fromEntries(crops.map(c => [c.id, { label: c.finalLabel || '', excluded: c.excluded || false, exclusionReason: c.exclusionReason || '' }])));
    setSelectedId(current => crops.some(c => c.id === current) ? current : crops[0]?.id || null);
    setDirty(false); onDirty(false);
  };
  useEffect(() => { let active = true; courseworkApi.get(id).then(({ data }) => active && apply(data)).catch(e => active && setError(message(e))); return () => { active = false; }; }, [id]);
  useEffect(() => {
    if (!dirty) return;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const changed = () => { setDirty(true); onDirty(true); setNotice(''); };
  const updateMetadata = patch => { setMetadata(v => ({ ...v, ...patch })); changed(); };
  const updateCell = (cropId, patch) => { setEdits(v => ({ ...v, [cropId]: { ...v[cropId], ...patch } })); changed(); };
  const save = async () => {
    setBusy(true); setError('');
    try { const { data } = await courseworkApi.save(id, savePayload(workspace, metadata, edits)); apply(data); setNotice('임시저장했습니다. 학생에게는 공개되지 않았습니다.'); return data; }
    catch (e) { setError(message(e)); return null; } finally { setBusy(false); }
  };
  const publish = async () => {
    setBusy(true); setError('');
    try { await courseworkApi.publish(id, savePayload(workspace, metadata, edits)); setDirty(false); onDirty(false); onPublished(); }
    catch (e) { setError(message(e)); setPublishOpen(false); } finally { setBusy(false); }
  };
  const importLabels = async (taskId, file) => {
    if (!file) return;
    let manifest;
    try { manifest = JSON.parse(await file.text()); } catch { setError('라벨 파일을 읽을 수 없습니다. JSON 형식을 확인해주세요.'); return; }
    if (dirty && !await save()) return;
    setBusy(true); setError('');
    try {
      const imported = await labelingApi.importTask(taskId, manifest);
      const { data } = await courseworkApi.get(id); apply(data);
      setNotice(`${imported.data.updated}개 라벨을 저장했습니다. 게시하려면 '게시 설정 확인'을 선택하세요.`);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const template = part => {
    const contents = { annotations: part.crops.map(c => ({ cropId: c.id, bbox: parseBox(c.bbox), label: edits[c.id]?.label || null })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(contents, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `smear-${part.task.id}-labels.json`; link.click(); URL.revokeObjectURL(url);
  };
  if (!workspace) return <section className="pw-card"><button onClick={onBack}>← 목록</button>{error ? <p role="alert" className="pw-error">{error}</p> : <p role="status">임시저장 자료를 불러오는 중…</p>}</section>;
  const first = workspace.tasks[0].task;
  const diagnostic = isDiagnostic(first);
  const all = workspace.tasks.flatMap(part => part.crops);
  const selected = all.find(c => c.id === selectedId);
  const current = workspace.tasks.find(part => part.crops.some(c => c.id === selectedId)) || workspace.tasks[0];
  const active = all.filter(c => !edits[c.id]?.excluded);
  const labeled = active.filter(c => edits[c.id]?.label);
  const excluded = all.length - active.length;
  const filtered = all.filter(c => cellFilter === 'ALL' || (cellFilter === 'EXCLUDED' ? edits[c.id]?.excluded : !edits[c.id]?.excluded && !edits[c.id]?.label));
  const canPublish = active.length > 0 && (!(metadata.requireLabels || diagnostic) || active.length === labeled.length);
  const move = offset => { const index = all.findIndex(c => c.id === selectedId); setSelectedId(all[Math.max(0, Math.min(all.length - 1, index + offset))]?.id); };
  const readOnly = first.status !== 'DRAFT';

  return <section className="pw-editor">
    <div className="pw-section-heading"><div><button onClick={onBack} disabled={busy}>← 목록으로</button><h2>{diagnostic ? '진단평가 준비' : '도말 검토·라벨링'}</h2><p>라벨링을 마쳐도 자동으로 게시되지 않습니다. 임시저장 후 언제든 이어서 작업할 수 있습니다.</p></div><span className="pw-badge">{dirty ? '저장하지 않은 변경 있음' : readOnly ? '게시됨' : '임시저장됨 · 비공개'}</span></div>
    {error && <div role="alert" className="pw-error">{error}</div>}{notice && <div role="status" className="pw-success">{notice}</div>}
    <fieldset disabled={busy || readOnly} className="pw-card"><legend>과제 정보</legend>
      <div className="pw-metadata"><label className="pw-field">과제 제목<input value={metadata.title} maxLength={200} onChange={e => updateMetadata({ title: e.target.value })} /></label><label className="pw-field">마감일 (선택)<input type="datetime-local" value={metadata.deadlineAt} onChange={e => updateMetadata({ deadlineAt: e.target.value })} /></label></div>
      <div className="pw-actions">{!diagnostic && <label><input type="checkbox" checked={metadata.requireLabels} onChange={e => updateMetadata({ requireLabels: e.target.checked })} /> 모든 출제 문항의 정답을 확정한 뒤 게시</label>}<label><input type="checkbox" checked={metadata.resultsAfterDeadline} onChange={e => updateMetadata({ resultsAfterDeadline: e.target.checked })} /> 결과는 마감 후 공개</label></div>
      <p className="pw-muted">{diagnostic ? '진단평가는 정답이 확정된 문항만 게시할 수 있습니다.' : metadata.requireLabels ? '아래에서 모든 출제 문항을 라벨링해주세요.' : '정답 없이 게시할 수 있습니다. 학생 응답은 저장되며 교수 정답 확정 후 채점됩니다.'}</p>
    </fieldset>
    <div className="pw-progress" aria-label="자료 준비 현황"><span>출제 문항 <strong>{active.length}</strong></span><span>정답 확정 <strong>{labeled.length}/{active.length}</strong></span><span>출제 제외 <strong>{excluded}</strong></span><span>{active.length > 0 && labeled.length === active.length ? '라벨링 완료 · 게시 여부는 별도 선택' : '라벨링 진행 중'}</span></div>
    <div className="pw-editor-layout">
      <section className="pw-card pw-image-pane">
        {!diagnostic && <>
          <div className="pw-actions">{workspace.tasks.map((part, index) => <button key={part.task.id} aria-pressed={current.task.id === part.task.id} onClick={() => { setSelectedId(part.crops[0]?.id); setDimensions({}); }}>도말 {index + 1} · {part.task.speciesName}</button>)}</div>
          <div className="pw-smear"><AuthImage src={imageUrl.original(current.task.originalFilename)} alt="도말 이미지. 바운딩박스를 선택하면 해당 세포를 편집합니다." onLoad={e => setDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })} />
            {dimensions.width > 0 && current.crops.map((cell, index) => { const box = parseBox(cell.bbox); if (!box || box.length !== 4) return null; return <button key={cell.id} aria-label={`도말 세포 ${index + 1}${edits[cell.id]?.excluded ? ' 출제 제외' : ''}`} className={`pw-box ${selectedId === cell.id ? 'selected' : ''} ${edits[cell.id]?.excluded ? 'excluded' : ''}`} onClick={() => setSelectedId(cell.id)} style={{ left: `${box[0] / dimensions.width * 100}%`, top: `${box[1] / dimensions.height * 100}%`, width: `${(box[2] - box[0]) / dimensions.width * 100}%`, height: `${(box[3] - box[1]) / dimensions.height * 100}%` }}><span>{index + 1}</span></button>; })}
          </div>
          <div className="pw-actions"><button disabled={busy} onClick={() => template(current)}>라벨 JSON 양식 받기</button><label className="pw-file-button">라벨 파일 가져오기<input type="file" accept=".json,application/json" disabled={busy || readOnly} onChange={e => { importLabels(current.task.id, e.target.files[0]); e.target.value = ''; }} /></label></div>
        </>}
        <div className="pw-filters">{[['ALL', '전체 세포'], ['UNLABELED', '미확정'], ['EXCLUDED', '출제 제외']].map(([key, text]) => <button key={key} aria-pressed={cellFilter === key} onClick={() => setCellFilter(key)}>{text}</button>)}</div>
        <div className="pw-cell-list">{filtered.map(cell => <button key={cell.id} aria-pressed={cell.id === selectedId} onClick={() => setSelectedId(cell.id)}><AuthImage src={imageUrl.crop(cell.cropFilename)} alt="" /><span>세포 {all.indexOf(cell) + 1}<small>{edits[cell.id]?.excluded ? `제외 · ${edits[cell.id]?.exclusionReason}` : edits[cell.id]?.label || '정답 미확정'}</small></span></button>)}</div>
        {!all.length && <p className="pw-empty">탐지된 세포가 없습니다. 다른 이미지를 사용해주세요.</p>}
      </section>
      <fieldset className="pw-card pw-label-pane" disabled={busy || readOnly}><legend>세포 검토</legend>{selected ? <>
        <div className="pw-section-heading"><button onClick={() => move(-1)} aria-label="이전 세포">←</button><strong>세포 {all.indexOf(selected) + 1} / {all.length}</strong><button onClick={() => move(1)} aria-label="다음 세포">→</button></div>
        <AuthImage className="pw-selected-crop" src={imageUrl.crop(selected.cropFilename)} alt={`선택한 세포 ${all.indexOf(selected) + 1}`} />
        <p className="pw-muted">AI 제안: {selected.pseudoLabel || '없음'} · 교수의 정답 확정이 필요합니다.</p>
        <div className="pw-class-options">{cellChoices(selected).map(type => <button key={type.key} aria-pressed={edits[selected.id]?.label === type.key} disabled={edits[selected.id]?.excluded} onClick={() => updateCell(selected.id, { label: type.key })}>{type.label}</button>)}</div>
        <button className="pw-clear" onClick={() => updateCell(selected.id, { label: '' })}>정답 미확정으로 되돌리기</button>
        <div className="pw-exclusion"><label><input type="checkbox" checked={edits[selected.id]?.excluded || false} onChange={e => updateCell(selected.id, { excluded: e.target.checked, exclusionReason: e.target.checked ? '오탐지 · 세포 없음' : '' })} /> 이 세포를 출제에서 제외</label><p>제외된 세포는 학생 문제와 채점·혼동행렬에 포함되지 않습니다.</p>
          {edits[selected.id]?.excluded && <label className="pw-field">제외 사유<select value={edits[selected.id].exclusionReason} onChange={e => updateCell(selected.id, { exclusionReason: e.target.value })}>{['오탐지 · 세포 없음', '위치 이상 · 세포 잘림', '중복 탐지', '화질 불량', '기타'].map(reason => <option key={reason}>{reason}</option>)}</select></label>}
        </div>
      </> : <p>검토할 세포를 선택해주세요.</p>}</fieldset>
    </div>
    <footer className="pw-save-bar"><span>{dirty ? '변경 사항을 임시저장해주세요.' : '저장된 자료는 다음에 이어서 편집할 수 있습니다.'}</span><div className="pw-actions"><button disabled={busy || readOnly} onClick={save}>{busy ? '처리 중…' : '임시저장'}</button><button className="pw-primary" disabled={busy || readOnly || !canPublish || !metadata.title.trim()} onClick={() => setPublishOpen(true)}>게시 설정 확인</button></div></footer>
    {publishOpen && <div className="pw-modal-backdrop"><section className="pw-card pw-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title"><h2 id="publish-title">학생에게 과제를 게시할까요?</h2><h3>{metadata.title}</h3><p>{diagnostic ? '진단평가' : '분류 실습'} · {active.length}문항 · 제외 {excluded}개</p><p>{labeled.length === active.length ? '모든 문항의 정답이 준비되어 자동 채점할 수 있습니다.' : `정답 미확정 ${active.length - labeled.length}문항은 교수 정답 확정 후 채점됩니다.`}</p><p>{metadata.resultsAfterDeadline ? '마감 후 결과 공개' : '최종 제출 및 채점 완료 후 결과 공개'}</p><p>게시 후에는 문항 구성을 고정합니다. 새 구성은 데이터 메뉴에서 복사해 만들 수 있습니다.</p><div className="pw-actions"><button disabled={busy} onClick={() => setPublishOpen(false)}>계속 준비하기</button><button disabled={busy} className="pw-primary" onClick={publish}>{busy ? '게시 중…' : '학생에게 게시'}</button></div></section></div>}
  </section>;
}
