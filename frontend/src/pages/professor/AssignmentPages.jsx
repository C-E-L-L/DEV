import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import AnalyticsFeedback from '../../components/AnalyticsFeedback';
import CourseworkCreator from '../../components/CourseworkCreator';
import CourseworkEditor from '../../components/CourseworkEditor';
import { useProfessorData } from './ProfessorData';

/** Returns to where the user came from, or to `fallback` when the page was opened directly. */
function useGoBack(fallback) {
  const navigate = useNavigate();
  return useCallback(() => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}

export function AssignmentCreatePage() {
  const navigate = useNavigate();
  const goBack = useGoBack('/expert/assignments/drafts');
  const { species, loading, reload } = useProfessorData();
  return <div className="professor-workspace prof-embedded">
    {loading ? <p role="status">동물 종 정보를 불러오는 중…</p> : <CourseworkCreator
      species={species.filter(item => item.active !== false)}
      onCancel={goBack}
      onCreated={id => { reload({ silent: true }); navigate(`/expert/assignments/${id}/edit`, { replace: true }); }}
    />}
  </div>;
}

export function AssignmentEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack('/expert/assignments/drafts');
  const { reload } = useProfessorData();
  const dirty = useRef(false);

  // Sidebar links and the browser's back button both ask before discarding unsaved edits.
  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) =>
    dirty.current && currentLocation.pathname !== nextLocation.pathname, []));
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('저장하지 않은 변경 사항이 있습니다. 저장하지 않고 이동할까요?')) {
      dirty.current = false;
      blocker.proceed();
    } else blocker.reset();
  }, [blocker]);

  return <div className="professor-workspace prof-embedded">
    <CourseworkEditor key={id} id={Number(id)}
      onDirty={value => { dirty.current = value; }}
      onBack={() => { reload({ silent: true }); goBack(); }}
      onPublished={() => { dirty.current = false; reload({ silent: true }); navigate('/expert/assignments/active', { replace: true }); }}
    />
  </div>;
}

export function AssignmentResultsPage() {
  const { id } = useParams();
  const goBack = useGoBack('/expert/assignments/active');
  return <div className="professor-workspace prof-embedded">
    <button onClick={goBack}>← 과제 목록</button>
    <AnalyticsFeedback key={id} initialTaskId={Number(id)} courseworkOnly />
  </div>;
}
