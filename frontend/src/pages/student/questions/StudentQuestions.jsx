import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../../../api/reports';
import { REPORT_REASONS, imageUrl } from '../../../constants';
import AuthImage from '../../../components/AuthImage';
import Icon from '../../../components/login/icons';
import { matchesQuestion, parseQuestion, questionCoursework } from '../../../utils/studentQuestions';
import { useStudentData } from '../StudentData';
import './studentQuestions.css';

const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('ko-KR') : '등록일 미확인';

export function StudentQuestionList({ items, coursework }) {
  return <div className="stu-questions__list">{items.map(item => {
    const { category, body } = parseQuestion(item.reason);
    const course = coursework.get(String(item.taskId));
    const replies = [...(item.replies || [])].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return <details className="stu-questions__item" key={item.id}>
      <summary className="stu-questions__summary">
        {item.cropFilename ? <AuthImage src={imageUrl.crop(item.cropFilename)} alt={`질문한 세포 #${item.cropId}`} className="stu-questions__photo" />
          : <span className="stu-questions__photo stu-questions__photo--empty"><Icon name="help" size={24} /></span>}
        <span className="stu-questions__preview">
          <span className="stu-questions__tags"><span className="prof-badge">{category}</span><span className="stu-questions__date">{date(item.createdAt)}</span></span>
          <strong className="stu-questions__title">{body}</strong>
          <span className="stu-questions__context">{course?.title || `과제 #${item.taskId}`} · 세포 #{item.cropId}{item.speciesName ? ` · ${item.speciesName}` : ''}</span>
        </span>
        <span className={`prof-badge stu-questions__status ${replies.length ? 'is-emerald' : 'is-amber'}`}>{replies.length ? '답변 등록됨' : '답변 대기'}</span>
        <Icon name="chevronDown" size={16} className="stu-questions__chevron" />
      </summary>
      <div className="stu-questions__detail">
        <section className="stu-questions__message" aria-label="내 질문 내용"><h3>내 질문</h3><p>{body}</p></section>
        <section className="stu-questions__replies" aria-label="받은 답변">
          <h3><Icon name="help" size={15} />받은 답변 <span className="prof-nav__badge prof-mono">{replies.length}</span></h3>
          {replies.length ? replies.map(reply => <article className="stu-questions__reply" key={reply.id}>
            <header><strong>{reply.authorName || reply.authorUsername || '답변자'}</strong>
              <span className="prof-badge">{reply.authorRole === 'ADMIN' ? '관리자' : reply.authorRole === 'EXPERT' ? '교수' : '답변자'}</span><time dateTime={reply.createdAt}>{date(reply.createdAt)}</time></header>
            <p>{reply.message}</p>
          </article>) : <p className="stu-questions__waiting"><Icon name="clock" size={15} />교수 또는 관리자의 답변을 기다리고 있어요.</p>}
        </section>
        {course?.path && <Link className="prof-btn stu-questions__course-link" to={course.path}>관련 과제 보기<Icon name="arrowRight" size={14} /></Link>}
      </div>
    </details>;
  })}</div>;
}

export default function StudentQuestions() {
  const studentData = useStudentData();
  const coursework = useMemo(() => questionCoursework(studentData?.items || []), [studentData?.items]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    reportApi.getMine().then(({ data }) => { if (!cancelled) setItems(data || []); })
      .catch(() => { if (!cancelled) setError('질문과 답변을 불러오지 못했습니다.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [version]);
  useEffect(() => {
    const reload = () => { if (document.visibilityState === 'visible') setVersion(value => value + 1); };
    window.addEventListener('focus', reload);
    return () => window.removeEventListener('focus', reload);
  }, []);

  const answered = items.filter(item => item.replies?.length).length;
  const filtered = items.filter(item => matchesQuestion(item, { status, category, search }, coursework.get(String(item.taskId))?.title))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const counts = { all: items.length, pending: items.length - answered, answered };

  return <>
    <div className="prof-page-head"><div><span className="prof-eyebrow prof-mono">마이페이지</span><h1>내 질문 관리</h1>
      <p>과제에서 보낸 질문·이미지 오류 신고와 교수 또는 관리자의 답변을 확인하세요.</p></div></div>
    <section className="prof-card stu-questions" aria-label="내 질문과 답변">
      <header className="prof-card__head">
        <div className="prof-tabs" role="group" aria-label="답변 상태">{[['all', '전체'], ['pending', '답변 대기'], ['answered', '답변 등록됨']].map(([key, label]) => (
          <button type="button" key={key} aria-pressed={status === key} onClick={() => setStatus(key)}>{label}{!loading && !error && <span className="prof-mono"> {counts[key]}</span>}</button>
        ))}</div>
        {!loading && !error && <span className="prof-muted">질문 {filtered.length}개</span>}
      </header>
      <div className="stu-questions__filters">
        <label className="stu-questions__search"><Icon name="search" size={16} /><span className="prof-sr">과제명, 질문 또는 답변 검색</span>
          <input type="search" value={search} placeholder="과제명, 질문 또는 답변으로 검색" onChange={event => setSearch(event.target.value)} /></label>
        <label className="prof-select">질문 유형<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">전체 유형</option>{REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}</select></label>
      </div>
      {loading ? <p className="prof-empty" role="status">질문과 답변을 불러오는 중…</p>
        : error ? <div className="prof-card__body"><div className="prof-alert" role="alert"><span>{error}</span><button type="button" className="prof-btn" onClick={() => setVersion(value => value + 1)}>다시 시도</button></div></div>
          : !filtered.length ? <div className="prof-empty"><Icon name="help" size={28} /><strong>{items.length ? '조건에 맞는 질문이 없습니다.' : '아직 보낸 질문이 없습니다.'}</strong>
            <p>{items.length ? '검색어나 질문 유형을 바꿔보세요.' : '과제를 풀다가 궁금한 세포가 있으면 ‘질문·오류 신고’로 질문을 보내세요.'}</p></div>
            : <StudentQuestionList items={filtered} coursework={coursework} />}
      <footer className="prof-card__foot"><span className="prof-muted">질문을 누르면 질문 내용과 받은 답변을 펼쳐볼 수 있습니다.</span></footer>
    </section>
  </>;
}
