import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accuracyTone, answerState, cellAccuracy, editStatus, fillFromAi, labelingCounts, nextIndex, publishBlocker, studentAnswers, voteRows,
} from './review.js';

const CHOICES = [{ key: 'Band', label: 'Band' }, { key: 'Segment', label: 'Segment' }];

test('accuracy tones follow the 80 / 50 boundaries', () => {
  assert.equal(accuracyTone(null), 'none');
  assert.equal(accuracyTone(80), 'good');
  assert.equal(accuracyTone(79), 'mid');
  assert.equal(accuracyTone(50), 'mid');
  assert.equal(accuracyTone(49), 'low');
  assert.equal(accuracyTone(0), 'low');
});

test('nextIndex searches after the current item and wraps, skipping the current one', () => {
  const items = ['a', 'b', 'c', 'd'];
  const open = new Set(['a', 'c']);
  assert.equal(nextIndex(items, 0, item => open.has(item)), 2);
  assert.equal(nextIndex(items, 2, item => open.has(item)), 0);
  assert.equal(nextIndex(['a'], 0, () => true), -1);
  assert.equal(nextIndex(items, 1, () => false), -1);
});

test('labeling counts, publish blockers and the AI fill', () => {
  const cells = [
    { id: 1, pseudoLabel: 'Band' },
    { id: 2, pseudoLabel: 'Segment' },
    { id: 3, pseudoLabel: 'Eosinophil' }, // not one of this coursework's classes
    { id: 4, pseudoLabel: 'Band' },
  ];
  const edits = { 1: { label: 'Segment' }, 2: { label: '' }, 3: {}, 4: { excluded: true, exclusionReason: '중복 탐지' } };
  assert.equal(editStatus(edits[1]), 'labeled');
  assert.equal(editStatus(edits[4]), 'excluded');
  const counts = labelingCounts(cells, edits);
  assert.deepEqual(counts, { total: 4, active: 3, labeled: 1, excluded: 1, open: 2 });
  assert.equal(publishBlocker({ title: ' ', counts, mustLabel: false }), '과제 제목을 입력해주세요');
  assert.equal(publishBlocker({ title: '실습', counts, mustLabel: true }), '정답 미확정 2문항');
  assert.equal(publishBlocker({ title: '실습', counts, mustLabel: false }), null);
  assert.equal(publishBlocker({ title: '실습', counts: { ...counts, active: 0 }, mustLabel: false }), '출제할 세포가 없습니다');

  const { edits: filled, filled: count } = fillFromAi(cells, edits, () => CHOICES);
  assert.equal(count, 1); // only cell 2: 1 is labeled, 3 has no matching class, 4 is excluded
  assert.equal(filled[2].label, 'Segment');
  assert.equal(filled[1].label, 'Segment');
  assert.equal(filled[3].label, undefined);
  assert.equal(filled[4].label, undefined);
});

test('vote rows and cell accuracy', () => {
  const stats = { totalAnswers: 4, finalLabel: 'Band', accuracyRate: 66.6, voteDistribution: { Band: 2, Segment: 1, UNKNOWN: 1 } };
  const { total, unknown, rows } = voteRows(CHOICES, stats);
  assert.equal(total, 4);
  assert.equal(unknown, 1);
  assert.deepEqual(rows.map(row => [row.key, row.count, row.share]), [['Band', 2, 50], ['Segment', 1, 25]]);
  assert.equal(cellAccuracy(stats), 67);
  assert.equal(cellAccuracy({ ...stats, finalLabel: null }), null);
  assert.equal(cellAccuracy({ ...stats, totalAnswers: 0 }), null);
});

test('student answers are scored over answered cells with a confirmed answer', () => {
  const cells = [
    { id: 1, finalLabel: 'Band', stats: { votersByLabel: { Band: [{ studentId: '2023002', studentName: '나' }], Segment: [{ studentId: '2023001', studentName: '가' }] } } },
    { id: 2, finalLabel: 'Segment', stats: { votersByLabel: { Segment: [{ studentId: '2023001', studentName: '가' }] } } },
    { id: 3, finalLabel: null, stats: { votersByLabel: { UNKNOWN: [{ studentId: '2023001', studentName: '가' }] } } },
  ];
  const [first, second] = studentAnswers(cells);
  assert.equal(first.studentId, '2023001');
  assert.equal(first.name, '가');
  assert.deepEqual([first.answered, first.graded, first.correct, first.rate], [3, 2, 1, 50]);
  assert.deepEqual([second.answered, second.graded, second.correct, second.rate], [1, 1, 1, 100]);
  assert.equal(answerState(undefined, 'Band'), 'missing');
  assert.equal(answerState('Band', null), 'waiting');
  assert.equal(answerState('Band', 'Band'), 'correct');
  assert.equal(answerState('UNKNOWN', 'Band'), 'wrong');
});
