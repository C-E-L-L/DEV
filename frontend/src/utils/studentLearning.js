export function learningStatus(summary, deadlineAt, now = Date.now()) {
  if (!summary.totalCells) return 'EMPTY';
  if (summary.answeredCells >= summary.totalCells) return 'COMPLETED';
  if (deadlineAt && new Date(deadlineAt).getTime() <= now) return 'CLOSED';
  return summary.answeredCells ? 'IN_PROGRESS' : 'NOT_STARTED';
}

export const LEARNING_STATUS_LABELS = {
  EMPTY: '문항 없음', COMPLETED: '풀이 완료', CLOSED: '마감 · 미완료', IN_PROGRESS: '풀이 중', NOT_STARTED: '미시작',
};

export function learningScore(summary) {
  if (!summary.totalCells) return '문항 없음';
  if (!summary.answeredCells) return '응답 없음';
  if (!summary.labelingComplete || summary.accuracy == null) return '채점 대기';
  return `${summary.correct} / ${summary.totalCells} (${Number(summary.accuracy).toFixed(1)}%)`;
}

export function summarizeLearningHistory(activities) {
  const completed = summary => summary.totalCells > 0 && summary.answeredCells >= summary.totalCells;
  return {
    answered: activities.reduce((sum, activity) => sum + activity.summary.answeredCells, 0),
    assignments: activities.filter(activity => activity.scopeType === 'ASSIGNMENT' && completed(activity.summary)).length,
    tasks: activities.filter(activity => activity.scopeType !== 'DIAGNOSTIC')
      .flatMap(activity => activity.tasks).filter(task => completed(task.summary)).length,
    diagnostics: activities.filter(activity => activity.scopeType === 'DIAGNOSTIC' && completed(activity.summary)).length,
  };
}
