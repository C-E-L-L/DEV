// Pure helpers for the professor's gradebook (students x published coursework). No React, no network.
// Input is the /api/professor/gradebook response: { students, items, results }.

const time = value => (value ? new Date(value).getTime() : NaN);
const isClosed = (item, now) => Boolean(item.deadlineAt) && time(item.deadlineAt) <= now;
export const resultKey = (studentId, itemId) => `${studentId}:${itemId}`;
export const rate = (correct, graded) => (graded > 0 ? Math.round((correct / graded) * 100) : null);

/**
 * What one gradebook cell shows.
 * SCORED: finally submitted and every answer graded. WAITING: submitted, some answers have no confirmed answer yet.
 * ANSWERING: answering, deadline not passed. NOT_STARTED: nothing yet, deadline not passed. MISSED: deadline passed without a final submission.
 */
export function cellState(result, item, now = Date.now()) {
  const answered = result?.answered || 0;
  if (result?.finalizedAt) {
    const pending = answered - (result.graded || 0);
    if (pending > 0 || !result.graded) return { kind: 'WAITING', answered, pending, graded: result.graded || 0, correct: result.correct || 0, submittedAt: result.finalizedAt };
    return { kind: 'SCORED', answered, pending: 0, graded: result.graded, correct: result.correct, rate: rate(result.correct, result.graded), submittedAt: result.finalizedAt };
  }
  if (isClosed(item, now)) return { kind: 'MISSED', answered, pending: 0 };
  return { kind: answered ? 'ANSWERING' : 'NOT_STARTED', answered, pending: 0 };
}

export const CELL_LABELS = {
  SCORED: '채점 완료', WAITING: '제출 · 정답 확정 대기', ANSWERING: '응답 중', NOT_STARTED: '시작 전', MISSED: '마감 후 미제출',
};

/** Rows with a summary per student, items newest first and a lookup for the results. */
export function buildGradebook(data, now = Date.now()) {
  const items = [...(data?.items || [])].sort((a, b) => b.id - a.id);
  const byKey = new Map((data?.results || []).map(result => [resultKey(result.studentId, result.itemId), result]));
  const rows = (data?.students || []).map(student => {
    const summary = { submitted: 0, missed: 0, openMissing: 0, correct: 0, graded: 0, pending: 0, lastSubmittedAt: null };
    for (const item of items) {
      const state = cellState(byKey.get(resultKey(student.studentId, item.id)), item, now);
      if (state.kind === 'SCORED' || state.kind === 'WAITING') {
        summary.submitted++;
        summary.correct += state.correct;
        summary.graded += state.graded;
        summary.pending += state.pending;
        if (!summary.lastSubmittedAt || time(state.submittedAt) > time(summary.lastSubmittedAt)) summary.lastSubmittedAt = state.submittedAt;
      } else if (state.kind === 'MISSED') summary.missed++;
      else summary.openMissing++;
    }
    return { ...student, summary: { ...summary, total: items.length, rate: rate(summary.correct, summary.graded) } };
  });
  return { items, rows, byKey };
}

/** `filter`: ALL, OPEN_MISSING (an open coursework not submitted), MISSED (a closed one never submitted) or UNREGISTERED. */
export function filterRows(rows, { filter = 'ALL', query = '', section = '' } = {}) {
  const text = query.trim().toLowerCase();
  const matches = {
    ALL: () => true,
    OPEN_MISSING: row => row.summary.openMissing > 0,
    MISSED: row => row.summary.missed > 0,
    UNREGISTERED: row => !row.registered,
  };
  return rows.filter(row => (matches[filter] || matches.ALL)(row)
    && (!section || row.section === section)
    && (!text || `${row.name || ''} ${row.studentId}`.toLowerCase().includes(text)));
}

export function filterCounts(rows, options = {}) {
  return Object.fromEntries(['ALL', 'OPEN_MISSING', 'MISSED', 'UNREGISTERED'].map(filter => [filter, filterRows(rows, { ...options, filter }).length]));
}

/** `sort`: ID, NAME, RATE (lowest first; students without a score last) or MISSING (most unsubmitted first). */
export function sortRows(rows, sort = 'ID') {
  const byId = (a, b) => a.studentId.localeCompare(b.studentId);
  const sorters = {
    ID: byId,
    NAME: (a, b) => (a.name || a.studentId).localeCompare(b.name || b.studentId, 'ko') || byId(a, b),
    RATE: (a, b) => (a.summary.rate ?? Infinity) - (b.summary.rate ?? Infinity) || byId(a, b),
    MISSING: (a, b) => (b.summary.missed + b.summary.openMissing) - (a.summary.missed + a.summary.openMissing) || byId(a, b),
  };
  return [...rows].sort(sorters[sort] || byId);
}

/** `range`: RECENT (newest six), OPEN (deadline not passed) or ALL. Items are already newest first. */
export function visibleItems(items, range = 'RECENT', now = Date.now()) {
  if (range === 'OPEN') return items.filter(item => !isClosed(item, now));
  if (range === 'ALL') return items;
  return items.slice(0, 6);
}

export function sections(rows) {
  return [...new Set(rows.map(row => row.section).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
}

const csvCell = value => {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const csvState = state => ({
  SCORED: `${state.rate}%`, WAITING: '제출(채점 대기)', ANSWERING: `응답 ${state.answered}`, NOT_STARTED: '', MISSED: '미제출',
}[state.kind]);

/** The gradebook as CSV (with a BOM so Excel reads Korean). One column per coursework. */
export function gradebookCsv(rows, items, byKey, now = Date.now()) {
  const header = ['학번', '이름', '분반', '가입', ...items.map(item => item.title), '제출', '정답률'];
  const lines = rows.map(row => [
    row.studentId, row.name || '', row.section || '', row.registered ? '' : '미가입',
    ...items.map(item => csvState(cellState(byKey.get(resultKey(row.studentId, item.id)), item, now))),
    `${row.summary.submitted}/${row.summary.total}`, row.summary.rate == null ? '' : `${row.summary.rate}%`,
  ]);
  return '﻿' + [header, ...lines].map(line => line.map(csvCell).join(',')).join('\r\n');
}

/** Per true class: answers, correct answers and the rate, from a confusion matrix { trueLabel: { answer: count } }. */
export function classRates(matrix, labels) {
  return (labels || []).map(label => {
    const answers = matrix?.[label] || {};
    const total = Object.values(answers).reduce((sum, count) => sum + (count || 0), 0);
    const correct = answers[label] || 0;
    return { label, total, correct, rate: rate(correct, total) };
  });
}

/** Wrong answers, most frequent first: [{ from: true class, to: the student's answer, count }]. */
export function confusionPairs(matrix, limit = 5) {
  const pairs = [];
  for (const [from, answers] of Object.entries(matrix || {})) {
    for (const [to, count] of Object.entries(answers || {})) {
      if (from !== to && count > 0) pairs.push({ from, to, count });
    }
  }
  return pairs.sort((a, b) => b.count - a.count || a.from.localeCompare(b.from)).slice(0, limit);
}
