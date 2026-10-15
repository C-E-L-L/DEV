import test from 'node:test';
import assert from 'node:assert/strict';
import { learningStatus, learningScore, summarizeLearningHistory } from './studentLearning.js';
import { mockLearningHistory, mockTaskDetail } from '../../mock/studentAnalytics.js';

test('completion is based on answers, independently of grading and deadline', () => {
  assert.equal(learningStatus({ totalCells: 2, answeredCells: 2, labelingComplete: false }, '2000-01-01'), 'COMPLETED');
  assert.equal(learningStatus({ totalCells: 2, answeredCells: 1 }, '2000-01-01'), 'CLOSED');
  assert.equal(learningStatus({ totalCells: 2, answeredCells: 1 }), 'IN_PROGRESS');
  assert.equal(learningStatus({ totalCells: 2, answeredCells: 0 }), 'NOT_STARTED');
  assert.equal(learningStatus({ totalCells: 0, answeredCells: 0 }), 'EMPTY');
});

test('score distinguishes no response, pending grading and a real zero', () => {
  assert.equal(learningScore({ totalCells: 2, answeredCells: 0 }), '응답 없음');
  assert.equal(learningScore({ totalCells: 2, answeredCells: 2, labelingComplete: false }), '채점 대기');
  assert.equal(learningScore({ totalCells: 2, answeredCells: 2, labelingComplete: true, correct: 0, accuracy: 0 }), '0 / 2 (0.0%)');
});

test('activity totals avoid counting assignment cells twice and show child task completion', () => {
  const summary = { totalCells: 2, answeredCells: 2 };
  const activities = [
    { scopeType: 'ASSIGNMENT', summary: { totalCells: 4, answeredCells: 3 }, tasks: [{ summary }, { summary: { totalCells: 2, answeredCells: 1 } }] },
    { scopeType: 'TASK', summary, tasks: [{ summary }] },
    { scopeType: 'DIAGNOSTIC', summary, tasks: [{ summary }] },
  ];
  assert.deepEqual(summarizeLearningHistory(activities), { answered: 7, assignments: 0, tasks: 2, diagnostics: 1 });
});

test('mock matches grouped grading contract and includes unanswered cells in task details', () => {
  const tasks = [{ id: 1, assignmentId: 10 }, { id: 2, assignmentId: 10 }, { id: 3, uploadedFilename: 'diagnostic-test' }];
  const crops = new Map([[1, [{ cropId: 1, finalLabel: 'Band' }]], [2, [{ cropId: 2 }]], [3, [{ cropId: 3, gtLabel: 'Band' }]]]);
  const answers = { 1: 'Band', 3: 'Segment' };
  const history = mockLearningHistory(tasks, crops, answers, 'student');
  assert.equal(history.activities.length, 2);
  const group = history.activities.find(activity => activity.scopeType === 'ASSIGNMENT');
  assert.equal(group.summary.totalCells, 2);
  assert.equal(group.summary.answeredCells, 1);
  assert.equal(group.summary.accuracy, null);
  const detail = mockTaskDetail(tasks[1], crops.get(2), answers, 'student');
  assert.equal(detail.cells[0].studentLabel, null);
  assert.equal(detail.cells[0].isCorrect, null);
  assert.equal(history.activities[0].summary.wrong, 1);
});
