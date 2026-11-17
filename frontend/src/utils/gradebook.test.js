import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGradebook, cellState, classRates, confusionPairs, filterCounts, filterRows, gradebookCsv, sortRows, visibleItems,
} from './gradebook.js';

const NOW = new Date('2026-11-17T12:00:00').getTime();
const data = {
  students: [
    { studentId: '2023003', name: '다학생', section: '2분반', registered: true },
    { studentId: '2023001', name: '가학생', section: '1분반', registered: true },
    { studentId: '2023009', name: '미가입', section: '1분반', registered: false },
  ],
  items: [
    { id: 10, title: '지난 실습', kind: 'PRACTICE', deadlineAt: '2026-11-10T18:00:00', questions: 20 },
    { id: 20, title: '진행 중, 실습', kind: 'PRACTICE', deadlineAt: '2026-11-20T18:00:00', questions: 40 },
    { id: 15, title: '진단평가', kind: 'DIAGNOSTIC', deadlineAt: null, questions: 10 },
  ],
  results: [
    { studentId: '2023001', itemId: 10, answered: 20, graded: 20, correct: 17, finalizedAt: '2026-11-09T10:00:00' },
    { studentId: '2023001', itemId: 20, answered: 40, graded: 32, correct: 30, finalizedAt: '2026-11-16T10:00:00' },
    { studentId: '2023001', itemId: 15, answered: 4, graded: 4, correct: 4, finalizedAt: null },
    { studentId: '2023003', itemId: 20, answered: 12, graded: 12, correct: 6, finalizedAt: null },
  ],
};

test('cell states follow final submission, confirmed answers and the deadline', () => {
  const [closed, open, noDeadline] = data.items;
  assert.deepEqual(cellState(data.results[0], closed, NOW), { kind: 'SCORED', answered: 20, pending: 0, graded: 20, correct: 17, rate: 85, submittedAt: '2026-11-09T10:00:00' });
  assert.equal(cellState(data.results[1], open, NOW).kind, 'WAITING');
  assert.equal(cellState(data.results[1], open, NOW).pending, 8);
  assert.equal(cellState(data.results[2], noDeadline, NOW).kind, 'ANSWERING');
  assert.equal(cellState(undefined, open, NOW).kind, 'NOT_STARTED');
  assert.equal(cellState(undefined, closed, NOW).kind, 'MISSED');
  assert.equal(cellState({ answered: 5, graded: 0, correct: 0 }, closed, NOW).kind, 'MISSED'); // answered but never submitted
  assert.equal(cellState({ answered: 3, graded: 0, correct: 0, finalizedAt: '2026-11-09T10:00:00' }, closed, NOW).kind, 'WAITING');
});

test('rows summarise every published coursework', () => {
  const { items, rows } = buildGradebook(data, NOW);
  assert.deepEqual(items.map(item => item.id), [20, 15, 10]);
  const ga = rows.find(row => row.studentId === '2023001').summary;
  assert.deepEqual([ga.submitted, ga.total, ga.correct, ga.graded, ga.pending, ga.rate, ga.missed, ga.openMissing], [2, 3, 47, 52, 8, 90, 0, 1]);
  assert.equal(ga.lastSubmittedAt, '2026-11-16T10:00:00');
  const da = rows.find(row => row.studentId === '2023003').summary;
  assert.deepEqual([da.submitted, da.rate, da.missed, da.openMissing], [0, null, 1, 2]);
});

test('filters, counts, sorting and visible coursework', () => {
  const { items, rows } = buildGradebook(data, NOW);
  assert.deepEqual(filterCounts(rows), { ALL: 3, OPEN_MISSING: 3, MISSED: 2, UNREGISTERED: 1 });
  assert.deepEqual(filterRows(rows, { filter: 'MISSED' }).map(row => row.studentId), ['2023003', '2023009']);
  assert.deepEqual(filterRows(rows, { section: '1분반', query: '가학' }).map(row => row.studentId), ['2023001']);
  assert.deepEqual(filterRows(rows, { query: '2023009' }).map(row => row.name), ['미가입']);
  assert.deepEqual(sortRows(rows, 'ID').map(row => row.studentId), ['2023001', '2023003', '2023009']);
  assert.deepEqual(sortRows(rows, 'NAME').map(row => row.name), ['가학생', '다학생', '미가입']);
  assert.deepEqual(sortRows(rows, 'RATE').map(row => row.studentId), ['2023001', '2023003', '2023009']);
  assert.deepEqual(sortRows(rows, 'MISSING').map(row => row.studentId), ['2023003', '2023009', '2023001']);
  assert.deepEqual(visibleItems(items, 'OPEN', NOW).map(item => item.id), [20, 15]);
  assert.equal(visibleItems([...Array(9)].map((_, id) => ({ id })), 'RECENT').length, 6);
});

test('CSV export has one column per coursework and quotes commas', () => {
  const { items, rows, byKey } = buildGradebook(data, NOW);
  const csv = gradebookCsv(sortRows(rows, 'ID'), items, byKey, NOW);
  const lines = csv.replace('﻿', '').split('\r\n');
  assert.equal(lines[0], '학번,이름,분반,가입,"진행 중, 실습",진단평가,지난 실습,제출,정답률');
  assert.equal(lines[1], '2023001,가학생,1분반,,제출(채점 대기),응답 4,85%,2/3,90%');
  assert.equal(lines[3], '2023009,미가입,1분반,미가입,,,미제출,0/3,');
});

test('class rates and the most frequent wrong answers', () => {
  const matrix = { Band: { Band: 14, Segment: 7, Lymphocyte: 3 }, Segment: { Segment: 50 }, Monocyte: { Lymphocyte: 4, Monocyte: 6 } };
  assert.deepEqual(classRates(matrix, ['Band', 'Segment', 'Eosinophil']), [
    { label: 'Band', total: 24, correct: 14, rate: 58 },
    { label: 'Segment', total: 50, correct: 50, rate: 100 },
    { label: 'Eosinophil', total: 0, correct: 0, rate: null },
  ]);
  assert.deepEqual(confusionPairs(matrix), [
    { from: 'Band', to: 'Segment', count: 7 }, { from: 'Monocyte', to: 'Lymphocyte', count: 4 }, { from: 'Band', to: 'Lymphocyte', count: 3 },
  ]);
});
