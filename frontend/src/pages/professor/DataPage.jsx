import { useConsoleBase } from '../../components/console/ConsoleContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { cropApi, labelingApi, taskApi } from '../../api';
import { courseworkApi } from '../../api/coursework';
import AuthImage from '../../components/AuthImage';
import Icon from '../../components/login/icons';
import { imageUrl } from '../../constants';
import {
  deletionPlan, filterSmears, labelState, labelStateCounts, pageNumbers, paginate, smearName, sortSmears, speciesOptions,
} from '../../utils/smearData';
import { useProfessorData } from './ProfessorData';

const PAGE_SIZE = 24;
const MAX_EXPORT = 50;
const VIEW_KEY = 'cell-prof-data-view';
const TABS = [['ALL', '모든 도말'], ['COMPLETE', '라벨링 완료'], ['PARTIAL', '진행 중'], ['NONE', '라벨 없음']];
const SORTS = [['NEWEST', '최신 등록순'], ['CELLS', '세포 많은순'], ['PENDING', '미확정 많은순']];
const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
const today = () => new Date().toISOString().slice(0, 10).replaceAll('-', '');
const isDraft = task => task.status === 'DRAFT';
// A draft opens in the labeling editor. Published coursework is fixed, so its answers are confirmed on the results screen.
const labelPath = (task, basePath) => `${basePath}/assignments/${task.id}/${isDraft(task) ? 'edit' : 'results'}`;

function LabelStatus({ task }) {
  const state = labelState(task);
  const count = <span className="prof-mono">{task.labeledCount}/{task.cropCount}</span>;
  if (state === 'COMPLETE') return <span className="prof-data__state is-complete"><Icon name="checkCircle" size={14} />라벨링 완료 {count}</span>;
  if (state === 'PARTIAL') return <span className="prof-data__state is-partial"><Icon name="clock" size={14} />진행 중 · 정답 확정 {count}</span>;
  return <span className="prof-data__state is-none"><Icon name="edit" size={14} />{task.cropCount ? <>라벨 없음 {count}</> : '탐지된 세포 없음'}</span>;
}

function Usage({ task }) {
  return (
    <span className="prof-data__usage" title={task.title || undefined}>
      <span className={`prof-badge${isDraft(task) ? '' : ' is-indigo'}`}>{isDraft(task) ? '임시저장' : '게시됨'}</span>
      <span className="prof-data__usage-title">{task.title || '제목 없는 과제'}</span>
    </span>
  );
}

/** "⋮" on a card or row: less frequent actions for one smear. */
function ItemMenu({ task, busy, onExport, onDelete }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const onKey = event => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const run = action => { setOpen(false); action(); };
  return (
    <div className="prof-menu" ref={root}>
      <button type="button" className="prof-icon-btn prof-icon-btn--sm" aria-haspopup="menu" aria-expanded={open}
        aria-label={`${smearName(task)} 더 보기`} title="더 보기" disabled={busy} onClick={() => setOpen(value => !value)}>
        <Icon name="more" size={16} />
      </button>
      {open && (
        <div className="prof-menu__list" role="menu">
          <button type="button" role="menuitem" onClick={() => run(onExport)}><Icon name="download" size={15} />이미지 + 라벨 ZIP 받기</button>
          <button type="button" role="menuitem" className="is-danger" disabled={!isDraft(task)} onClick={() => run(onDelete)}
            title={isDraft(task) ? undefined : '게시된 과제의 자료는 과제 메뉴에서 삭제합니다.'}>
            <Icon name="trash" size={15} />삭제{!isDraft(task) && ' (임시저장만 가능)'}
          </button>
        </div>
      )}
    </div>
  );
}

function Thumb({ task }) {
  return <AuthImage src={imageUrl.thumbnail(task.originalFilename)} fallbackSrc={imageUrl.original(task.originalFilename)} alt={`${smearName(task)} 도말 이미지`} />;
}

export default function DataPage() {
  const basePath = useConsoleBase();
  const navigate = useNavigate();
  const { reload } = useProfessorData();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [sort, setSort] = useState('NEWEST');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [view, setView] = useState(() => { try { return window.localStorage.getItem(VIEW_KEY) === 'table' ? 'table' : 'grid'; } catch { return 'grid'; } });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data: tasks } = await courseworkApi.data();
      setData(tasks);
      setSelected(current => new Set([...current].filter(id => tasks.some(task => task.id === id))));
    } catch (e) { if (!axios.isCancel(e)) setError(errorMessage(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const species = useMemo(() => speciesOptions(data), [data]);
  // Tab counts follow the search and species filter, so a tab never promises rows it does not have.
  const counts = useMemo(() => labelStateCounts(filterSmears(data, { query, speciesId })), [data, query, speciesId]);
  const filtered = useMemo(() => sortSmears(filterSmears(data, { tab, query, speciesId }), sort), [data, tab, query, speciesId, sort]);
  const paged = paginate(filtered, page, PAGE_SIZE);
  useEffect(() => { setPage(1); }, [tab, query, speciesId, sort]);

  const chosen = data.filter(task => selected.has(task.id));
  const chosenCells = chosen.reduce((sum, task) => sum + (task.cropCount || 0), 0);
  const pageSelected = paged.items.length > 0 && paged.items.every(task => selected.has(task.id));
  const toggle = id => setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const togglePage = () => setSelected(current => {
    const next = new Set(current);
    paged.items.forEach(task => (pageSelected ? next.delete(task.id) : next.add(task.id)));
    return next;
  });
  const changeView = next => { setView(next); try { window.localStorage.setItem(VIEW_KEY, next); } catch { /* not persisted */ } };

  const act = async (name, action) => {
    setBusy(name); setError(''); setNotice('');
    try { await action(); } catch (e) { if (!axios.isCancel(e)) setError(errorMessage(e)); } finally { setBusy(''); }
  };
  const copy = task => act(`copy-${task.id}`, async () => {
    const { data: copied } = await courseworkApi.copy(task.id);
    reload({ silent: true });
    navigate(`${basePath}/assignments/${copied.id}/edit`);
  });
  const exportOne = task => act(`export-${task.id}`, async () => {
    const { data: blob } = await labelingApi.exportTask(task.id);
    download(blob, `task_${task.id}_${(task.speciesCode || 'DOG').toLowerCase()}_labeling.zip`);
  });
  const exportSelected = () => act('export', async () => {
    if (chosen.length > MAX_EXPORT) throw new Error(`한 번에 ${MAX_EXPORT}개까지 내보낼 수 있습니다. 선택을 줄여주세요.`);
    const { data: blob } = await labelingApi.exportTasks(chosen.map(task => task.id));
    download(blob, `cell_labeling_export_${today()}.zip`);
    setNotice(`도말 ${chosen.length}개의 이미지와 라벨을 내려받았습니다.`);
  });
  const exportConfirmed = () => act('confirmed', async () => {
    const { data: labels } = await cropApi.getTrainingData();
    if (!labels.length) { setNotice('정답이 확정된 세포가 아직 없습니다.'); return; }
    download(new Blob([JSON.stringify(labels, null, 2)], { type: 'application/json' }), `cell_confirmed_labels_${today()}.json`);
    setNotice(`정답이 확정된 세포 ${labels.length}개의 라벨 목록을 내려받았습니다.`);
  });
  const remove = targets => {
    const names = targets.length === 1 ? `"${smearName(targets[0])}"` : `도말 ${targets.length}개`;
    if (!window.confirm(`임시저장 자료 ${names}을(를) 삭제할까요?\n준비한 라벨도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    act('delete', async () => {
      for (const step of deletionPlan(targets, data)) {
        if (step.type === 'assignment') await taskApi.deleteAssignment(step.id);
        else await taskApi.delete(step.id);
      }
      setNotice(`${names}을(를) 삭제했습니다.`);
      reload({ silent: true });
      await load();
    });
  };

  const allDrafts = chosen.length > 0 && chosen.every(isDraft);
  const working = busy !== '';
  const checkbox = task => (
    <input type="checkbox" className="prof-check" checked={selected.has(task.id)} onChange={() => toggle(task.id)} aria-label={`${smearName(task)} 선택`} />
  );
  const actions = task => (
    <>
      <button type="button" className="prof-link-btn" disabled={working} onClick={() => copy(task)}><Icon name="copy" size={14} />새 과제로 사용</button>
      <Link to={labelPath(task, basePath)} className="prof-link">{isDraft(task) ? '라벨링 열기' : '정답·응답 보기'} <Icon name="arrowRight" size={14} /></Link>
    </>
  );

  return (
    <>
      <div className="prof-page-head">
        <div>
          <h1>도말 데이터</h1>
          <p>업로드한 도말과 라벨을 확인하고, 새 과제로 다시 사용하거나 이미지와 라벨을 내려받습니다.</p>
        </div>
        <div className="prof-actions">
          <button type="button" className="prof-btn" disabled={working} onClick={exportConfirmed} title="교수가 정답을 확정한 세포의 라벨 목록(JSON)">
            <Icon name="download" size={16} />{busy === 'confirmed' ? '준비 중…' : '확정 라벨 내보내기'}
          </button>
          {/* A smear is always part of a coursework, so uploading starts a practice coursework draft. */}
          <Link to={`${basePath}/assignments/new?kind=practice`} className="prof-btn prof-btn--primary"><Icon name="upload" size={16} />도말 업로드</Link>
        </div>
      </div>

      <div className="prof-data__tabs" role="group" aria-label="라벨 상태">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>
            {label} <span className="prof-mono">({counts[key]})</span>
          </button>
        ))}
      </div>

      <div className="prof-card prof-data__toolbar">
        <label className="prof-data__search">
          <Icon name="search" size={15} />
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="파일명, 과제명 검색" aria-label="도말 검색" />
        </label>
        <label className="prof-select">
          <span className="prof-sr">동물 종</span>
          <select value={speciesId} onChange={event => setSpeciesId(event.target.value)}>
            <option value="">동물 종: 전체 ({data.length})</option>
            {species.map(item => <option key={item.id} value={item.id}>{item.name} ({item.count})</option>)}
          </select>
        </label>
        <label className="prof-select">
          <span className="prof-sr">정렬</span>
          <select value={sort} onChange={event => setSort(event.target.value)}>
            {SORTS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <div className="prof-data__toolbar-right">
          <div className="prof-tabs" role="group" aria-label="보기 방식">
            <button type="button" aria-pressed={view === 'grid'} onClick={() => changeView('grid')} title="카드 보기" aria-label="카드 보기"><Icon name="grid" size={16} /></button>
            <button type="button" aria-pressed={view === 'table'} onClick={() => changeView('table')} title="표 보기" aria-label="표 보기"><Icon name="menu" size={16} /></button>
          </div>
          <button type="button" className="prof-icon-btn" onClick={load} disabled={loading} title="새로고침" aria-label="새로고침"><Icon name="refresh" size={16} /></button>
        </div>
      </div>

      <div className={`prof-data__bulk${chosen.length ? ' is-active' : ''}`}>
        <label className="prof-data__bulk-info">
          <input type="checkbox" className="prof-check" checked={pageSelected} onChange={togglePage} disabled={!paged.items.length} aria-label="이 페이지의 도말 모두 선택" />
          {chosen.length
            ? <><strong>도말 {chosen.length}개 선택됨</strong> <span className="prof-mono">(세포 {chosenCells}개)</span></>
            : <span>도말을 선택하면 한 번에 내보내거나 삭제할 수 있습니다.</span>}
        </label>
        <div className="prof-actions">
          <button type="button" className="prof-btn prof-btn--sm prof-btn--primary" disabled={working || chosen.length !== 1}
            title={chosen.length === 1 ? undefined : '도말 1개를 선택하면 열 수 있습니다.'} onClick={() => navigate(labelPath(chosen[0], basePath))}>
            <Icon name="edit" size={14} />라벨 확인 / 수정
          </button>
          <button type="button" className="prof-btn prof-btn--sm" disabled={working || !chosen.length} onClick={exportSelected}>
            <Icon name="download" size={14} />{busy === 'export' ? '내보내는 중…' : '선택 항목 내보내기'}
          </button>
          <button type="button" className="prof-btn prof-btn--sm prof-btn--danger" disabled={working || !allDrafts}
            title={chosen.length && !allDrafts ? '게시된 과제의 자료가 포함되어 있습니다. 게시된 자료는 과제 메뉴에서 삭제합니다.' : undefined} onClick={() => remove(chosen)}>
            <Icon name="trash" size={14} />{busy === 'delete' ? '삭제 중…' : '선택 삭제'}
          </button>
        </div>
      </div>

      {error && <div role="alert" className="prof-alert"><span>{error}</span><button type="button" className="prof-btn prof-btn--sm" onClick={load}>다시 불러오기</button></div>}
      {notice && <p role="status" className="prof-note is-success">{notice}</p>}

      {loading && !data.length ? <p role="status" className="prof-empty">도말 자료를 불러오는 중…</p> : !paged.total ? (
        <div className="prof-card prof-empty">
          <p>{data.length ? '조건에 맞는 도말이 없습니다.' : '업로드한 도말이 없습니다.'}</p>
          {!data.length && <Link to={`${basePath}/assignments/new?kind=practice`} className="prof-btn prof-btn--primary"><Icon name="upload" size={15} />도말 업로드</Link>}
        </div>
      ) : view === 'grid' ? (
        <ul className="prof-data__grid">
          {paged.items.map(task => (
            <li key={task.id} className={`prof-data__card${selected.has(task.id) ? ' is-selected' : ''}`}>
              <div className="prof-data__thumb">
                <Thumb task={task} />
                <span className="prof-data__check">{checkbox(task)}</span>
                {task.speciesName && <span className="prof-data__species">{task.speciesName}</span>}
              </div>
              <div className="prof-data__body">
                <div className="prof-data__name">
                  <h2 className="prof-mono" title={smearName(task)}>{smearName(task)}</h2>
                  <ItemMenu task={task} busy={working} onExport={() => exportOne(task)} onDelete={() => remove([task])} />
                </div>
                <div className="prof-data__chips">
                  <span className="prof-chip-sm prof-mono">세포 {task.cropCount}개</span>
                  {task.excludedCount > 0 && <span className="prof-chip-sm prof-mono">출제 제외 {task.excludedCount}</span>}
                </div>
                <LabelStatus task={task} />
                <Usage task={task} />
              </div>
              <div className="prof-data__foot">{actions(task)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="prof-card">
          <div className="prof-table-wrap">
            <table className="prof-table prof-data__table">
              <thead><tr>
                <th scope="col"><span className="prof-sr">선택</span></th><th scope="col">도말</th><th scope="col">동물 종</th>
                <th scope="col">과제</th><th scope="col">라벨</th><th scope="col">등록일</th><th scope="col" className="is-right">작업</th>
              </tr></thead>
              <tbody>
                {paged.items.map(task => (
                  <tr key={task.id} className={selected.has(task.id) ? 'is-selected' : ''}>
                    <td>{checkbox(task)}</td>
                    <td>
                      <div className="prof-data__row-name">
                        <span className="prof-data__row-thumb"><Thumb task={task} /></span>
                        <span className="prof-mono" title={smearName(task)}>{smearName(task)}</span>
                      </div>
                    </td>
                    <td>{task.speciesName || '—'}</td>
                    <td><Usage task={task} /></td>
                    <td><LabelStatus task={task} />{task.excludedCount > 0 && <span className="prof-table__meta">출제 제외 {task.excludedCount}</span>}</td>
                    <td className="prof-mono prof-muted">{task.createdAt ? new Date(task.createdAt).toLocaleDateString('ko-KR') : '—'}</td>
                    <td className="is-right">
                      <div className="prof-data__row-actions">
                        {actions(task)}
                        <ItemMenu task={task} busy={working} onExport={() => exportOne(task)} onDelete={() => remove([task])} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {paged.total > 0 && (
        <nav className="prof-card prof-pager" aria-label="페이지">
          <span className="prof-muted">총 <strong className="prof-mono">{paged.total}</strong>개 중 <strong className="prof-mono">{paged.from}–{paged.to}</strong> 표시 · {PAGE_SIZE}개씩 보기</span>
          {paged.pages > 1 && (
            <div className="prof-pager__pages">
              <button type="button" disabled={paged.page === 1} onClick={() => setPage(paged.page - 1)} aria-label="이전 페이지"><Icon name="chevronLeft" size={16} /></button>
              {pageNumbers(paged.page, paged.pages).map((item, index) => (item === '…'
                ? <span key={`gap-${index}`} className="prof-mono">…</span>
                : <button key={item} type="button" className="prof-mono" aria-current={item === paged.page ? 'page' : undefined} onClick={() => setPage(item)}>{item}</button>))}
              <button type="button" disabled={paged.page === paged.pages} onClick={() => setPage(paged.page + 1)} aria-label="다음 페이지"><Icon name="chevronRight" size={16} /></button>
            </div>
          )}
        </nav>
      )}
    </>
  );
}
