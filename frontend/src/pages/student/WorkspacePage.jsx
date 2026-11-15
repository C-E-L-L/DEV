import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/login/icons';
import AuthImage from '../../components/AuthImage';
import SpeciesBadge from '../../components/SpeciesBadge';
import { DEFAULT_IMAGE_DISPLAY_SETTINGS, useImageDisplaySettings } from '../../components/ImageDisplayControls';
import { cropApi, reportApi, submissionApi } from '../../api';
import { REPORT_REASONS, imageUrl } from '../../constants';
import { answerLabel, cellChoices } from '../../utils/cellClasses';
import { deadlineInfo } from '../../utils/professorDashboard';
import { useStudentData } from './StudentData';
import { SidebarToggle } from './StudentShell';
import SmearViewer, { revealInside } from './SmearViewer';

const LIST_PATH = '/student/assignments';
const DISPLAY_CONTROLS = [
  { key: 'brightness', label: '밝기', min: 50, max: 150 },
  { key: 'contrast', label: '대비', min: 50, max: 180 },
  { key: 'saturation', label: '채도', min: 0, max: 180 },
];

/** The name of a class as this coursework labels it (species can rename classes). */
function labelText(crop, key) {
  if (!key) return '';
  return cellChoices(crop).find(choice => choice.key === key)?.label || answerLabel(key);
}

function ResultView({ item, result }) {
  const tone = !result.total ? 'none' : result.accuracy >= 80 ? 'good' : result.accuracy >= 50 ? 'mid' : 'low';
  const stats = [['정답', result.correct, 'good'], ['오답', result.wrong, 'low'], ['채점된 문항', result.total, 'none']];
  return (
    <div className="prof-main">
      <header className="prof-topbar"><SidebarToggle /><span className="stu-topbar__title">채점 결과</span></header>
      <main className="prof-content stu-result">
        <div className="prof-page-head">
          <div>
            <span className="prof-eyebrow prof-mono">{item.diagnostic ? '진단평가' : '분류 실습'}</span>
            <h1>{item.title}</h1>
            <p>최종 제출한 답안의 채점 결과입니다. 제출한 답안은 수정할 수 없습니다.</p>
          </div>
          <Link to={LIST_PATH} className="prof-btn"><Icon name="arrowLeft" size={15} />과제 목록으로</Link>
        </div>

        <section className="prof-card">
          <div className="prof-card__body">
            <div className="stu-result__summary">
              <div className={`stu-result__main is-${tone}`}>
                <span className="prof-score__label">정답률</span>
                <strong className="prof-mono">{result.total > 0 ? `${result.accuracy}%` : 'N/A'}</strong>
              </div>
              {stats.map(([label, value, statTone]) => (
                <div key={label} className={`stu-result__stat is-${statTone}`}>
                  <span className="prof-score__label">{label}</span>
                  <strong className="prof-mono">{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {result.details?.length > 0 && (
          <section className="prof-card" aria-labelledby="stu-result-detail">
            <header className="prof-card__head">
              <h2 id="stu-result-detail"><Icon name="checkCircle" size={17} />상세 결과</h2>
              <Link to="/student/results" className="prof-link">내 결과 분석에서 도말과 함께 보기 <Icon name="arrowRight" size={14} /></Link>
            </header>
            <ul className="stu-result__grid">
              {result.details.map((detail, index) => {
                const state = detail.isCorrect === null ? 'wait' : detail.isCorrect ? 'good' : 'low';
                return (
                  <li key={detail.cropId ?? index} className={`stu-result__cell is-${state}`}>
                    <AuthImage src={imageUrl.crop(detail.cropFilename)} alt="" className="stu-result__crop" />
                    <span className="stu-result__text">
                      <span>내 답 <strong>{answerLabel(detail.studentLabel)}</strong></span>
                      <span>정답 <strong>{detail.correctLabel || '채점 대기'}</strong></span>
                    </span>
                    <span className={`prof-badge${state === 'good' ? ' is-emerald' : state === 'wait' ? ' is-amber' : ' stu-badge-rose'}`}>
                      {state === 'good' ? '정답' : state === 'wait' ? '대기' : '오답'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function ReportDialog({ crop, username, onClose, onSent }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape' && !sending) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, sending]);

  const send = event => {
    event.preventDefault();
    if (sending) return;
    const text = detail.trim();
    if (reason === '기타' && !text) { setError('기타 사유를 입력해주세요.'); return; }
    setSending(true);
    setError('');
    reportApi.create({ taskId: crop.taskId, cropId: crop.id, studentId: username, reason: text ? `${reason}: ${text}` : reason })
      .then(() => { onSent?.(); alert('신고·질문이 접수되었습니다. 답변은 마이페이지 → 내 질문 관리에서 확인할 수 있습니다.'); onClose(); })
      .catch(() => { setError('신고·질문 접수에 실패했습니다.'); setSending(false); });
  };

  return (
    <div className="stu-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !sending) onClose(); }}>
      <form className="stu-modal__panel" role="dialog" aria-modal="true" aria-labelledby="stu-report-title" onSubmit={send}>
        <h2 id="stu-report-title">질문·이미지 오류 신고</h2>
        <label className="stu-field">
          <span>유형</span>
          <select value={reason} onChange={event => setReason(event.target.value)} disabled={sending}>
            {REPORT_REASONS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="stu-field">
          <span>내용</span>
          <textarea value={detail} onChange={event => setDetail(event.target.value)} rows={4} maxLength={1900} disabled={sending} autoFocus
            placeholder="궁금한 점이나 문제 상황을 입력하세요. (기타 선택 시 필수)" />
        </label>
        {error && <p role="alert" className="stu-modal__error">{error}</p>}
        <p className="prof-muted">답변은 마이페이지 → 내 질문 관리에서 확인할 수 있습니다.</p>
        <div className="stu-modal__actions">
          <button type="button" className="prof-btn" onClick={onClose} disabled={sending}>취소</button>
          <button type="submit" className="prof-btn prof-btn--primary" disabled={sending}><Icon name="send" size={15} />{sending ? '접수 중…' : '보내기'}</button>
        </div>
      </form>
    </div>
  );
}

/**
 * Classification workspace (Stitch layout): task header, smear and cell lists, viewer, classify panel, action bar.
 * The student only ever sees their own answers here. Correct answers and AI predictions are not
 * sent to students before grading, and this screen never reads those fields.
 */
export default function WorkspacePage() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const { username, items, loading: listLoading, refresh, reloadReports } = useStudentData();
  const item = items.find(entry => entry.kind === kind && String(entry.id) === id);

  const [crops, setCrops] = useState([]);
  const [labels, setLabels] = useState({});
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState({ submitted: false, locked: false, reviewAvailable: false });
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [reporting, setReporting] = useState(false);
  const cellList = useRef(null);

  const itemKey = item?.key;
  useEffect(() => {
    if (!item) return undefined;
    let cancelled = false;
    const first = item.tasks[0];
    setStatus('loading'); setCrops([]); setLabels({}); setIndex(0); setResult(null); setSavedAt(null);
    setAttempt({ submitted: false, locked: false, reviewAvailable: false });
    Promise.all([
      item.kind === 'assignment' ? cropApi.getByAssignmentId(item.id) : cropApi.getByTaskId(item.id),
      item.kind === 'assignment' ? submissionApi.getSolvedCropLabelsForAssignment(item.id, username) : submissionApi.getSolvedCropLabels(item.id, username),
      submissionApi.attempt(first.id),
    ]).then(async ([cropsRes, labelsRes, attemptRes]) => {
      if (cancelled) return;
      const loaded = cropsRes.data;
      const saved = labelsRes.data;
      setCrops(loaded); setLabels(saved); setAttempt(attemptRes.data);
      // Continue where the student left off: the first cell without an answer.
      const firstOpen = loaded.findIndex(crop => !saved[crop.id]);
      setIndex(firstOpen !== -1 ? firstOpen : Math.max(0, loaded.length - 1));
      // A single task whose results are already open shows them right away, as before.
      if (item.kind === 'task' && attemptRes.data.reviewAvailable && loaded.length > 0 && loaded.every(crop => saved[crop.id])) {
        const { data } = await submissionApi.getMyResults(item.id, username);
        if (!cancelled) setResult(data);
      }
      if (!cancelled) setStatus('ready');
    }).catch(error => {
      if (cancelled) return;
      console.error('과제 로드 실패:', error);
      setStatus('error');
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey, username]);

  const current = crops[index];
  const first = item?.tasks[0];
  const smearOf = crop => crop?.originalSmearFilename || first?.originalFilename || '';
  const activeSmear = smearOf(current);
  const display = useImageDisplaySettings(activeSmear || `task-${first?.id || 'none'}`);
  const adjusted = DISPLAY_CONTROLS.some(control => display.settings[control.key] !== DEFAULT_IMAGE_DISPLAY_SETTINGS[control.key]);

  // Cells grouped by smear image, in the order the cells arrive.
  const smears = useMemo(() => {
    const groups = new Map();
    crops.forEach((crop, cropIndex) => {
      const filename = crop.originalSmearFilename || first?.originalFilename || '';
      if (!groups.has(filename)) groups.set(filename, { filename, indices: [] });
      groups.get(filename).indices.push(cropIndex);
    });
    return [...groups.values()];
  }, [crops, first]);
  const smearIndex = Math.max(0, smears.findIndex(group => group.filename === activeSmear));
  const smear = smears[smearIndex];
  const solvedIn = group => group.indices.filter(cropIndex => labels[crops[cropIndex].id]).length;

  const solvedCount = crops.filter(crop => labels[crop.id]).length;
  const total = crops.length;
  const percent = total ? Math.round((solvedCount / total) * 100) : 0;
  const allDone = total > 0 && solvedCount >= total;
  const diagnostic = Boolean(item?.diagnostic);
  const locked = attempt.locked || busy;
  const choices = current ? cellChoices(current) : [];
  const due = deadlineInfo(item?.deadlineAt);

  const goToSmear = target => {
    const group = smears[target];
    if (!group) return;
    const open = group.indices.find(cropIndex => !labels[crops[cropIndex].id]);
    setIndex(open !== undefined ? open : group.indices[0]);
  };
  const step = delta => setIndex(value => Math.min(Math.max(0, total - 1), Math.max(0, value + delta)));

  const answer = async label => {
    if (attempt.locked || busy || !current) return;
    const crop = current;
    const wasSolved = Boolean(labels[crop.id]);
    setBusy(true);
    try {
      await submissionApi.submit(crop.id, username, label);
      setLabels(previous => ({ ...previous, [crop.id]: label }));
      setSavedAt(new Date());
      // A first answer moves on to the next open cell; changing an answer stays on the cell.
      if (!wasSolved) {
        const next = crops.findIndex((candidate, candidateIndex) => candidateIndex > index && !labels[candidate.id]);
        if (next !== -1) setIndex(next);
      }
    } catch (error) {
      const message = error?.response?.data?.message || '제출에 실패했습니다.';
      alert(message);
      if (error?.response?.status === 400 && /마감|결과가 공개/.test(message)) {
        refresh(item);
        navigate('/student/results');
      }
    } finally { setBusy(false); }
  };

  const finalize = async () => {
    if (busy || attempt.locked || !allDone) return;
    setBusy(true);
    try {
      const { data: submitted } = await submissionApi.finalize(first.id);
      setAttempt({ ...submitted, locked: true });
      refresh(item);
      if (!submitted.reviewAvailable) {
        alert('최종 제출했습니다. 정답 확정 및 결과 공개 시점 이후 내 결과 분석/확인에서 확인할 수 있습니다.');
        navigate(LIST_PATH);
        return;
      }
      const { data } = item.kind === 'assignment'
        ? await submissionApi.getMyResultsForAssignment(item.id, username)
        : await submissionApi.getMyResults(item.id, username);
      setResult(data);
    } catch (error) {
      alert(error?.response?.data?.message || '최종 제출 또는 결과 조회에 실패했습니다. 다시 시도해주세요.');
    } finally { setBusy(false); }
  };

  // Shortcuts from the design: number keys classify, arrows and Space move between cells.
  const keys = useRef({});
  keys.current = { answer, step, choices, enabled: status === 'ready' && !result && !reporting };
  useEffect(() => {
    const onKey = event => {
      const state = keys.current;
      if (!state.enabled || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target?.isContentEditable) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); state.step(1); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); state.step(-1); return; }
      if (event.key === ' ' && tag !== 'BUTTON' && tag !== 'A') { event.preventDefault(); state.step(1); return; }
      if (event.key === '0') { state.answer('UNKNOWN'); return; }
      const choice = /^[1-9]$/.test(event.key) ? state.choices[Number(event.key) - 1] : null;
      if (choice) state.answer(choice.key);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Keep the selected thumbnail visible in the cell list.
  useEffect(() => {
    revealInside(cellList.current, cellList.current?.querySelector('[aria-current="true"]'));
  }, [index, smearIndex]);

  if (!item) {
    if (listLoading) return <div className="stu-work"><p role="status" className="prof-empty">과제를 불러오는 중…</p></div>;
    return <Navigate to={LIST_PATH} replace />;
  }
  if (result) return <ResultView item={item} result={result} />;

  const submitLabel = attempt.submitted ? '최종 제출 완료 · 결과 공개 대기' : attempt.locked ? '마감된 과제' : '과제 최종 제출';
  const submitHint = attempt.locked ? '제출이 잠긴 과제입니다. 답안을 수정할 수 없습니다.'
    : allDone ? '제출 후에는 답안을 수정할 수 없습니다.' : `모든 세포에 응답하면 제출할 수 있습니다 (현재 ${solvedCount}/${total})`;
  const viewerCells = (smear?.indices || []).map(cropIndex => {
    const crop = crops[cropIndex];
    return {
      id: crop.id, index: cropIndex, number: cropIndex + 1, bbox: crop.bbox,
      state: cropIndex === index ? 'current' : labels[crop.id] ? 'done' : 'todo',
      label: labelText(crop, labels[crop.id]),
    };
  });

  return (
    <div className={`stu-work${diagnostic ? ' is-diagnostic' : ''}`}>
      <header className="stu-work__head">
        <div className="stu-work__head-main">
          <SidebarToggle />
          <Link to={LIST_PATH} className="prof-icon-btn" title="과제 목록으로" aria-label="과제 목록으로"><Icon name="arrowLeft" size={18} /></Link>
          <span className="stu-work__divider" aria-hidden="true" />
          <span className="prof-eyebrow prof-mono">{diagnostic ? '진단평가' : '분류 실습'}</span>
          <h1 title={item.title}>{item.title}</h1>
          {item.deadlineAt && (
            <span className={`prof-badge stu-due is-${due.tone}`} title={`마감 ${new Date(item.deadlineAt).toLocaleString('ko-KR')}`}>
              {due.tone !== 'closed' && <span className="stu-due__dot" aria-hidden="true" />}{due.label}{due.tone !== 'closed' && ' 마감'}
            </span>
          )}
        </div>
        <div className="stu-work__head-side prof-mono">
          <span className="stu-work__head-progress"><span>진행률</span><strong>{solvedCount} / {total} ({percent}%)</strong></span>
          <span className="stu-work__divider" aria-hidden="true" />
          <span className="stu-work__saved" role="status">
            {attempt.locked ? '제출 잠김' : busy ? '저장 중…' : savedAt ? `자동 저장됨 ${savedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : '자동 저장'}
          </span>
        </div>
      </header>

      {status === 'loading' && <p role="status" className="prof-empty stu-work__state">과제를 불러오는 중…</p>}
      {status === 'error' && (
        <div role="alert" className="prof-empty stu-work__state">
          <p>과제를 불러오는데 실패했습니다.</p>
          <Link to={LIST_PATH} className="prof-btn">과제 목록으로</Link>
        </div>
      )}
      {status === 'ready' && !total && (
        <div className="prof-empty stu-work__state"><p>이 과제에는 분류할 세포가 없습니다.</p><Link to={LIST_PATH} className="prof-btn">과제 목록으로</Link></div>
      )}

      {status === 'ready' && current && (
        <>
          <div className="stu-work__body">
            {/* Column 1: smears and the cells of the current smear */}
            <section className="stu-pane stu-pane--left" aria-label="도말과 세포 목록">
              {!diagnostic && (
                <>
                  <header className="stu-pane__head"><h2>도말 리스트</h2><span className="prof-mono">{smears.length}개</span></header>
                  <ul className="stu-smears">
                    {smears.map((group, groupIndex) => {
                      const done = solvedIn(group);
                      const groupPercent = Math.round((done / group.indices.length) * 100);
                      const active = groupIndex === smearIndex;
                      return (
                        <li key={group.filename || groupIndex}>
                          <button type="button" className={`stu-smear${active ? ' is-active' : ''}`} aria-current={active} onClick={() => goToSmear(groupIndex)}>
                            <span className="stu-smear__top">
                              <strong>도말 {groupIndex + 1}</strong>
                              <span className={`prof-mono${groupPercent === 100 ? ' is-done' : ''}`}>{groupPercent === 100 ? '완료' : `${groupPercent}%`}</span>
                            </span>
                            {active && <span className="prof-bar"><span className={groupPercent === 100 ? 'is-done' : ''} style={{ width: `${groupPercent}%` }} /></span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              <header className="stu-pane__head">
                <h2>세포 목록</h2>
                <span className="prof-mono stu-pane__count">{diagnostic ? total - solvedCount : smear.indices.length - solvedIn(smear)}개 남음</span>
              </header>
              <ul className="stu-cells" ref={cellList}>
                {(diagnostic ? crops.map((_, cropIndex) => cropIndex) : smear.indices).map(cropIndex => {
                  const crop = crops[cropIndex];
                  const done = Boolean(labels[crop.id]);
                  const selected = cropIndex === index;
                  return (
                    <li key={crop.id}>
                      <button type="button" className={`stu-cell${selected ? ' is-current' : done ? ' is-done' : ''}`} aria-current={selected}
                        title={done ? `내 답: ${labelText(crop, labels[crop.id])}` : '미분류'} onClick={() => setIndex(cropIndex)}>
                        <AuthImage src={imageUrl.crop(crop.cropFilename)} alt="" className="stu-cell__image" style={{ filter: display.filter }} />
                        <span className="prof-mono">#{cropIndex + 1}</span>
                        {done && <span className="stu-cell__check" aria-hidden="true"><Icon name="check" size={9} /></span>}
                        <span className="prof-sr">{done ? '분류 완료' : '미분류'}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Column 2: the smear viewer (a diagnostic has no smear, only the cell image) */}
            <section className="stu-pane stu-pane--center" aria-label={diagnostic ? '세포 이미지' : '혈액 도말 이미지'}>
              <div className="stu-viewbar">
                <span className="stu-viewbar__title">
                  <Icon name="microscope" size={16} />
                  {diagnostic ? '세포 이미지' : <>도말 <span className="prof-mono">{smearIndex + 1} / {smears.length}</span></>}
                  <SpeciesBadge name={current.speciesName || first.speciesName} code={current.speciesCode || first.speciesCode} compact />
                </span>
                {!diagnostic && smears.length > 1 && (
                  <span className="stu-viewbar__nav">
                    <button type="button" className="prof-btn stu-btn-sm" onClick={() => goToSmear(smearIndex - 1)} disabled={smearIndex <= 0}><Icon name="arrowLeft" size={14} />이전 도말</button>
                    <button type="button" className="prof-btn stu-btn-sm" onClick={() => goToSmear(smearIndex + 1)} disabled={smearIndex >= smears.length - 1}>다음 도말<Icon name="arrowRight" size={14} /></button>
                  </span>
                )}
              </div>

              {diagnostic ? (
                <div className="stu-cropstage">
                  <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-cropstage__image" style={{ filter: display.filter }}
                    loadingText="세포 이미지를 불러오는 중…" errorText="세포 이미지를 불러오지 못했습니다." />
                </div>
              ) : activeSmear ? (
                <SmearViewer filename={activeSmear} filter={display.filter} cells={viewerCells} onSelect={setIndex} hint={`세포 #${index + 1} 선택됨`} />
              ) : <p className="prof-empty">도말 이미지가 없습니다.</p>}

              <div className="stu-statusbar prof-mono">
                <span className="stu-statusbar__legend">
                  <span><i className="is-done" />완료 {solvedCount}</span>
                  <span><i className="is-current" />현재 #{index + 1}</span>
                  <span><i />미분류 {total - solvedCount}</span>
                </span>
                <span className="stu-statusbar__hint">숫자키: 분류 · ←/→: 세포 이동{!diagnostic && ' · 확대 후 드래그: 이동'}</span>
              </div>
            </section>

            {/* Column 3: display adjustment and classification */}
            <section className="stu-pane stu-pane--right" aria-label="세포 분류">
              <div className="stu-adjust">
                <header className="stu-pane__title">
                  <h2>화질 조정</h2>
                  <button type="button" className="stu-textbtn prof-mono" onClick={display.resetSettings} disabled={!adjusted}>초기화</button>
                </header>
                {DISPLAY_CONTROLS.map(control => (
                  <label key={control.key} className="stu-slider">
                    <span>{control.label}</span>
                    <input type="range" min={control.min} max={control.max} value={display.settings[control.key]}
                      onChange={event => display.updateSetting(control.key, event.target.value)} />
                    <span className="prof-mono">{display.settings[control.key]}%</span>
                  </label>
                ))}
              </div>

              <div className="stu-classify">
                <div className="stu-target">
                  <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-target__image" style={{ filter: display.filter }} />
                  <div className="stu-target__text">
                    <span className="stu-target__top">
                      <strong className="prof-mono">Cell #{index + 1}</strong>
                      <span className={`prof-badge${labels[current.id] ? ' is-emerald' : ' is-amber'}`}>{labels[current.id] ? '분류 완료' : '대기'}</span>
                    </span>
                    <small>{labels[current.id] ? `내 답: ${labelText(current, labels[current.id])}` : '아래에서 클래스를 선택하세요'}</small>
                  </div>
                </div>

                <header className="stu-pane__title">
                  <h2>세포 감별 분류</h2>
                  <span className="prof-mono stu-pane__hint">단축키 1~{Math.min(9, choices.length)}</span>
                </header>
                <div className="stu-choices">
                  {choices.map((choice, choiceIndex) => {
                    const selected = labels[current.id] === choice.key;
                    return (
                      <button key={choice.key} type="button" className={`stu-choice${selected ? ' is-selected' : ''}`} aria-pressed={selected}
                        disabled={locked} onClick={() => answer(choice.key)}>
                        <span>{choice.label}</span>
                        {choiceIndex < 9 && <kbd className="prof-mono">{choiceIndex + 1}</kbd>}
                      </button>
                    );
                  })}
                </div>

                <div className="stu-extra">
                  <button type="button" className={`stu-choice stu-choice--unknown${labels[current.id] === 'UNKNOWN' ? ' is-selected' : ''}`}
                    aria-pressed={labels[current.id] === 'UNKNOWN'} disabled={locked} onClick={() => answer('UNKNOWN')}>
                    <span>모르겠어요로 응답</span><kbd className="prof-mono">0</kbd>
                  </button>
                  <p className="prof-muted">모르겠어요도 응답 완료로 저장됩니다. 점수에는 오답으로 반영되며 클래스 혼동행렬에서는 제외됩니다.</p>
                  <button type="button" className="prof-btn stu-report-btn" onClick={() => setReporting(true)}><Icon name="help" size={15} />질문·이미지 오류 신고</button>
                </div>
              </div>
            </section>
          </div>

          <footer className="stu-work__foot">
            <div className="stu-foot__progress">
              <div>
                <strong>{diagnostic ? '진단평가' : <>현재 도말 <span className="prof-mono">{smearIndex + 1}</span></>}</strong>
                <small><span className="prof-mono">{solvedCount} / {total}</span> 세포 분류 완료</small>
              </div>
              <span className="prof-bar" role="progressbar" aria-label="전체 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                <span className={allDone ? 'is-done' : ''} style={{ width: `${percent}%` }} />
              </span>
              <span className="prof-mono stu-foot__percent">{percent}%</span>
            </div>

            <div className="stu-foot__stepper">
              <button type="button" className="prof-btn" onClick={() => step(-1)} disabled={index === 0}><Icon name="arrowLeft" size={15} /><span>이전 세포</span></button>
              <span className="stu-foot__position prof-mono"><strong>Cell {index + 1}</strong> / {total}</span>
              <button type="button" className="prof-btn" onClick={() => step(1)} disabled={index >= total - 1}><span>다음 세포</span><kbd className="prof-mono">Space</kbd><Icon name="arrowRight" size={15} /></button>
            </div>

            <div className="stu-foot__submit">
              <span className="prof-muted">{submitHint}</span>
              <button type="button" className="prof-btn prof-btn--primary" onClick={finalize} disabled={!allDone || attempt.locked || busy} title={submitHint}>
                <Icon name="send" size={15} />{submitLabel}
              </button>
            </div>
          </footer>
        </>
      )}

      {reporting && current && <ReportDialog crop={current} username={username} onClose={() => setReporting(false)} onSent={reloadReports} />}
    </div>
  );
}
