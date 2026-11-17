import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { studentAnalyticsApi } from '../../api/studentAnalytics';
import { professorApi } from '../../api/professor';
import { reportApi } from '../../api/reports';
import api from '../../api/client';
import AuthImage from '../../components/AuthImage';
import { useConsoleBase } from '../../components/console/ConsoleContext';
import Icon from '../../components/login/icons';
import { imageUrl } from '../../constants';
import { answerLabel } from '../../utils/cellClasses';
import { CELL_LABELS, buildGradebook, cellState, classRates, confusionPairs, resultKey, sortRows } from '../../utils/gradebook';
import { deadlineInfo } from '../../utils/professorDashboard';
import { parseQuestion } from '../../utils/studentQuestions';
import { CourseworkThumb } from './CourseworkCells';
import { useProfessorData } from './ProfessorData';
import { ClassBars, ConfusionTable } from './StudentsPage';
import useGradebook from './useGradebook';
import './students.css';

const TABS = [['ALL', '전체'], ['OPEN', '진행중'], ['CLOSED', '마감']];
const CELL_FILTERS = [['ALL', '전체'], ['WRONG', '오답만'], ['PENDING', '확정 전']];
const pad = value => String(value).padStart(2, '0');
const stamp = value => { const date = new Date(value); return `${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`; };
const day = value => { const date = new Date(value); return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`; };

function useLoad(load, dependency) {
  const [state, setState] = useState({ loading: true, data: null, error: false });
  useEffect(() => {
    let active = true;
    setState({ loading: true, data: null, error: false });
    load().then(data => { if (active) setState({ loading: false, data, error: false }); })
      .catch(error => { if (active && !axios.isCancel(error)) setState({ loading: false, data: null, error: true }); });
    return () => { active = false; };
  }, [dependency]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}

/** The student's answer to every cell of one coursework (one block per smear). */
function CellAnswers({ studentId, item }) {
  const [filter, setFilter] = useState('ALL');
  const state = useLoad(() => Promise.all(item.taskIds.map(taskId => studentAnalyticsApi.getTaskDetail(studentId, taskId).then(({ data }) => data))), `${studentId}:${item.id}`);
  if (state.loading) return <p role="status" className="prof-empty prof-empty--compact">응답을 불러오는 중…</p>;
  if (state.error) return <p role="alert" className="prof-alert">응답을 불러오지 못했습니다.</p>;
  const matches = {
    ALL: () => true,
    WRONG: cell => cell.isCorrect === false,
    PENDING: cell => cell.studentLabel && !cell.correctLabel,
  };
  const all = state.data.flatMap(detail => detail.cells);
  return (
    <div className="prof-sd-cells">
      <div className="prof-sd-cells__head">
        <strong>세포별 응답 <span className="prof-muted">(총 {all.length}개)</span></strong>
        <div className="prof-sd-textabs" role="group" aria-label="응답 필터">
          {CELL_FILTERS.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
              {label} <span className="prof-mono">{all.filter(matches[key]).length}</span>
            </button>
          ))}
        </div>
      </div>
      {state.data.map(detail => {
        const cells = detail.cells.filter(matches[filter]);
        return (
          <div key={detail.task.taskId} className="prof-sd-cells__smear">
            {state.data.length > 1 && <p className="prof-sd-cells__file prof-mono">{detail.task.filename || `도말 #${detail.task.taskId}`}</p>}
            {!cells.length ? <p className="prof-muted">해당하는 세포가 없습니다.</p> : (
              <ul className="prof-sd-cells__grid">
                {cells.map(cell => {
                  const tone = cell.isCorrect === false ? ' is-wrong' : cell.isCorrect ? ' is-right' : '';
                  return (
                    <li key={cell.cropId} className={`prof-sd-cell${tone}`}>
                      <AuthImage src={imageUrl.crop(cell.cropFilename)} alt={`세포 #${cell.cropId}`} />
                      <span className="prof-sd-cell__id prof-mono">#{cell.cropId}</span>
                      <span className="prof-sd-cell__answer">
                        {!cell.studentLabel ? <span className="prof-muted">응답 없음{cell.correctLabel ? ` · 정답 ${cell.correctLabel}` : ''}</span>
                          : !cell.correctLabel ? <span className="prof-muted">{answerLabel(cell.studentLabel)} · 확정 전</span>
                            : cell.isCorrect ? <>{cell.correctLabel} <Icon name="check" size={13} /></>
                              : <><s>{answerLabel(cell.studentLabel)}</s> → <strong>{cell.correctLabel}</strong></>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Per-class accuracy and frequent mistakes of one student (final answers with a confirmed answer). */
function Tendency({ studentId }) {
  const { species } = useProfessorData();
  const active = useMemo(() => species.filter(item => item.active !== false), [species]);
  const [speciesId, setSpeciesId] = useState('');
  const [matrixView, setMatrixView] = useState(false);
  const selected = speciesId || active.find(item => item.code === 'DOG')?.id || active[0]?.id || '';
  const state = useLoad(() => (selected ? professorApi.calibration({ speciesId: selected, source: 'ALL' }).then(({ data }) => data) : Promise.resolve(null)), `${selected}`);
  const labels = state.data?.labels || [];
  const mine = state.data?.studentMatrices?.find(student => student.studentId === studentId);
  const rates = classRates(mine?.confusionMatrix, labels).filter(row => row.total > 0).sort((a, b) => a.rate - b.rate);
  const pairs = confusionPairs(mine?.confusionMatrix);

  return (
    <div className="prof-sd-tendency">
      <section className="prof-card">
        <header className="prof-card__head">
          <h2>세포 종류별 정답률</h2>
          <div className="prof-actions">
            <label className="prof-select"><span className="prof-sr">동물 종</span>
              <select value={selected} onChange={event => setSpeciesId(Number(event.target.value))}>
                {active.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            {rates.length > 0 && <button type="button" className="prof-link-btn" onClick={() => setMatrixView(value => !value)}>{matrixView ? '정답률 보기' : '혼동행렬 보기'}</button>}
          </div>
        </header>
        <div className="prof-card__body">
          {state.loading ? <p role="status" className="prof-muted">불러오는 중…</p>
            : state.error ? <p role="alert" className="prof-alert">정답률을 불러오지 못했습니다.</p>
              : !rates.length ? <p className="prof-muted">이 동물 종에서 채점된 응답이 아직 없습니다.</p>
                : matrixView ? <ConfusionTable matrix={mine.confusionMatrix} labels={labels} /> : <ClassBars rates={rates} />}
          {rates.length > 0 && !matrixView && <p className="prof-muted prof-sd-note">정답률 낮은 순 · 최종 제출하고 정답이 확정된 응답 기준</p>}
        </div>
      </section>
      <section className="prof-card">
        <header className="prof-card__head"><h2>자주 틀린 조합</h2><span className="prof-muted">학생 답 → 정답</span></header>
        <div className="prof-card__body">
          {!pairs.length ? <p className="prof-muted">{state.loading ? '불러오는 중…' : '틀린 응답이 없습니다.'}</p> : (
            <ol className="prof-sd-pairs">
              {pairs.map(pair => (
                <li key={`${pair.from}-${pair.to}`}>
                  <span><strong>{answerLabel(pair.to)}</strong> → {pair.from}</span>
                  <span className="prof-mono">{pair.count}회</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}

/** One student: who they are, every published coursework with their result, tendencies and questions. */
export default function StudentDetailPage() {
  const basePath = useConsoleBase();
  const { studentId: rawId } = useParams();
  const studentId = decodeURIComponent(rawId);
  const [params] = useSearchParams();
  const { groups } = useProfessorData();
  const gradebook = useGradebook();
  const roster = useLoad(() => api.get('/professor/students/roster').then(({ data }) => data), 'roster');
  const reports = useLoad(() => reportApi.getAll().then(({ data }) => data || []), 'reports');
  const [tab, setTab] = useState('ALL');
  const [opened, setOpened] = useState(() => new Set(params.get('item') ? [Number(params.get('item'))] : []));
  const openedRow = useRef(null);
  const now = Date.now();

  const { items, rows, byKey } = useMemo(() => buildGradebook(gradebook.data, now), [gradebook.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const ordered = useMemo(() => sortRows(rows, 'ID'), [rows]);
  const index = ordered.findIndex(row => row.studentId === studentId);
  const student = ordered[index];
  const groupByTask = useMemo(() => {
    const map = new Map();
    for (const group of groups) for (const task of group.tasks) map.set(task.id, group);
    return map;
  }, [groups]);
  const rosterEntry = roster.data?.find(entry => entry.studentId === studentId);
  const questions = (reports.data || []).filter(report => report.studentId === studentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const waiting = questions.filter(report => !report.replies?.length).length;

  useEffect(() => {
    if (opened.size && student) openedRow.current?.scrollIntoView({ block: 'center' });
  }, [student]); // eslint-disable-line react-hooks/exhaustive-deps

  if (gradebook.loading && !gradebook.data) return <p role="status" className="prof-empty">학생 정보를 불러오는 중…</p>;
  if (gradebook.error) return <div role="alert" className="prof-alert"><span>{gradebook.error}</span><button type="button" className="prof-btn prof-btn--sm" onClick={gradebook.reload}>다시 불러오기</button></div>;
  if (!student) {
    return (
      <div className="prof-card prof-empty">
        <p>학번 <span className="prof-mono">{studentId}</span> 학생을 찾을 수 없습니다.</p>
        <Link to={`${basePath}/students`} className="prof-btn">전체 학생으로</Link>
      </div>
    );
  }

  const { summary } = student;
  const shownItems = items.filter(item => tab === 'ALL'
    || (tab === 'CLOSED') === Boolean(item.deadlineAt && new Date(item.deadlineAt).getTime() <= now));
  const toggle = id => setOpened(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const neighbor = offset => ordered[index + offset];
  const link = row => `${basePath}/students/${encodeURIComponent(row.studentId)}`;

  return (
    <>
      <div className="prof-sd-head">
        <div className="prof-sd-head__nav">
          <Link to={`${basePath}/students`} className="prof-link"><Icon name="chevronLeft" size={15} />전체 학생</Link>
          <span className="prof-sd-head__step">
            {neighbor(-1) ? <Link to={link(neighbor(-1))} className="prof-link-btn" title={`${neighbor(-1).name || ''} ${neighbor(-1).studentId}`}><Icon name="chevronLeft" size={14} />이전 학생</Link> : <span />}
            <span className="prof-muted prof-mono">{index + 1} / {ordered.length}</span>
            {neighbor(1) ? <Link to={link(neighbor(1))} className="prof-link-btn" title={`${neighbor(1).name || ''} ${neighbor(1).studentId}`}>다음 학생<Icon name="chevronRight" size={14} /></Link> : <span />}
          </span>
        </div>
        <h1>
          {student.name || student.studentId}
          {student.name && student.name !== student.studentId && <span className="prof-mono prof-sd-head__id">{student.studentId}</span>}
          {student.section && <span className="prof-sd-head__section">{student.section}</span>}
          {!student.registered && <span className="prof-badge">미가입</span>}
        </h1>
        <p className="prof-sd-facts">
          <span>제출 <strong className="prof-mono">{summary.submitted}/{summary.total}</strong> 과제</span>
          <span>정답률 {summary.rate == null ? <strong>–</strong> : <><strong className="prof-mono">{summary.rate}%</strong> <span className="prof-muted prof-mono">({summary.correct}/{summary.graded})</span></>}</span>
          <span>채점 대기 <strong className="prof-mono">{summary.pending}</strong>문항</span>
          <span>질문 <strong className="prof-mono">{questions.length}</strong>건{waiting > 0 && <>, 답변 대기 <strong className="prof-mono prof-sd-facts__warn">{waiting}</strong>건</>}</span>
        </p>
        <p className="prof-muted prof-sd-head__meta">
          {rosterEntry ? `명부 등록 ${day(rosterEntry.createdAt)}${rosterEntry.registeredBy ? ` · 등록 ${rosterEntry.registeredBy}` : ''}` : '명부에 없이 가입한 계정'}
          {summary.lastSubmittedAt && ` · 최근 제출 ${stamp(summary.lastSubmittedAt)}`}
        </p>
      </div>

      <section className="prof-card" aria-labelledby="sd-results">
        <header className="prof-card__head">
          <h2 id="sd-results">과제별 결과</h2>
          <div className="prof-sd-textabs" role="group" aria-label="과제 범위">
            {TABS.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}
          </div>
        </header>
        {!shownItems.length ? <p className="prof-empty prof-empty--compact">{items.length ? '해당하는 과제가 없습니다.' : '게시된 과제가 없습니다.'}</p> : (
          <div className="prof-table-wrap">
            <table className="prof-table prof-sd-results">
              <thead><tr>
                <th scope="col">과제</th><th scope="col">마감</th><th scope="col">응답</th><th scope="col">상태</th>
                <th scope="col">정답률</th><th scope="col">제출 시각</th>
              </tr></thead>
              <tbody>
                {shownItems.map(item => {
                  const state = cellState(byKey.get(resultKey(studentId, item.id)), item, now);
                  const group = groupByTask.get(item.taskIds[0]);
                  const isOpen = opened.has(item.id);
                  const due = deadlineInfo(item.deadlineAt, new Date(now));
                  const species = group ? [...new Set(group.tasks.map(task => task.speciesName).filter(Boolean))].join(', ') : '';
                  return [
                    <tr key={item.id} ref={isOpen ? openedRow : undefined} className={isOpen ? 'is-open' : ''}>
                      <td className="prof-table__title">
                        <div className="prof-table__course">
                          {group ? <CourseworkThumb group={group} /> : <span className="prof-thumb is-icon" aria-hidden="true"><Icon name="layers" size={18} /></span>}
                          <div>
                            <button type="button" className="prof-sd-results__toggle" aria-expanded={isOpen} onClick={() => toggle(item.id)}>
                              {item.title}<Icon name="chevronDown" size={14} className={`prof-nav__chevron${isOpen ? ' is-open' : ''}`} />
                            </button>
                            <span className="prof-table__meta">{item.kind === 'DIAGNOSTIC' ? '진단평가' : '분류 실습'}{species && ` · ${species}`} · {item.questions}문항</span>
                          </div>
                        </div>
                      </td>
                      <td className="prof-table__due">{item.deadlineAt ? <><strong className={`is-${due.tone}`}>{due.label}</strong><span className="prof-mono">{due.dateText}</span></> : <span className="prof-muted">마감 없음</span>}</td>
                      <td className="prof-mono">{state.answered}/{item.questions}</td>
                      <td><span className={`prof-sd-state is-${state.kind.toLowerCase()}`}>{CELL_LABELS[state.kind]}</span></td>
                      <td>{state.kind === 'SCORED' ? <span className="prof-mono"><strong>{state.rate}%</strong> <span className="prof-muted">({state.correct}/{state.graded})</span></span>
                        : state.kind === 'WAITING' ? <span className="prof-muted">채점 대기 {state.pending}문항</span> : <span className="prof-muted">–</span>}</td>
                      <td className="prof-mono prof-muted">{state.submittedAt ? stamp(state.submittedAt) : '–'}</td>
                    </tr>,
                    isOpen && (
                      <tr key={`${item.id}-cells`} className="prof-sd-results__detail">
                        <td colSpan={6}>
                          {state.answered ? <CellAnswers studentId={studentId} item={item} /> : <p className="prof-muted">아직 응답한 세포가 없습니다.</p>}
                          <Link to={`${basePath}/assignments/${item.id}/results`} className="prof-link">과제 결과 화면에서 보기 <Icon name="arrowRight" size={14} /></Link>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Tendency studentId={studentId} />

      <section className="prof-card" aria-labelledby="sd-questions">
        <header className="prof-card__head">
          <h2 id="sd-questions">질문 <span className="prof-muted">{questions.length > 3 ? `(최근 3건 / 전체 ${questions.length}건)` : ''}</span></h2>
          <Link to={`${basePath}/reports`} className="prof-link">질문·신고에서 보기 <Icon name="arrowRight" size={14} /></Link>
        </header>
        {reports.loading ? <p role="status" className="prof-empty prof-empty--compact">불러오는 중…</p>
          : !questions.length ? <p className="prof-empty prof-empty--compact">이 학생이 보낸 질문이 없습니다.</p> : (
            <ul className="prof-sd-questions">
              {questions.slice(0, 3).map(report => {
                const { category, body } = parseQuestion(report.reason);
                const answered = Boolean(report.replies?.length);
                return (
                  <li key={report.id}>
                    <span className="prof-mono prof-muted">{stamp(report.createdAt)}</span>
                    <span className="prof-sd-questions__category">{category}</span>
                    <span className="prof-sd-questions__body" title={body}>{body}</span>
                    <span className={answered ? 'prof-muted' : 'prof-sd-facts__warn'}>{answered ? '답변 완료' : '답변 대기'}</span>
                  </li>
                );
              })}
            </ul>
          )}
      </section>
    </>
  );
}
