// Pure helpers for the student dashboard. No React, no network.
// Everything here works on results the student is already allowed to see (published reviews),
// on the student's own answers and questions, so nothing reveals an answer before grading.

const UNKNOWN = 'UNKNOWN';
const DAY_MS = 86400000;
const DUE_SOON_DAYS = 3;
const NEW_REPLY_DAYS = 7;

export const displayLabel = label => (label === UNKNOWN ? '모르겠어요' : label);
const time = value => (value ? new Date(value).getTime() : NaN);
const startOfDay = ms => { const date = new Date(ms); return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); };

/** Completion means final submission, independently of grading or how many answers are saved. */
export function matchesCourseworkStatus(state, status) {
  if (status === 'ongoing') return state.todo;
  if (status === 'completed') return state.submitted;
  return true;
}

export function courseworkCounts(rows) {
  return {
    all: rows.length,
    ongoing: rows.filter(({ state }) => matchesCourseworkStatus(state, 'ongoing')).length,
    completed: rows.filter(({ state }) => matchesCourseworkStatus(state, 'completed')).length,
  };
}

/** Calendar days until a deadline: 0 on the day itself. */
export function daysUntil(deadlineAt, now = Date.now()) {
  return Math.round((startOfDay(time(deadlineAt)) - startOfDay(now)) / DAY_MS);
}

/** Open (not past) and due within three days. */
export function isDueSoon(deadlineAt, now = Date.now()) {
  const due = time(deadlineAt);
  return Number.isFinite(due) && due > now && daysUntil(deadlineAt, now) <= DUE_SOON_DAYS;
}

/**
 * Overall accuracy over graded answers, the per-coursework accuracies for the trend line
 * (oldest to newest; reviews come newest first) and the change from the coursework before.
 */
export function accuracyTrend(reviews, limit = 5) {
  const scored = (reviews || []).filter(review => review.accuracy != null && review.correct + review.wrong > 0).slice().reverse();
  const correct = scored.reduce((sum, review) => sum + review.correct, 0);
  const graded = scored.reduce((sum, review) => sum + review.correct + review.wrong, 0);
  const points = scored.slice(-limit).map(review => ({ review, accuracy: review.accuracy }));
  return {
    overall: graded ? Math.round((correct / graded) * 100) : null,
    points,
    delta: points.length >= 2 ? points[points.length - 1].accuracy - points[points.length - 2].accuracy : null,
  };
}

/** Wrong answers of published results, newest coursework first. */
export function wrongCells(reviews) {
  return (reviews || []).flatMap(review => (review.cells || []).map((cell, index) => ({ review, cell, index })))
    .filter(({ cell }) => cell.isCorrect === false);
}

const pairKey = cell => `${cell.studentLabel}→${cell.correctLabel}`;

/** "my answer → correct answer" pairs, most frequent first. */
export function confusionPairs(wrong) {
  const pairs = new Map();
  for (const { cell } of wrong) {
    const key = pairKey(cell);
    if (!pairs.has(key)) pairs.set(key, { key, answer: cell.studentLabel, correct: cell.correctLabel, count: 0 });
    pairs.get(key).count++;
  }
  return [...pairs.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export const matchesPair = (cell, key) => !key || pairKey(cell) === key;

/** Professor replies to the student's questions within the last week. */
export function newReplyCount(reports, now = Date.now()) {
  return (reports || []).flatMap(report => report.replies || [])
    .filter(reply => now - time(reply.createdAt) <= NEW_REPLY_DAYS * DAY_MS).length;
}

/**
 * Counts for the one-line summary under the greeting.
 * `rows`: [{ item, state }] with the coursework state of StudentData.
 */
export function todoSummary(rows, reports, now = Date.now()) {
  const todo = rows.filter(row => row.state.todo);
  return {
    active: todo.length,
    dueSoon: todo.filter(row => isDueSoon(row.item.deadlineAt, now)).length,
    toSubmit: todo.filter(row => row.state.completed && !row.state.submitted).length,
    newReplies: newReplyCount(reports, now),
  };
}

/**
 * The student's recent activity, newest first: professor replies, the student's own questions,
 * newly published coursework and deadlines that came within three days. A deadline counts from
 * the moment it became close (three days before), so it sorts in with the other events.
 */
export function activityFeed({ rows = [], reports = [], now = Date.now(), limit = 5 }) {
  const events = [];
  for (const report of reports || []) {
    events.push({ key: `q-${report.id}`, type: 'question', at: report.createdAt, text: report.reason, to: '/student/questions' });
    for (const reply of report.replies || []) {
      events.push({
        key: `r-${reply.id ?? `${report.id}-${reply.createdAt}`}`, type: 'reply', at: reply.createdAt,
        author: reply.authorName || reply.authorUsername, text: reply.message, to: '/student/questions',
        fresh: now - time(reply.createdAt) <= NEW_REPLY_DAYS * DAY_MS,
      });
    }
  }
  for (const { item, state } of rows) {
    if (item.publishedAt && time(item.publishedAt) <= now) {
      events.push({ key: `p-${item.key}`, type: 'published', at: item.publishedAt, title: item.title, to: item.path });
    }
    if (state.todo && isDueSoon(item.deadlineAt, now)) {
      const days = daysUntil(item.deadlineAt, now);
      const at = Math.min(now, time(item.deadlineAt) - DUE_SOON_DAYS * DAY_MS);
      events.push({ key: `d-${item.key}`, type: 'due', at: new Date(at).toISOString(), title: item.title, days, to: item.path });
    }
  }
  return events.filter(event => Number.isFinite(time(event.at)))
    .sort((a, b) => time(b.at) - time(a.at)).slice(0, limit);
}

/**
 * The student's notification bell: what others did for the student (professor replies, new
 * coursework, notices) and deadlines that came close. The student's own questions are left out.
 * Notices open on the dashboard, where the notice board is.
 */
export function notificationFeed({ rows = [], reports = [], announcements = [], now = Date.now(), limit = 20 }) {
  const events = activityFeed({ rows, reports, now, limit: Infinity }).filter(event => event.type !== 'question');
  for (const notice of announcements || []) {
    events.push({ key: `n-${notice.id}`, type: 'notice', at: notice.createdAt, title: notice.title, urgent: Boolean(notice.urgent), to: `/student?notice=${notice.id}` });
  }
  return events.filter(event => Number.isFinite(time(event.at)) && time(event.at) <= now)
    .sort((a, b) => time(b.at) - time(a.at)).slice(0, limit);
}

/** How many notifications arrived after `seenAt` (ms; 0 = never opened in this browser). */
export const unreadCount = (events, seenAt) => events.filter(event => time(event.at) > seenAt).length;
