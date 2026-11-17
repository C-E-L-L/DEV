import { useConsoleBase } from '../../components/console/ConsoleContext';
import { useCallback, useEffect, useRef } from 'react';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CourseworkCreator from '../../components/CourseworkCreator';
import { useProfessorData } from './ProfessorData';
import LabelingWorkspace from './review/LabelingWorkspace';
import ResultsWorkspace from './review/ResultsWorkspace';

/** Returns to where the user came from, or to `fallback` when the page was opened directly. */
function useGoBack(fallback) {
  const navigate = useNavigate();
  return useCallback(() => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}

export function AssignmentCreatePage() {
  const basePath = useConsoleBase();
  const navigate = useNavigate();
  const goBack = useGoBack(`${basePath}/assignments/drafts`);
  const { species, loading, reload } = useProfessorData();
  const [params] = useSearchParams();
  // "도말 업로드" on the data page opens this form with the smear practice already chosen.
  const initialKind = params.get('kind') === 'practice' ? 'PRACTICE' : 'DIAGNOSTIC';
  if (loading) return <p role="status" className="prof-empty">동물 종 정보를 불러오는 중…</p>;
  return <CourseworkCreator key={initialKind}
    species={species.filter(item => item.active !== false)}
    initialKind={initialKind}
    onCancel={goBack}
    onCreated={id => { reload({ silent: true }); navigate(`${basePath}/assignments/${id}/edit`, { replace: true }); }}
  />;
}

export function AssignmentEditPage() {
  const basePath = useConsoleBase();
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack(`${basePath}/assignments/drafts`);
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

  return <LabelingWorkspace key={id} id={Number(id)} basePath={basePath}
    onDirty={value => { dirty.current = value; }}
    onBack={() => { reload({ silent: true }); goBack(); }}
    onPublished={() => { dirty.current = false; reload({ silent: true }); navigate(`${basePath}/assignments/active`, { replace: true }); }}
  />;
}

export function AssignmentResultsPage() {
  const basePath = useConsoleBase();
  const { id } = useParams();
  const goBack = useGoBack(`${basePath}/assignments/active`);
  return <ResultsWorkspace key={id} id={Number(id)} basePath={basePath} onBack={goBack} />;
}
