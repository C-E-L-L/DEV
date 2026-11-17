import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { labelingApi } from '../../../api';
import { courseworkApi } from '../../../api/coursework';
import AuthImage from '../../../components/AuthImage';
import { useImageDisplaySettings } from '../../../components/ImageDisplayControls';
import Icon from '../../../components/login/icons';
import { imageUrl } from '../../../constants';
import { cellChoices } from '../../../utils/cellClasses';
import { isDiagnostic, savePayload } from '../../../utils/coursework';
import { deadlineInfo } from '../../../utils/professorDashboard';
import { editStatus, fillFromAi, labelingCounts, nextIndex, publishBlocker } from '../../../utils/review';
import SmearViewer, { revealInside } from '../../student/SmearViewer';
import {
  AdjustPanel, Flash, MoreMenu, SmearThumb, Stepper, Switch, WorkHeader, WorkModal, errorMessage, isAdjusted, timeText, useWorkKeys,
} from './ReviewParts';

const REASONS = ['오탐지 · 세포 없음', '위치 이상 · 세포 잘림', '중복 탐지', '화질 불량', '기타'];
const FILTERS = [['ALL', '전체'], ['OPEN', '미확정'], ['EXCLUDED', '제외']];
const SAVE_FAILED = '저장하지 못했습니다. 다시 시도해주세요.';

function parseBox(value) {
  try { const box = typeof value === 'string' ? JSON.parse(value.replaceAll("'", '"')) : value; return box?.flat(); } catch { return null; }
}

const metadataOf = task => ({
  title: task.title || '',
  deadlineAt: task.deadlineAt?.slice(0, 16) || '',
  requireLabels: task.requireLabels || isDiagnostic(task),
  resultsAfterDeadline: task.resultsAfterDeadline || false,
});

/** Title, deadline and the two publishing options, in a small window opened from the header. */
function SettingsDialog({ metadata, diagnostic, onApply, onClose }) {
  const [draft, setDraft] = useState(metadata);
  const set = patch => setDraft(value => ({ ...value, ...patch }));
  return (
    <WorkModal title="과제 설정" onClose={onClose} actions={<>
      <button type="button" className="prof-btn" onClick={onClose}>취소</button>
      <button type="button" className="prof-btn prof-btn--primary" disabled={!draft.title.trim()} onClick={() => onApply(draft)}>적용</button>
    </>}>
      <label className="stu-field"><span>과제 제목</span>
        <input value={draft.title} maxLength={200} autoFocus onChange={event => set({ title: event.target.value })} />
      </label>
      <label className="stu-field"><span>마감일 (선택)</span>
        <span className="rv-inline">
          <input type="datetime-local" value={draft.deadlineAt} onChange={event => set({ deadlineAt: event.target.value })} />
          {draft.deadlineAt && <button type="button" className="prof-link-btn" onClick={() => set({ deadlineAt: '' })}>지우기</button>}
        </span>
      </label>
      {diagnostic
        ? <p className="prof-muted">진단평가는 모든 문항의 정답을 확정해야 게시할 수 있습니다.</p>
        : <Switch checked={draft.requireLabels} onChange={value => set({ requireLabels: value })} label="모든 문항의 정답을 확정해야 게시"
            note="끄면 정답 없이 게시할 수 있고, 학생 응답은 정답을 확정할 때 채점됩니다." />}
      <Switch checked={draft.resultsAfterDeadline} onChange={value => set({ resultsAfterDeadline: value })} label="결과는 마감 후 공개"
        note="켜면 마감 전에는 학생에게 정답과 점수를 보여주지 않습니다." />
      <p className="prof-muted">적용한 설정은 임시저장하거나 게시할 때 저장됩니다.</p>
    </WorkModal>
  );
}

/**
 * Labeling a draft coursework in the student workspace's frame: smears and cells on the left, the
 * smear in the middle, the selected cell on the right. The professor confirms each cell's answer or
 * leaves the cell out, then publishes. Published coursework opens read-only.
 */
export default function LabelingWorkspace({ id, basePath, onBack, onDirty, onPublished }) {
  const [workspace, setWorkspace] = useState(null);
  const [metadata, setMetadata] = useState({ title: '', deadlineAt: '', requireLabels: false, resultsAfterDeadline: false });
  const [edits, setEdits] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [autoNext, setAutoNext] = useState(true);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // 'settings' | 'publish'
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [flash, setFlash] = useState(null);
  const [loadError, setLoadError] = useState('');
  const cellList = useRef(null);

  const apply = data => {
    setWorkspace(data);
    setMetadata(metadataOf(data.tasks[0].task));
    const crops = data.tasks.flatMap(part => part.crops);
    setEdits(Object.fromEntries(crops.map(crop => [crop.id, { label: crop.finalLabel || '', excluded: crop.excluded || false, exclusionReason: crop.exclusionReason || '' }])));
    // Keep the cell in view; on first load start at the first cell still without an answer.
    setSelectedId(current => (crops.some(crop => crop.id === current) ? current
      : (crops.find(crop => !crop.excluded && !crop.finalLabel) || crops[0])?.id ?? null));
    setDirty(false); onDirty(false);
  };

  useEffect(() => {
    let active = true;
    courseworkApi.get(id).then(({ data }) => active && apply(data)).catch(error => active && setLoadError(errorMessage(error, '과제를 불러오지 못했습니다.')));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const parts = workspace?.tasks || [];
  const all = parts.flatMap(part => part.crops);
  const index = Math.max(0, all.findIndex(crop => crop.id === selectedId));
  const current = all[index];
  const part = parts.find(item => item.crops.some(crop => crop.id === current?.id)) || parts[0];
  const first = parts[0]?.task;
  const diagnostic = isDiagnostic(first);
  const readOnly = Boolean(first && first.status !== 'DRAFT');
  const counts = labelingCounts(all, edits);
  const blocker = publishBlocker({ title: metadata.title, counts, mustLabel: metadata.requireLabels || diagnostic });
  const display = useImageDisplaySettings(part?.task.originalFilename || `task-${first?.id || 'none'}`);
  const adjusted = isAdjusted(display.settings);

  useEffect(() => {
    revealInside(cellList.current, cellList.current?.querySelector('[aria-current="true"]'));
  }, [selectedId, filter]);

  const changed = () => { setDirty(true); onDirty(true); setFlash(null); };
  const updateCell = (cropId, patch) => { setEdits(value => ({ ...value, [cropId]: { ...value[cropId], ...patch } })); changed(); };
  const step = delta => { const next = all[Math.min(all.length - 1, Math.max(0, index + delta))]; if (next) setSelectedId(next.id); };

  const choose = key => {
    if (readOnly || !current || edits[current.id]?.excluded) return;
    const wasOpen = editStatus(edits[current.id]) === 'open';
    const next = { ...edits, [current.id]: { ...edits[current.id], label: key } };
    updateCell(current.id, { label: key });
    if (autoNext && wasOpen) {
      const target = nextIndex(all, index, crop => editStatus(next[crop.id]) === 'open');
      if (target !== -1) setSelectedId(all[target].id);
    }
  };
  const clearLabel = () => { if (!readOnly && current && edits[current.id]?.label && !edits[current.id]?.excluded) updateCell(current.id, { label: '' }); };
  const toggleExcluded = () => {
    if (readOnly || !current) return;
    const excluded = !edits[current.id]?.excluded;
    updateCell(current.id, { excluded, exclusionReason: excluded ? REASONS[0] : '' });
  };

  const save = async () => {
    setBusy(true); setFlash(null);
    try {
      const { data } = await courseworkApi.save(id, savePayload(workspace, metadata, edits));
      apply(data); setSavedAt(new Date());
      setFlash({ kind: 'ok', text: '임시저장했습니다. 학생에게는 공개되지 않았습니다.' });
      return data;
    } catch (error) { setFlash({ kind: 'error', text: errorMessage(error, SAVE_FAILED) }); return null; } finally { setBusy(false); }
  };
  const publish = async () => {
    setBusy(true); setFlash(null);
    try { await courseworkApi.publish(id, savePayload(workspace, metadata, edits)); setDirty(false); onDirty(false); onPublished(); }
    catch (error) { setFlash({ kind: 'error', text: errorMessage(error, '게시하지 못했습니다. 다시 시도해주세요.') }); setDialog(null); } finally { setBusy(false); }
  };
  const importLabels = async file => {
    let manifest;
    try { manifest = JSON.parse(await file.text()); } catch { setFlash({ kind: 'error', text: '라벨 파일을 읽을 수 없습니다. JSON 형식을 확인해주세요.' }); return; }
    if (dirty && !await save()) return;
    setBusy(true); setFlash(null);
    try {
      const imported = await labelingApi.importTask(part.task.id, manifest);
      const { data } = await courseworkApi.get(id); apply(data);
      setFlash({ kind: 'ok', text: `${imported.data.updated}개 라벨을 저장했습니다. 게시하려면 '게시 설정 확인'을 선택하세요.` });
    } catch (error) { setFlash({ kind: 'error', text: errorMessage(error, '라벨 파일을 가져오지 못했습니다.') }); } finally { setBusy(false); }
  };
  const downloadTemplate = () => {
    const contents = { annotations: part.crops.map(crop => ({ cropId: crop.id, bbox: parseBox(crop.bbox), label: edits[crop.id]?.label || null })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(contents, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `smear-${part.task.id}-labels.json`; link.click(); URL.revokeObjectURL(url);
  };
  const fillable = fillFromAi(all, edits, cellChoices).filled;
  const fillAi = () => {
    if (!window.confirm(`정답이 비어 있는 세포 ${fillable}개에 AI 제안을 정답으로 채웁니다.\n채운 뒤 하나씩 확인하고 임시저장하세요.`)) return;
    setEdits(fillFromAi(all, edits, cellChoices).edits); changed();
    setFlash({ kind: 'ok', text: `AI 제안 ${fillable}개를 채웠습니다. 확인한 뒤 임시저장하세요.` });
  };

  useWorkKeys((event, tag) => {
    if (!current || dialog) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); return; }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); return; }
    if (event.key === ' ' && tag !== 'BUTTON' && tag !== 'A') { event.preventDefault(); step(1); return; }
    if (readOnly) return;
    if (event.key === '0') { clearLabel(); return; }
    if (event.key === 'x' || event.key === 'X') { toggleExcluded(); return; }
    const choice = /^[1-9]$/.test(event.key) ? cellChoices(current)[Number(event.key) - 1] : null;
    if (choice) choose(choice.key);
  });

  const back = <WorkHeader title="도말 검토·라벨링" onBack={onBack} backLabel="과제 목록으로" />;
  if (!workspace) {
    return (
      <div className="stu-work rv-work">
        {back}
        <div className="prof-empty stu-work__state" role={loadError ? 'alert' : 'status'}>
          <p>{loadError || '과제를 불러오는 중…'}</p>
          {loadError && <button type="button" className="prof-btn" onClick={onBack}>과제 목록으로</button>}
        </div>
      </div>
    );
  }

  const due = deadlineInfo(metadata.deadlineAt);
  const listed = (diagnostic ? all : part.crops).filter(crop => {
    const status = editStatus(edits[crop.id]);
    return filter === 'ALL' || (filter === 'OPEN' ? status === 'open' : status === 'excluded');
  });
  const here = labelingCounts(diagnostic ? all : part.crops, edits);
  const edit = edits[current?.id] || {};
  const status = editStatus(edit);
  const choices = current ? cellChoices(current) : [];
  const number = crop => all.indexOf(crop) + 1;
  const viewerCells = (part?.crops || []).map(crop => {
    const cellStatus = editStatus(edits[crop.id]);
    const n = number(crop);
    const label = edits[crop.id]?.label;
    return {
      id: crop.id, index: all.indexOf(crop), number: n, bbox: crop.bbox,
      state: crop.id === current?.id ? 'current' : cellStatus === 'labeled' ? 'done' : 'todo',
      tone: cellStatus === 'excluded' && crop.id !== current?.id ? 'excluded' : undefined,
      tag: cellStatus === 'labeled' ? `${n} ${label}` : cellStatus === 'excluded' ? `${n} 제외` : n,
      description: cellStatus === 'labeled' ? `정답 ${label}` : cellStatus === 'excluded' ? `출제 제외 · ${edits[crop.id].exclusionReason}` : '정답 미확정',
    };
  });
  const confidence = current?.aiClassificationConfidence;
  const goToSmear = target => {
    const next = parts[target];
    if (!next) return;
    setSelectedId((next.crops.find(crop => editStatus(edits[crop.id]) === 'open') || next.crops[0])?.id ?? selectedId);
  };
  const smearIndex = parts.indexOf(part);
  const percent = counts.active ? Math.round((counts.labeled / counts.active) * 100) : 0;

  return (
    <div className={`stu-work rv-work${diagnostic ? ' is-diagnostic' : ''}`}>
      <WorkHeader title={metadata.title || '제목 없는 과제'} onBack={onBack} backLabel="과제 목록으로"
        status={(
          // The badge already says "임시저장 · 비공개"; this line only adds news: saving, unsaved changes, or when it was saved.
          <span className={`stu-work__saved prof-mono${dirty ? ' rv-saved--dirty' : ''}`} role="status">
            {busy ? '저장 중…' : dirty ? '● 저장 안 된 변경' : savedAt ? `● 임시저장 ${timeText(savedAt)}` : ''}
          </span>
        )}
        menu={<MoreMenu label="과제 메뉴" items={[
          !readOnly && { key: 'settings', icon: 'settings', text: '과제 설정', onClick: () => setDialog('settings') },
          !diagnostic && { key: 'template', icon: 'download', text: '라벨 JSON 양식 받기', onClick: downloadTemplate, disabled: busy },
          !diagnostic && !readOnly && { key: 'import', icon: 'upload', text: '라벨 파일 가져오기', disabled: busy, file: { accept: '.json,application/json', onFile: importLabels } },
          !readOnly && { key: 'ai', icon: 'sparkles', text: `빈 정답에 AI 제안 채우기${fillable ? ` (${fillable})` : ''}`, onClick: fillAi, disabled: busy || !fillable,
            title: fillable ? undefined : '정답이 비어 있고 AI 제안이 있는 세포가 없습니다.' },
        ]} />}>
        {!readOnly && (
          <button type="button" className="prof-icon-btn prof-icon-btn--sm" onClick={() => setDialog('settings')} title="과제 설정" aria-label="과제 설정 (제목·마감일·공개 방식)">
            <Icon name="edit" size={14} />
          </button>
        )}
        <span className={`prof-badge${readOnly ? ' is-emerald' : ''}`}>{readOnly ? '게시됨' : '임시저장 · 비공개'}</span>
        {diagnostic && <span className="prof-badge is-indigo">진단평가</span>}
        <button type="button" className="rv-headlink prof-mono" onClick={() => setDialog('settings')} disabled={readOnly} title={readOnly ? undefined : '마감일 변경'}>
          {metadata.deadlineAt ? `마감 ${due.dateText}` : '마감 없음'}
        </button>
      </WorkHeader>

      <Flash flash={flash} onClose={() => setFlash(null)} />

      {!all.length ? (
        <div className="prof-empty stu-work__state"><p>탐지된 세포가 없습니다. 데이터 메뉴에서 다른 도말로 과제를 만들어주세요.</p></div>
      ) : (
        <div className="stu-work__body">
          <section className="stu-pane stu-pane--left" aria-label="도말과 세포 목록">
            {!diagnostic && (
              <>
                <header className="stu-pane__head"><h2>도말 리스트</h2><span className="prof-mono">{parts.length}개</span></header>
                <ul className="stu-smears">
                  {parts.map((item, itemIndex) => {
                    const c = labelingCounts(item.crops, edits);
                    const active = item === part;
                    const done = c.active > 0 && c.open === 0;
                    return (
                      <li key={item.task.id}>
                        <button type="button" className={`stu-smear${active ? ' is-active' : ''}`} aria-current={active} onClick={() => goToSmear(itemIndex)}
                          title={item.task.uploadedFilename || item.task.originalFilename || undefined}>
                          <SmearThumb filename={item.task.originalFilename} />
                          <span className="stu-smear__body">
                            <span className="stu-smear__top">
                              <strong>도말 {itemIndex + 1}</strong>
                              <span className={`prof-mono${done ? ' is-done' : ''}`}>{c.labeled}/{c.active}</span>
                            </span>
                            {item.task.speciesName && <span className="stu-smear__sub">{item.task.speciesName}</span>}
                            {active && <span className="prof-bar"><span className={done ? 'is-done' : ''} style={{ width: `${c.active ? (c.labeled / c.active) * 100 : 0}%` }} /></span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
            <header className="stu-pane__head">
              <h2>세포 목록</h2>
              <span className={`prof-mono stu-pane__count${here.open ? ' rv-count--open' : ''}`}>{here.open ? `미확정 ${here.open}` : '모두 확정'}</span>
            </header>
            <div className="rv-chips" role="group" aria-label="세포 거르기">
              {FILTERS.map(([key, text]) => (
                <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                  {text} <span className="prof-mono">{key === 'ALL' ? here.total : key === 'OPEN' ? here.open : here.excluded}</span>
                </button>
              ))}
            </div>
            <ul className="stu-cells" ref={cellList}>
              {listed.map(crop => {
                const cellStatus = editStatus(edits[crop.id]);
                const selected = crop.id === current?.id;
                const label = edits[crop.id]?.label;
                return (
                  <li key={crop.id}>
                    <button type="button" aria-current={selected}
                      className={`stu-cell${selected ? ' is-current' : cellStatus === 'labeled' ? ' is-done' : ''}${cellStatus === 'excluded' ? ' rv-cell--excluded' : ''}`}
                      title={cellStatus === 'labeled' ? `정답: ${label}` : cellStatus === 'excluded' ? `출제 제외 · ${edits[crop.id].exclusionReason}` : '정답 미확정'}
                      onClick={() => setSelectedId(crop.id)}>
                      <AuthImage src={imageUrl.crop(crop.cropFilename)} alt="" className="stu-cell__image" style={{ filter: display.filter }} />
                      <span className="prof-mono">#{number(crop)}</span>
                      {cellStatus === 'labeled' && <span className="stu-cell__check" aria-hidden="true"><Icon name="check" size={9} /></span>}
                      {cellStatus === 'excluded' && <span className="rv-cell__mark is-excluded" aria-hidden="true"><Icon name="ban" size={10} /></span>}
                      {cellStatus === 'open' && <span className="rv-cell__mark is-open" aria-hidden="true" />}
                      <span className="prof-sr">{cellStatus === 'labeled' ? `정답 ${label}` : cellStatus === 'excluded' ? '출제 제외' : '정답 미확정'}</span>
                    </button>
                  </li>
                );
              })}
              {!listed.length && <li className="rv-cells__empty">{filter === 'OPEN' ? '정답이 비어 있는 세포가 없습니다.' : '출제에서 뺀 세포가 없습니다.'}</li>}
            </ul>
          </section>

          <section className="stu-pane stu-pane--center" aria-label={diagnostic ? '세포 이미지' : '혈액 도말 이미지'}>
            {diagnostic ? (
              <div className="stu-cropstage">
                <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-cropstage__image" style={{ filter: display.filter }}
                  loadingText="세포 이미지를 불러오는 중…" errorText="세포 이미지를 불러오지 못했습니다." />
              </div>
            ) : part.task.originalFilename ? (
              <SmearViewer filename={part.task.originalFilename} filter={display.filter} cells={viewerCells} onSelect={cellIndex => setSelectedId(all[cellIndex].id)} />
            ) : <p className="prof-empty">도말 이미지가 없습니다.</p>}
            {!diagnostic && parts.length > 1 && (
              <div className="stu-smearnav prof-mono" role="group" aria-label="도말 이동">
                <button type="button" onClick={() => goToSmear(smearIndex - 1)} disabled={smearIndex <= 0} title="이전 도말" aria-label="이전 도말"><Icon name="arrowLeft" size={14} /></button>
                <span>도말 {smearIndex + 1} / {parts.length}</span>
                <button type="button" onClick={() => goToSmear(smearIndex + 1)} disabled={smearIndex >= parts.length - 1} title="다음 도말" aria-label="다음 도말"><Icon name="arrowRight" size={14} /></button>
              </div>
            )}
          </section>

          <section className="stu-pane stu-pane--right" aria-label="세포 검토">
            <div className="stu-classify">
              <figure className="stu-target">
                <AuthImage key={current.id} src={imageUrl.crop(current.cropFilename)} alt={`세포 ${index + 1}`} className="stu-target__image" style={{ filter: display.filter }} />
                <figcaption className="stu-target__text">
                  <span className="stu-target__top">
                    <strong className="prof-mono">Cell #{index + 1}</strong>
                    <span className={`prof-badge${status === 'labeled' ? ' is-emerald' : status === 'open' ? ' is-amber' : ''}`}>
                      {status === 'labeled' ? '정답 확정' : status === 'open' ? '미확정' : '출제 제외'}
                    </span>
                    <span className="rv-target__pos prof-mono">{index + 1} / {all.length}</span>
                  </span>
                  <small>
                    {current.pseudoLabel ? <>AI 제안 <strong className="rv-ai-text">{current.pseudoLabel}</strong>{confidence != null && ` (신뢰도 ${Math.round(confidence > 1 ? confidence : confidence * 100)}%)`}</> : 'AI 제안 없음'}
                    {(current.speciesName || part?.task.speciesName) && ` · ${current.speciesName || part.task.speciesName}`}
                  </small>
                </figcaption>
              </figure>

              <header className="stu-pane__title"><h2>정답 확정</h2>{!readOnly && <span className="rv-hint">단축키 1–{Math.min(choices.length, 9)}</span>}</header>
              <div className="stu-choices">
                {choices.map((choice, choiceIndex) => {
                  const selected = edit.label === choice.key;
                  return (
                    <button key={choice.key} type="button" className={`stu-choice${selected ? ' is-selected' : ''}`} aria-pressed={selected}
                      disabled={readOnly || edit.excluded || busy} onClick={() => choose(choice.key)}>
                      <span className="rv-choice__name">{choice.label}{current.pseudoLabel === choice.key && <em className="rv-ai" title="AI 제안">AI</em>}</span>
                      {choiceIndex < 9 && <kbd className="prof-mono">{choiceIndex + 1}</kbd>}
                    </button>
                  );
                })}
                <button type="button" className="stu-choice stu-choice--unknown" disabled={readOnly || edit.excluded || !edit.label || busy} onClick={clearLabel}>
                  <span>정답 미확정으로 되돌리기</span><kbd className="prof-mono">0</kbd>
                </button>
              </div>
              {!readOnly && (
                <label className="rv-check"><input type="checkbox" className="prof-check" checked={autoNext} onChange={event => setAutoNext(event.target.checked)} />고르면 다음 미확정 세포로 이동</label>
              )}

              <div className="stu-tools">
                <button type="button" className={`stu-tool${adjustOpen || adjusted ? ' is-on' : ''}`} aria-expanded={adjustOpen} onClick={() => setAdjustOpen(value => !value)}>
                  <Icon name="contrast" size={14} />화질 조정{adjusted && <span className="stu-tool__dot" aria-label="조정됨" />}
                </button>
                <button type="button" className={`stu-tool rv-tool--exclude${edit.excluded ? ' is-on' : ''}`} aria-pressed={Boolean(edit.excluded)} disabled={readOnly || busy} onClick={toggleExcluded}
                  title="오탐지·잘린 세포처럼 문제로 내지 않을 세포 (X)">
                  <Icon name="ban" size={14} />{edit.excluded ? '출제 제외됨' : '출제에서 제외'}
                </button>
              </div>
              {adjustOpen && <AdjustPanel display={display} />}
              {edit.excluded && (
                <div className="rv-exclude">
                  <label className="stu-field"><span>제외 사유</span>
                    <select value={edit.exclusionReason} disabled={readOnly || busy} onChange={event => updateCell(current.id, { exclusionReason: event.target.value })}>
                      {REASONS.map(reason => <option key={reason}>{reason}</option>)}
                    </select>
                  </label>
                  <p>제외한 세포는 학생 문제와 채점·혼동행렬에 들어가지 않습니다.</p>
                </div>
              )}
              <p className="rv-keys">{readOnly ? '←/→ 세포 이동' : '←/→ 이동 · 1–6 정답 · 0 미확정 · X 출제 제외'}</p>
            </div>
          </section>
        </div>
      )}

      <footer className="stu-work__foot">
        <div className="stu-foot__progress">
          <span>정답 확정</span>
          <span className="prof-mono"><strong>{counts.labeled}</strong> / {counts.active}</span>
          <span className="prof-bar" role="progressbar" aria-label="정답 확정 진행률" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <span className={counts.active && !counts.open ? 'is-done' : ''} style={{ width: `${percent}%` }} />
          </span>
          {counts.excluded > 0 && <span className="prof-badge prof-mono">제외 {counts.excluded}</span>}
        </div>
        {all.length > 0 && <Stepper index={index} total={all.length} onStep={step} />}
        <div className="stu-foot__submit">
          {readOnly ? (
            <>
              <span className="prof-muted">게시된 과제는 문항 구성을 바꿀 수 없습니다.</span>
              <Link to={`${basePath}/assignments/${id}/results`} className="prof-btn prof-btn--primary">결과·정답 확정으로<Icon name="arrowRight" size={15} /></Link>
            </>
          ) : (
            <>
              {blocker && <span className="rv-blocker" title="게시하려면 해결해야 합니다">{blocker}</span>}
              <button type="button" className="prof-btn" disabled={busy} onClick={save}>{busy ? '처리 중…' : '임시저장'}</button>
              <button type="button" className="prof-btn prof-btn--primary" disabled={busy || Boolean(blocker)} onClick={() => setDialog('publish')}>
                게시 설정 확인<Icon name="chevronRight" size={15} />
              </button>
            </>
          )}
        </div>
      </footer>

      {dialog === 'settings' && (
        <SettingsDialog metadata={metadata} diagnostic={diagnostic} onClose={() => setDialog(null)}
          onApply={draft => {
            if (Object.keys(draft).some(key => draft[key] !== metadata[key])) { setMetadata(draft); changed(); }
            setDialog(null);
          }} />
      )}
      {dialog === 'publish' && (
        <WorkModal title="학생에게 과제를 게시할까요?" busy={busy} onClose={() => setDialog(null)} actions={<>
          <button type="button" className="prof-btn" disabled={busy} onClick={() => setDialog(null)}>계속 준비하기</button>
          <button type="button" className="prof-btn prof-btn--primary" disabled={busy} onClick={publish}>{busy ? '게시 중…' : '학생에게 게시'}</button>
        </>}>
          <p className="rv-modal__name">{metadata.title}</p>
          <ul className="rv-facts">
            <li>{diagnostic ? '진단평가' : `분류 실습 · 도말 ${parts.length}장`} · {counts.active}문항{counts.excluded ? ` · 출제 제외 ${counts.excluded}` : ''}</li>
            <li>{counts.open === 0 ? '모든 문항의 정답이 준비되어 바로 채점됩니다.' : `정답 미확정 ${counts.open}문항은 정답을 확정한 뒤 채점됩니다.`}</li>
            <li>마감: {metadata.deadlineAt ? new Date(metadata.deadlineAt).toLocaleString('ko-KR') : '없음'}</li>
            <li>결과 공개: {metadata.resultsAfterDeadline ? '마감 후' : '최종 제출하고 채점이 끝난 뒤'}</li>
            <li>게시 후에는 문항 구성을 바꿀 수 없습니다. 새 구성은 데이터 메뉴에서 복사해 만들 수 있습니다.</li>
          </ul>
          <button type="button" className="prof-link-btn rv-modal__link" disabled={busy} onClick={() => setDialog('settings')}><Icon name="settings" size={13} />제목·마감일·공개 방식 바꾸기</button>
        </WorkModal>
      )}
    </div>
  );
}
