import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import { reportApi } from '../../api/reports';
import { REPORT_REASONS, imageUrl } from '../../constants';
import AuthImage from '../../components/AuthImage';
import Icon from '../../components/login/icons';
import { useConsoleBase } from '../../components/console/ConsoleContext';
import { courseworkTitle } from '../../utils/professorDashboard';
import { matchesQuestion, parseQuestion, questionCoursework } from '../../utils/studentQuestions';
import { useProfessorData } from './ProfessorData';
import '../student/questions/studentQuestions.css';
import './professorReports.css';

const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('ko-KR') : '등록일 미확인';
const STATUS = [['all', '전체'], ['pending', '답변 대기'], ['answered', '답변 등록됨']];

function QuestionItem({ item, course, studentName, draft, onDraft, onReply, onSaving, refreshing }) {
  const { category, body } = parseQuestion(item.reason);
  const replies = [...(item.replies || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const submit = async event => {
    event.preventDefault();
    if (busy.current || refreshing || !draft.trim()) return;
    busy.current = true;
    setSaving(true); onSaving(1); setError('');
    try {
      const { data } = await reportApi.reply(item.id, draft.trim());
      onReply(item.id, data);
    } catch (err) {
      setError(err.response?.data?.message || '답변을 등록하지 못했습니다. 작성 내용은 유지됩니다. 다시 시도해주세요.');
    } finally { busy.current = false; setSaving(false); onSaving(-1); }
  };

  return <details className="stu-questions__item prof-questions__item">
    <summary className="stu-questions__summary">
      {item.cropFilename ? <AuthImage src={imageUrl.crop(item.cropFilename)} alt={`질문한 세포 #${item.cropId}`} className="stu-questions__photo" />
        : <span className="stu-questions__photo stu-questions__photo--empty"><Icon name="help" size={24} /></span>}
      <span className="stu-questions__preview">
        <span className="stu-questions__tags"><span className="prof-badge">{category}</span><span className="prof-questions__student"><Icon name="user" size={12} />{studentName || item.studentId}{studentName && studentName !== item.studentId && <span>({item.studentId})</span>}</span><time className="stu-questions__date" dateTime={item.createdAt}>{date(item.createdAt)}</time></span>
        <strong className="stu-questions__title">{body}</strong>
        <span className="stu-questions__context">{course?.title && `${course.title} · `}과제 #{item.taskId} · 세포 #{item.cropId}{item.speciesName ? ` · ${item.speciesName}` : ''}</span>
      </span>
      <span className={`prof-badge stu-questions__status ${replies.length ? 'is-emerald' : 'is-amber'}`}>{replies.length ? '답변 등록됨' : '답변 대기'}</span>
      <Icon name="chevronDown" size={16} className="stu-questions__chevron" />
    </summary>
    <div className="stu-questions__detail">
      <section className="stu-questions__message" aria-label="학생 질문 내용"><h3><Icon name="user" size={15} />학생 질문</h3><p>{body}</p></section>
      <section className="stu-questions__replies" aria-label="답변 이력">
        <h3><Icon name="help" size={15} />답변 이력 <span className="prof-nav__badge prof-mono">{replies.length}</span></h3>
        {replies.length ? replies.map(reply => <article className="stu-questions__reply" key={reply.id}>
          <header><strong>{reply.authorName || reply.authorUsername || '답변자'}</strong><span className="prof-badge">{reply.authorRole === 'ADMIN' ? '관리자' : '교수'}</span><time dateTime={reply.createdAt}>{date(reply.createdAt)}</time></header><p>{reply.message}</p>
        </article>) : <p className="stu-questions__waiting"><Icon name="clock" size={15} />아직 등록된 답변이 없습니다. 아래에서 학생에게 답변을 남겨주세요.</p>}
      </section>
      <form className="prof-questions__reply-form" onSubmit={submit}>
        <label htmlFor={`prof-question-reply-${item.id}`}><Icon name="edit" size={15} />{replies.length ? '추가 답변 작성' : '답변 작성'}</label>
        <textarea id={`prof-question-reply-${item.id}`} aria-label={`질문 #${item.id} 답변 내용`} rows={4} maxLength={4000} value={draft} onChange={event => { onDraft(item.id, event.target.value); setError(''); }} disabled={saving} placeholder="학생에게 전달할 설명이나 이미지 오류에 대한 안내를 작성하세요." required />
        <div className="prof-questions__form-foot"><span className="prof-muted"><span className="prof-mono">{draft.length} / 4000</span> · 등록한 답변은 학생의 ‘내 질문 관리’에 표시됩니다.</span><div className="prof-actions"><button type="button" className="prof-btn" disabled={saving || !draft} onClick={() => { onDraft(item.id, ''); setError(''); }}>입력 취소</button><button type="submit" className="prof-btn prof-btn--primary" disabled={saving || refreshing || !draft.trim()}><Icon name="send" size={14} />{saving ? '등록 중…' : replies.length ? '추가 답변 등록' : '답변 등록'}</button></div></div>
        {error && <p className="prof-questions__reply-error" role="alert">{error}</p>}
      </form>
      {course?.path && <Link className="prof-btn stu-questions__course-link" to={course.path}>관련 과제 보기<Icon name="arrowRight" size={14} /></Link>}
    </div>
  </details>;
}

export default function ProfessorReportsPage() {
  const basePath = useConsoleBase();
  const { groups, progress, reloadActivity } = useProfessorData();
  const coursework = useMemo(() => questionCoursework(groups.map(group => ({ title: courseworkTitle(group), path: `${basePath}/assignments/${group.id}/${group.status === 'DRAFT' ? 'edit' : 'results'}`, tasks: group.tasks }))), [groups, basePath]);
  const names = useMemo(() => new Map((progress.students || []).map(student => [student.studentId, student.name])), [progress.students]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingCount, setSavingCount] = useState(0);
  const [notice, setNotice] = useState('');
  const hasDraft = Object.values(drafts).some(text => text.trim());
  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) => (hasDraft || savingCount > 0) && currentLocation.pathname !== nextLocation.pathname, [hasDraft, savingCount]));

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    reportApi.getAll().then(({ data }) => { if (!cancelled) setItems(data || []); })
      .catch(() => { if (!cancelled) setError('질문·신고를 불러오지 못했습니다. 다시 시도해주세요.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version]);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (savingCount > 0) { blocker.reset(); return; }
    if (window.confirm('등록하지 않은 답변이 있습니다. 작성 내용을 버리고 이동할까요?')) blocker.proceed();
    else blocker.reset();
  }, [blocker, savingCount]);
  useEffect(() => {
    if (!hasDraft && !savingCount) return;
    const beforeUnload = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [hasDraft, savingCount]);

  const onDraft = (id, text) => setDrafts(current => ({ ...current, [id]: text }));
  const onReply = (id, reply) => {
    setItems(current => current.map(item => item.id === id ? { ...item, replies: [...(item.replies || []), reply] } : item));
    onDraft(id, '');
    setNotice('답변을 등록했습니다. 학생의 ‘내 질문 관리’에서 확인할 수 있습니다.');
    reloadActivity();
  };
  const answered = items.filter(item => item.replies?.length).length;
  const counts = { all: items.length, pending: items.length - answered, answered };
  const filtered = items.filter(item => matchesQuestion(item, { status, category, search }, [coursework.get(String(item.taskId))?.title, names.get(item.studentId), item.studentId, item.taskId, item.cropId].join(' ')))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt) || b.id - a.id);

  return <>
    <div className="prof-page-head"><div><span className="prof-eyebrow prof-mono">학생 지원</span><h1>질문·신고 관리</h1><p>학생의 질문과 이미지 오류 신고를 확인하고 답변을 남겨주세요.</p></div><button type="button" className="prof-btn" disabled={loading || savingCount > 0} onClick={() => { setNotice(''); setVersion(value => value + 1); }}><Icon name="refresh" size={14} />새로고침</button></div>
    {notice && <p className="prof-questions__success" role="status"><Icon name="checkCircle" size={16} />{notice}</p>}
    <section className="prof-card stu-questions prof-questions" aria-label="학생 질문과 교수 답변">
      <header className="prof-card__head"><div className="prof-tabs" role="group" aria-label="답변 상태">{STATUS.map(([key, label]) => <button type="button" key={key} aria-pressed={status === key} onClick={() => setStatus(key)}>{label}{!loading && !error && <span className="prof-mono"> {counts[key]}</span>}</button>)}</div>{!loading && !error && <span className="prof-muted">질문·신고 {filtered.length}개</span>}</header>
      <div className="stu-questions__filters"><label className="stu-questions__search"><Icon name="search" size={16} /><span className="prof-sr">학생 이름·학번, 과제, 질문 또는 답변 검색</span><input type="search" aria-label="질문·신고 검색" value={search} placeholder="학생 이름·학번, 과제, 질문 또는 답변 검색" onChange={event => setSearch(event.target.value)} /></label><label className="prof-select">질문 유형<select aria-label="질문 유형" value={category} onChange={event => setCategory(event.target.value)}><option value="all">전체 유형</option>{REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}</select></label></div>
      {loading && !items.length ? <p className="prof-empty" role="status">질문과 답변을 불러오는 중…</p>
        : error ? <div className="prof-card__body"><div className="prof-alert" role="alert"><span>{error}</span><button type="button" className="prof-btn" onClick={() => setVersion(value => value + 1)}>다시 시도</button></div></div>
          : <>{loading && <p className="prof-questions__refreshing" role="status">최신 질문과 답변을 불러오는 중…</p>}{!filtered.length ? <div className="prof-empty"><Icon name="help" size={28} /><strong>{items.length ? '조건에 맞는 질문·신고가 없습니다.' : '아직 접수된 질문·신고가 없습니다.'}</strong><p>{items.length ? '검색어나 질문 유형, 답변 상태를 바꿔보세요.' : '학생이 과제에서 질문이나 이미지 오류 신고를 보내면 여기에 표시됩니다.'}</p></div>
            : <div className="stu-questions__list">{filtered.map(item => <QuestionItem key={item.id} item={item} course={coursework.get(String(item.taskId))} studentName={names.get(item.studentId)} draft={drafts[item.id] || ''} onDraft={onDraft} onReply={onReply} refreshing={loading} onSaving={change => setSavingCount(count => Math.max(0, count + change))} />)}</div>}</>}
      <footer className="prof-card__foot"><span className="prof-muted">질문을 누르면 학생의 질문과 답변 이력을 펼쳐보고 답변을 작성할 수 있습니다.</span></footer>
    </section>
  </>;
}
