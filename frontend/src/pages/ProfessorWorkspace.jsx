import { useCallback, useEffect, useState } from 'react';
import { taskApi, speciesApi, diagnosticApi, labelingApi } from '../api';
import { courseworkApi } from '../api/coursework';
import { distributeQuestions, groupCoursework, isDiagnostic } from '../utils/coursework';
import CourseworkEditor from '../components/CourseworkEditor';
import AnalyticsFeedback from '../components/AnalyticsFeedback';
import StudentManagement from '../components/StudentManagement';
import ReportsPanel from '../components/ReportsPanel';
import SpeciesDataSettings from '../components/SpeciesDataSettings';
import AuthImage from '../components/AuthImage';
import { imageUrl } from '../constants';
import './ProfessorWorkspace.css';

const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';

export default function ProfessorWorkspace() {
  const [tab, setTab] = useState('coursework');
  const [species, setSpecies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [data, setData] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [analysisId, setAnalysisId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [s, t, d] = await Promise.all([speciesApi.getAll(), taskApi.getAll(), courseworkApi.data()]);
      setSpecies(s.data); setTasks(t.data); setData(d.data);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const leave = () => !dirty || window.confirm('저장하지 않은 변경 사항이 있습니다. 저장하지 않고 이동할까요?');
  const navigate = next => { if (!leave()) return; setDirty(false); setTab(next); setEditing(null); setCreating(false); setAnalysisId(null); setFilter('ALL'); };
  const edit = id => { setCreating(false); setEditing(id); setAnalysisId(null); setDirty(false); };
  const copy = async id => { try { const { data } = await courseworkApi.copy(id); edit(data.id); setTab('coursework'); await reload(); } catch (e) { setError(errorMessage(e)); } };
  const groups = groupCoursework(tasks).filter(group => filter === 'ALL' || (filter === 'DRAFT' ? group.status === 'DRAFT' : group.status !== 'DRAFT'));
  const smears = data.filter(task => filter !== 'LABELED' || (task.cropCount > 0 && task.labeledCount === task.cropCount));

  return <main className="professor-workspace">
    <header className="pw-header"><div><p className="pw-eyebrow">C.E.L.L. · 교수</p><h1>수업과 데이터 관리</h1><p>자료 준비부터 학생 피드백까지 한곳에서 진행하세요.</p></div></header>
    <nav className="pw-nav" aria-label="교수 메뉴">{[['coursework', '과제'], ['students', '학생'], ['reports', '질문·신고'], ['data', '데이터'], ['settings', '설정']].map(([key, label]) =>
      <button key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => navigate(key)}>{label}</button>)}</nav>
    {error && <div role="alert" className="pw-error">{error} <button onClick={reload}>다시 불러오기</button></div>}
    {editing ? <CourseworkEditor key={editing} id={editing} onDirty={setDirty} onBack={() => { if (leave()) { setEditing(null); setDirty(false); reload(); } }} onPublished={() => { setEditing(null); setDirty(false); setTab('coursework'); reload(); }} /> :
      tab === 'coursework' ? <>
        {analysisId ? <><button onClick={() => setAnalysisId(null)}>← 과제 목록</button><AnalyticsFeedback initialTaskId={analysisId} courseworkOnly /></> :
        creating ? <CourseworkCreator species={species.filter(s => s.active !== false)} onCancel={() => setCreating(false)} onCreated={id => { edit(id); reload(); }} /> : <>
          <div className="pw-section-heading"><div><h2>과제</h2><p>작성 중인 과제는 학생에게 보이지 않습니다. 게시할 때 공개됩니다.</p></div><button className="pw-primary" onClick={() => setCreating(true)}>+ 과제 만들기</button></div>
          <div className="pw-filters">{[['ALL', '전체'], ['DRAFT', '작성 중'], ['PUBLISHED', '게시됨']].map(([key, text]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}</button>)}</div>
          {loading ? <p role="status">과제를 불러오는 중…</p> : !groups.length ? <div className="pw-empty">표시할 과제가 없습니다. 과제를 만들어보세요.</div> : <div className="pw-cards">{groups.map(group => <article className="pw-card" key={group.id}>
            <div className="pw-card-top"><span className={`pw-badge ${isDiagnostic(group) ? 'diagnostic' : ''}`}>{isDiagnostic(group) ? '진단평가' : '분류 실습'}</span><span className="pw-badge">{group.status === 'DRAFT' ? '작성 중 · 비공개' : '게시됨'}</span></div>
            <h3>{group.title || (isDiagnostic(group) ? '진단평가' : '분류 실습')}</h3>
            <p>{[...new Set(group.tasks.map(t => t.speciesName))].join(', ')} · {isDiagnostic(group) ? '' : `도말 ${group.tasks.length}장 · `}{group.cropCount}문항</p>
            <p>정답 확정 {group.labeledCount}/{group.cropCount} · 출제 제외 {group.excludedCount}</p>
            <p>{group.deadlineAt ? `마감 ${new Date(group.deadlineAt).toLocaleString('ko-KR')}` : '마감일 없음'}</p>
            <div className="pw-actions">{group.status === 'DRAFT' ? <button className="pw-primary" onClick={() => edit(group.id)}>이어서 준비하기</button> : <button onClick={() => setAnalysisId(group.id)}>응답·채점 결과</button>}</div>
          </article>)}</div>}
        </>}
      </> : tab === 'data' ? <>
        <div className="pw-section-heading"><div><h2>도말 데이터</h2><p>라벨링한 자료를 확인하고 새 과제로 복사할 수 있습니다. 기존 학생 기록은 유지됩니다.</p></div><button onClick={reload}>새로고침</button></div>
        <div className="pw-filters">{[['ALL', '전체 자료'], ['LABELED', '라벨링 완료']].map(([key, text]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{text}</button>)}</div>
        <div className="pw-cards">{smears.map(task => <article className="pw-card" key={task.id}>
          <AuthImage className="pw-data-image" src={imageUrl.original(task.originalFilename)} alt={task.uploadedFilename || '도말 이미지'} />
          <h3>{task.uploadedFilename}</h3><p>{task.speciesName} · 정답 확정 {task.labeledCount}/{task.cropCount} · 제외 {task.excludedCount}</p>
          <span className="pw-badge">{task.cropCount > 0 && task.labeledCount === task.cropCount ? '라벨링 완료' : '라벨링 진행 중'}</span>
          <div className="pw-actions">{task.status === 'DRAFT' && <button onClick={() => edit(task.id)}>라벨링 이어하기</button>}<button onClick={() => copy(task.id)}>새 과제로 사용</button></div>
        </article>)}</div>{!loading && !smears.length && <div className="pw-empty">해당하는 도말 자료가 없습니다.</div>}
      </> : tab === 'students' ? <StudentManagement /> : tab === 'reports' ? <ReportsPanel /> : <section className="pw-card"><h2>데이터 설정</h2><SpeciesDataSettings species={species} onSaved={reload} /></section>}
  </main>;
}

function CourseworkCreator({ species, onCancel, onCreated }) {
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
