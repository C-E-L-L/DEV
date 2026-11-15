// Pure helpers for the professor console (dashboard, sidebar counts, progress). No React, no network.
import { isDiagnostic } from './coursework.js';

const DAY_MS = 86400000;
const pad = value => String(value).padStart(2, '0');
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function courseworkTitle(group) {
  return group?.title || (isDiagnostic(group) ? '진단평가' : group?.uploadedFilename || `과제 #${group?.id}`);
}

/** Earliest deadline of the coursework's tasks (an assignment shares one deadline). */
export function courseworkDeadline(group) {
  const deadlines = (group.tasks || [group]).map(task => task.deadlineAt).filter(Boolean).sort();
  return deadlines[0] || null;
}

/**
 * DRAFT: not published. ACTIVE: published and still open. CLOSED: published and past its deadline.
 * The backend never sets a "completed" status, so completion is the deadline having passed.
 */
export function courseworkPhase(group, now = new Date()) {
  if (group.status === 'DRAFT') return 'DRAFT';
  if (group.status === 'ARCHIVED') return 'ARCHIVED';
  const deadline = courseworkDeadline(group);
  return deadline && new Date(deadline).getTime() <= now.getTime() ? 'CLOSED' : 'ACTIVE';
}

/** Published coursework that still has questions without a confirmed answer: students wait for grading. */
export function pendingLabelCount(group) {
  if (group.status === 'DRAFT' || group.status === 'ARCHIVED') return 0;
  return Math.max(0, (group.cropCount || 0) - (group.labeledCount || 0));
}

export function courseworkCounts(groups, now = new Date()) {
  const counts = { drafts: 0, active: 0, completed: 0 };
  for (const group of groups) {
    const phase = courseworkPhase(group, now);
    if (phase === 'DRAFT') counts.drafts++;
    else if (phase === 'ACTIVE') counts.active++;
    else if (phase === 'CLOSED') counts.completed++;
  }
  return counts;
}

/** `tone`: none | closed | urgent (2 days or less) | normal. */
export function deadlineInfo(deadlineAt, now = new Date()) {
  if (!deadlineAt) return { label: '마감 없음', dateText: '', tone: 'none' };
  const deadline = new Date(deadlineAt);
  const dateText = `${pad(deadline.getMonth() + 1)}.${pad(deadline.getDate())} ${pad(deadline.getHours())}:${pad(deadline.getMinutes())}`;
  if (deadline.getTime() <= now.getTime()) return { label: '마감됨', dateText, tone: 'closed' };
  const days = Math.round((startOfDay(deadline) - startOfDay(now)) / DAY_MS);
  return { label: days === 0 ? 'D-Day' : `D-${days}`, dateText, tone: days <= 2 ? 'urgent' : 'normal' };
}

export function relativeTime(at, now = new Date()) {
  if (!at) return '';
  const date = new Date(at);
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))}일 전`;
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** taskId -> progress item, so a coursework group can be matched by any of its tasks. */
export function indexProgress(progress) {
  const byTask = new Map();
  for (const item of progress?.items || []) for (const taskId of item.taskIds) byTask.set(taskId, item);
  return byTask;
}

/** Who submitted and who did not, optionally limited to one 분반. */
export function submissionSummary(item, students = [], section = '') {
  const target = students.filter(student => !section || student.section === section);
  const finalizedAt = new Map((item?.submitted || []).map(entry => [entry.studentId, entry.finalizedAt]));
  const done = target.filter(student => finalizedAt.has(student.studentId))
    .map(student => ({ ...student, finalizedAt: finalizedAt.get(student.studentId) }));
  const missing = target.filter(student => !finalizedAt.has(student.studentId));
  return { total: target.length, submitted: done.length, done, missing };
}

export function studentLabel(student) {
  return student.name ? `${student.name} (${student.studentId})` : student.studentId;
}

/**
 * Class-wide accuracy from the calibration response (per-student confusion matrices):
 * overall, per true class (row), and students ordered from lowest accuracy.
 */
export function classAccuracy(calibration) {
  const labels = calibration?.labels || [];
  const matrices = (calibration?.studentMatrices || []).filter(student => student.studentId !== 'ALL');
  const classes = labels.map(label => ({ label, total: 0, correct: 0 }));
  for (const student of matrices) {
    for (const row of classes) {
      const answers = student.confusionMatrix?.[row.label] || {};
      row.total += Object.values(answers).reduce((sum, count) => sum + (count || 0), 0);
      row.correct += answers[row.label] || 0;
    }
  }
  const total = classes.reduce((sum, row) => sum + row.total, 0);
  const correct = classes.reduce((sum, row) => sum + row.correct, 0);
  const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);
  return {
    total,
    accuracy: percent(correct, total),
    classes: classes.map(row => ({ ...row, accuracy: percent(row.correct, row.total) })),
    students: matrices.filter(student => student.totalSolved > 0)
      .map(student => ({ studentId: student.studentId, name: student.studentName, accuracy: student.accuracy, totalSolved: student.totalSolved }))
      .sort((a, b) => a.accuracy - b.accuracy || a.studentId.localeCompare(b.studentId)),
    gradedStudents: matrices.filter(student => student.totalSolved > 0).length,
  };
}
