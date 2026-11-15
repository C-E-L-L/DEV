import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { speciesApi, taskApi } from '../../api';
import { professorApi } from '../../api/professor';
import { groupCoursework } from '../../utils/coursework';
import { courseworkCounts, indexProgress } from '../../utils/professorDashboard';

const ACTIVITY_POLL_MS = 60000;
const STALE_MS = 15000;
const errorMessage = error => error?.response?.data?.message || error.message || '요청을 처리하지 못했습니다. 다시 시도해주세요.';

const ProfessorDataContext = createContext(null);

/**
 * Data shared by every professor page: species, coursework, who has submitted, and the activity feed.
 * Loaded once for the console; pages call `reload` after they change something.
 */
export function ProfessorDataProvider({ children }) {
  const { pathname } = useLocation();
  const [species, setSpecies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ students: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState({ events: [], unansweredReports: 0 });
  const [activityLoaded, setActivityLoaded] = useState(false);
  const request = useRef(0);
  const loadedAt = useRef(0);

  // `silent` refreshes in place (no loading state), e.g. when a page is opened again.
  const reload = useCallback(async ({ silent = false } = {}) => {
    const id = ++request.current;
    if (!silent) setLoading(true);
    setError('');
    try {
      const [s, t, p] = await Promise.all([speciesApi.getAll(), taskApi.getAll(), professorApi.progress()]);
      if (id !== request.current) return;
      setSpecies(s.data); setTasks(t.data); setProgress(p.data);
      loadedAt.current = Date.now();
    } catch (e) {
      if (id === request.current && !axios.isCancel(e)) setError(errorMessage(e));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, []);

  const reloadActivity = useCallback(async () => {
    try {
      const { data } = await professorApi.activity(30);
      setActivity(data);
      setActivityLoaded(true);
    } catch {
      // The feed is secondary: keep the last result and try again on the next poll.
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Moving between pages shows current numbers without each page fetching again.
  useEffect(() => {
    if (loadedAt.current && Date.now() - loadedAt.current > STALE_MS) reload({ silent: true });
  }, [pathname, reload]);

  // Refresh the feed on every page change and once a minute while the tab is visible.
  useEffect(() => {
    reloadActivity();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') reloadActivity(); }, ACTIVITY_POLL_MS);
    return () => window.clearInterval(timer);
  }, [pathname, reloadActivity]);

  const value = useMemo(() => {
    const groups = groupCoursework(tasks);
    return {
      species, tasks, groups, progress, loading, error, reload,
      progressByTask: indexProgress(progress),
      counts: courseworkCounts(groups),
      activity, activityLoaded, reloadActivity,
    };
  }, [species, tasks, progress, loading, error, reload, activity, activityLoaded, reloadActivity]);

  return <ProfessorDataContext.Provider value={value}>{children}</ProfessorDataContext.Provider>;
}

export function useProfessorData() {
  const context = useContext(ProfessorDataContext);
  if (!context) throw new Error('useProfessorData must be used within ProfessorDataProvider');
  return context;
}
