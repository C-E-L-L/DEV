import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { cropApi, submissionApi, taskApi } from '../../api';
import { isDiagnostic, isPublished } from '../../utils/coursework';

const StudentDataContext = createContext(null);

/**
 * Published coursework as the student sees it: diagnostics first (oldest first), then assignments
 * (several smears sharing one title and deadline), then single-smear tasks.
 */
export function buildCoursework(tasks) {
  const byCreated = (a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0)
    || (a.id || 0) - (b.id || 0);
  const diagnostics = tasks.filter(isDiagnostic).sort(byCreated).map((task, index) => ({
    key: `task-${task.id}`, kind: 'task', id: task.id, diagnostic: true, tasks: [task],
    title: task.title || `진단평가 #${index + 1}`,
  }));

  const assignments = new Map();
  const singles = [];
  for (const task of tasks) {
    if (isDiagnostic(task)) continue;
    if (!task.assignmentId) {
      singles.push({ key: `task-${task.id}`, kind: 'task', id: task.id, diagnostic: false, tasks: [task], title: task.title || `분류 실습 #${task.id}` });
      continue;
    }
    if (!assignments.has(task.assignmentId)) {
      assignments.set(task.assignmentId, {
        key: `assignment-${task.assignmentId}`, kind: 'assignment', id: task.assignmentId, diagnostic: false, tasks: [],
        title: task.title || `과제 #${task.assignmentId}`,
      });
    }
    assignments.get(task.assignmentId).tasks.push(task);
  }

  return [...diagnostics, ...assignments.values(), ...singles].map(item => ({
    ...item,
    deadlineAt: item.tasks[0]?.deadlineAt || null,
    thumbnail: item.tasks[0]?.originalFilename || null,
    path: `/student/work/${item.kind}/${item.id}`,
  }));
}

/** The same requests the task cards have always made: answers saved so far, final submission, and result availability. */
async function loadProgress(item, username) {
  const first = item.tasks[0];
  if (item.kind === 'assignment') {
    const total = item.tasks.reduce((sum, task) => sum + (task.cropCount || 0), 0);
    if (total === 0) return { total: 0, solved: 0, submitted: false, reviewAvailable: false, accuracy: null };
    const [{ data: attempt }, { data: solved }] = await Promise.all([
      submissionApi.attempt(first.id),
      submissionApi.getSolvedCropsForAssignment(item.id, username),
    ]);
    let reviewAvailable = Boolean(attempt.reviewAvailable);
    if (solved.length >= total) {
      // The results request only succeeds once the results are open to the student.
      try { await submissionApi.getMyResultsForAssignment(item.id, username); reviewAvailable = true; } catch { reviewAvailable = false; }
    }
    return { total, solved: solved.length, submitted: Boolean(attempt.submitted), reviewAvailable, accuracy: null };
  }

  const [{ data: attempt }, { data: crops }, { data: solved }] = await Promise.all([
    submissionApi.attempt(first.id),
    cropApi.getByTaskId(first.id),
    submissionApi.getSolvedCrops(first.id, username),
  ]);
  let accuracy = null;
  if (attempt.reviewAvailable && crops.length > 0 && solved.length === crops.length) {
    const { data: stats } = await submissionApi.getMyResults(first.id, username);
    if (stats?.accuracy !== undefined) accuracy = stats.accuracy;
  }
  return { total: crops.length, solved: solved.length, submitted: Boolean(attempt.submitted), reviewAvailable: Boolean(attempt.reviewAvailable), accuracy };
}

/**
 * What a coursework card shows. `tone` follows the console badges (indigo: in progress,
 * amber: needs the final submission, emerald: submitted, closed: past the deadline).
 */
export function courseworkState(item, progress, now = Date.now()) {
  const { total = 0, solved = 0, submitted = false, reviewAvailable = false } = progress || {};
  const expired = Boolean(item.deadlineAt && new Date(item.deadlineAt).getTime() <= now);
  const completed = total > 0 && solved >= total;
  const percent = total === 0 ? 0 : Math.min(100, Math.round((solved / total) * 100));
  const [label, tone] = expired ? ['마감', 'closed']
    : submitted ? ['최종 제출 완료', 'emerald']
      : completed ? ['응답 완료 · 제출 필요', 'amber']
        : solved > 0 ? ['응답 중', 'indigo'] : ['시작 전', 'indigo'];
  return { expired, completed, submitted, percent, label, tone, total, solved, openReview: expired || reviewAvailable, todo: !expired && !submitted };
}

export function StudentDataProvider({ children }) {
  const { user } = useAuth();
  const username = user?.username;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({});

  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    return taskApi.getAll()
      .then(({ data }) => setTasks(data.filter(isPublished)))
      .catch(() => setError('과제 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const items = useMemo(() => buildCoursework(tasks), [tasks]);

  const refresh = useCallback(item => loadProgress(item, username)
    .then(value => setProgress(current => ({ ...current, [item.key]: value })))
    .catch(err => {
      console.error(err);
      setProgress(current => ({ ...current, [item.key]: current[item.key] || { total: 0, solved: 0, submitted: false, reviewAvailable: false, accuracy: null } }));
    }), [username]);

  useEffect(() => {
    if (username) items.forEach(item => { refresh(item); });
  }, [items, username, refresh]);

  const value = useMemo(() => ({ username, items, progress, loading, error, reload, refresh }),
    [username, items, progress, loading, error, reload, refresh]);
  return <StudentDataContext.Provider value={value}>{children}</StudentDataContext.Provider>;
}

export function useStudentData() {
  return useContext(StudentDataContext);
}
