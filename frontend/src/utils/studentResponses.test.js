import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeStudentResponses } from './studentResponses.js';

const student = { studentId: '20260001', studentName: '김민지' };
const crops = [
  { cropId: 1, finalLabel: 'Band', totalAnswers: 2, votersByLabel: { Band: [student], Segment: ['20260002'] } },
  { cropId: 2, finalLabel: 'Segment', totalAnswers: 1, votersByLabel: { Band: [student] } },
  { cropId: 3, finalLabel: 'Segment', totalAnswers: 0, votersByLabel: {} },
];

test('scores each student against every cell, including unanswered cells', () => {
  const summary = summarizeStudentResponses(crops);
  assert.equal(summary.gradingComplete, true);
  assert.equal(summary.responsesAvailable, true);
  assert.equal(summary.students.length, 2);
  const [first, second] = summary.students;
  assert.equal(first.displayName, '20260001_김민지');
  assert.equal(first.answeredCount, 2);
  assert.equal(first.correctCount, 1);
  assert.equal(first.accuracy.toFixed(1), '33.3');
  assert.equal(first.answers.get(2), 'Band');
  assert.equal(first.answers.has(3), false);
  assert.equal(second.correctCount, 0);
});

test('withholds scores until every professor label is confirmed, ignoring AI and imported labels', () => {
  const pending = crops.map(crop => crop.cropId === 3 ? { ...crop, finalLabel: null, gtLabel: 'Segment', pseudoLabel: 'Segment' } : crop);
  const summary = summarizeStudentResponses(pending);
  assert.equal(summary.gradingComplete, false);
  assert.equal(summary.students[0].correctCount, null);
  assert.equal(summary.students[0].accuracy, null);
  assert.equal(summary.students[0].answers.get(1), 'Band');
});

test('recalculates after a professor changes a label', () => {
  const updated = crops.map(crop => crop.cropId === 2 ? { ...crop, finalLabel: 'Band' } : crop);
  assert.equal(summarizeStudentResponses(updated).students[0].accuracy.toFixed(1), '66.7');
});

test('distinguishes no submissions from missing response details', () => {
  assert.deepEqual(summarizeStudentResponses([]), { gradingComplete: false, responsesAvailable: true, students: [] });
  assert.equal(summarizeStudentResponses([{ cropId: 1, totalAnswers: 1 }]).responsesAvailable, false);
  assert.equal(summarizeStudentResponses([{ cropId: 1, totalAnswers: 0 }]).responsesAvailable, true);
});
