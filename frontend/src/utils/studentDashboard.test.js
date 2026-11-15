import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracyTrend, activityFeed, confusionPairs, daysUntil, isDueSoon, matchesPair, newReplyCount, notificationFeed, todoSummary, unreadCount, wrongCells,
} from './studentDashboard.js';

const NOW = new Date('2026-11-16T12:00:00').getTime();
const cell = (correctLabel, studentLabel, cropId) => ({ cropId, correctLabel, studentLabel, isCorrect: correctLabel ? correctLabel === studentLabel : null });
// Reviews come from the API newest first.
const reviews = [
  { scopeId: 3, title: 'C', accuracy: 75, correct: 3, wrong: 1, cells: [cell('Segment', 'Segment', 31), cell('Band', 'Band', 32), cell('Eosinophil', 'UNKNOWN', 33), cell('Monocyte', 'Monocyte', 34)] },
  { scopeId: 2, title: 'B', accuracy: null, correct: 0, wrong: 0, cells: [cell(null, 'Band', 21)] },
  { scopeId: 1, title: 'A', accuracy: 50, correct: 2, wrong: 2, cells: [cell('Segment', 'Segment', 11), cell('Band', 'Segment', 12), cell('Band', 'Segment', 13), cell('Segment', 'Segment', 14)] },
];

test('trend reads oldest to newest, weights the overall accuracy by answers and reports the last change', () => {
  const trend = accuracyTrend(reviews);
  assert.deepEqual(trend.points.map(point => point.review.title), ['A', 'C']);
  assert.equal(trend.overall, 63);
  assert.equal(trend.delta, 25);
  assert.deepEqual(accuracyTrend([]), { overall: null, points: [], delta: null });
});

test('wrong cells keep only graded wrong answers and the pairs count "my answer → correct answer"', () => {
  const wrong = wrongCells(reviews);
  assert.deepEqual(wrong.map(entry => entry.cell.cropId), [33, 12, 13]);
  assert.equal(wrong[1].index, 1);
  const pairs = confusionPairs(wrong);
  assert.deepEqual(pairs.map(pair => [pair.answer, pair.correct, pair.count]), [['Segment', 'Band', 2], ['UNKNOWN', 'Eosinophil', 1]]);
  assert.equal(matchesPair(wrong[1].cell, pairs[0].key), true);
  assert.equal(matchesPair(wrong[0].cell, pairs[0].key), false);
  assert.equal(matchesPair(wrong[0].cell, null), true);
});

test('deadlines: calendar days and the three-day window', () => {
  assert.equal(daysUntil('2026-11-18T09:00:00', NOW), 2);
  assert.equal(isDueSoon('2026-11-19T23:00:00', NOW), true);
  assert.equal(isDueSoon('2026-11-20T09:00:00', NOW), false);
  assert.equal(isDueSoon('2026-11-16T11:00:00', NOW), false, 'already closed');
  assert.equal(isDueSoon(null, NOW), false);
});

const item = (key, deadlineAt, publishedAt) => ({ key, title: key, path: `/student/work/task/${key}`, deadlineAt, publishedAt });
const state = (over = {}) => ({ todo: true, completed: false, submitted: false, ...over });
const rows = [
  { item: item('due', '2026-11-18T18:00:00', '2026-11-13T09:00:00'), state: state() },
  { item: item('ready', '2026-11-21T18:00:00', '2026-11-14T09:00:00'), state: state({ completed: true }) },
  { item: item('done', '2026-11-17T18:00:00', '2026-11-10T09:00:00'), state: state({ todo: false, completed: true, submitted: true }) },
];
const reports = [
  { id: 1, createdAt: '2026-11-15T10:00:00', reason: 'Band?', replies: [{ id: 9, authorName: '한서진', message: '답변', createdAt: '2026-11-16T11:50:00' }] },
  { id: 2, createdAt: '2026-11-01T10:00:00', reason: 'old', replies: [{ id: 8, createdAt: '2026-11-02T10:00:00' }] },
];

test('summary counts open coursework, close deadlines, coursework waiting for submission and recent replies', () => {
  assert.deepEqual(todoSummary(rows, reports, NOW), { active: 2, dueSoon: 1, toSubmit: 1, newReplies: 1 });
  assert.equal(newReplyCount(null, NOW), 0);
});

test('activity feed mixes replies, questions, new coursework and close deadlines, newest first', () => {
  const feed = activityFeed({ rows, reports, now: NOW, limit: 10 });
  // The deadline on 11.18 18:00 became close on 11.15 18:00, three days before.
  assert.deepEqual(feed.map(event => event.key), ['r-9', 'd-due', 'q-1', 'p-ready', 'p-due', 'p-done', 'r-8', 'q-2']);
  assert.equal(feed[0].fresh, true);
  assert.equal(feed[1].days, 2);
  assert.equal(feed.find(event => event.key === 'r-8').fresh, false);
  assert.equal(activityFeed({ rows, reports, now: NOW }).length, 5);
});

test('notifications leave out the student questions and add notices', () => {
  const announcements = [
    { id: 3, title: '실습실 공지', urgent: true, createdAt: '2026-11-16T09:00:00' },
    { id: 4, title: '예약 공지', urgent: false, createdAt: '2026-11-17T09:00:00' }, // not yet: ignored
  ];
  const feed = notificationFeed({ rows, reports, announcements, now: NOW });
  assert.deepEqual(feed.map(event => event.key), ['r-9', 'n-3', 'd-due', 'p-ready', 'p-due', 'p-done', 'r-8']);
  assert.deepEqual([feed[1].urgent, feed[1].to], [true, '/student?notice=3']);
  assert.equal(notificationFeed({ rows, reports, now: NOW, limit: 2 }).length, 2);
  assert.deepEqual(notificationFeed({}), []);

  assert.equal(unreadCount(feed, 0), feed.length);
  assert.equal(unreadCount(feed, new Date('2026-11-16T10:00:00').getTime()), 1); // only the reply at 11:50
  assert.equal(unreadCount(feed, NOW), 0);
});
