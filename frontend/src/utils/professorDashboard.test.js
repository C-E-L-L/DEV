import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classAccuracy, courseworkCounts, courseworkPhase, deadlineInfo, indexProgress,
  pendingLabelCount, relativeTime, submissionSummary,
} from './professorDashboard.js';

const now = new Date(2026, 10, 16, 12, 0);

test('phase follows publication and deadline; counts feed the sidebar badges', () => {
  const draft = { id: 1, status: 'DRAFT', tasks: [{ deadlineAt: null }] };
  const open = { id: 2, status: 'IN_PROGRESS', tasks: [{ deadlineAt: '2026-11-18T23:59:00' }] };
  const noDeadline = { id: 3, status: 'IN_PROGRESS', tasks: [{ deadlineAt: null }] };
  const closed = { id: 4, status: 'IN_PROGRESS', tasks: [{ deadlineAt: '2026-11-17T09:00:00' }, { deadlineAt: '2026-11-15T09:00:00' }] };
  assert.equal(courseworkPhase(draft, now), 'DRAFT');
  assert.equal(courseworkPhase(open, now), 'ACTIVE');
  assert.equal(courseworkPhase(noDeadline, now), 'ACTIVE');
  assert.equal(courseworkPhase(closed, now), 'CLOSED');
  assert.deepEqual(courseworkCounts([draft, open, noDeadline, closed], now), { drafts: 1, active: 2, completed: 1 });
});

test('grading is pending only for published coursework with unconfirmed answers', () => {
  assert.equal(pendingLabelCount({ status: 'DRAFT', cropCount: 5, labeledCount: 0 }), 0);
  assert.equal(pendingLabelCount({ status: 'IN_PROGRESS', cropCount: 5, labeledCount: 3 }), 2);
  assert.equal(pendingLabelCount({ status: 'IN_PROGRESS', cropCount: 5, labeledCount: 5 }), 0);
});

test('deadline label counts calendar days and flags urgency', () => {
  assert.deepEqual(deadlineInfo(null, now), { label: '마감 없음', dateText: '', tone: 'none' });
  assert.equal(deadlineInfo('2026-11-16T23:59:00', now).label, 'D-Day');
  assert.deepEqual(deadlineInfo('2026-11-18T09:00:00', now), { label: 'D-2', dateText: '11.18 09:00', tone: 'urgent' });
  assert.equal(deadlineInfo('2026-11-23T09:00:00', now).tone, 'normal');
  assert.equal(deadlineInfo('2026-11-16T11:59:00', now).label, '마감됨');
});

test('relative time', () => {
  assert.equal(relativeTime('2026-11-16T11:59:40', now), '방금 전');
  assert.equal(relativeTime('2026-11-16T11:52:00', now), '8분 전');
  assert.equal(relativeTime('2026-11-16T09:00:00', now), '3시간 전');
  assert.equal(relativeTime('2026-11-14T09:00:00', now), '2일 전');
  assert.equal(relativeTime('2026-10-01T09:00:00', now), '2026.10.01');
});

test('submission summary lists students who have not submitted, per section', () => {
  const students = [
    { studentId: 'a', name: '가', section: '1분반', registered: true },
    { studentId: 'b', name: '나', section: '2분반', registered: true },
    { studentId: 'c', name: null, section: '1분반', registered: false },
  ];
  const progress = { items: [{ id: 9, taskIds: [8, 9], submitted: [{ studentId: 'a', finalizedAt: '2026-11-15T10:00:00' }] }] };
  const item = indexProgress(progress).get(8);
  const all = submissionSummary(item, students);
  assert.equal(all.total, 3);
  assert.equal(all.submitted, 1);
  assert.deepEqual(all.missing.map(s => s.studentId), ['b', 'c']);
  assert.equal(all.done[0].finalizedAt, '2026-11-15T10:00:00');
  assert.deepEqual(submissionSummary(item, students, '1분반').missing.map(s => s.studentId), ['c']);
  assert.equal(submissionSummary(undefined, students).submitted, 0);
});

test('class accuracy sums student matrices by true class', () => {
  const calibration = {
    labels: ['Band', 'Segment'],
    studentMatrices: [
      { studentId: 's1', studentName: '가', totalSolved: 4, accuracy: 75, confusionMatrix: { Band: { Band: 1, Segment: 1 }, Segment: { Band: 0, Segment: 2 } } },
      { studentId: 's2', studentName: '나', totalSolved: 2, accuracy: 50, confusionMatrix: { Band: { Band: 0, Segment: 1 }, Segment: { Band: 0, Segment: 1 } } },
      { studentId: 's3', studentName: '다', totalSolved: 0, accuracy: 0, confusionMatrix: {} },
    ],
  };
  const result = classAccuracy(calibration);
  assert.equal(result.total, 6);
  assert.equal(result.accuracy, 66.7);
  assert.deepEqual(result.classes.map(c => [c.label, c.total, c.accuracy]), [['Band', 3, 33.3], ['Segment', 3, 100]]);
  assert.deepEqual(result.students.map(s => s.studentId), ['s2', 's1']);
  assert.equal(result.gradedStudents, 2);
  assert.equal(classAccuracy(null).accuracy, null);
});
