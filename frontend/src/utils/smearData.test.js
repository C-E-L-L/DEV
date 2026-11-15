import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deletionPlan, filterLibrary, filterSmears, labelState, labelStateCounts, pageNumbers, paginate, smearLibrary, sortSmears, speciesOptions,
} from './smearData.js';

const tasks = [
  { id: 1, uploadedFilename: 'dog-a.jpg', title: '1주차 실습', speciesId: 1, speciesName: '개', cropCount: 10, labeledCount: 10, assignmentId: 7 },
  { id: 2, uploadedFilename: 'dog-b.jpg', title: '1주차 실습', speciesId: 1, speciesName: '개', cropCount: 20, labeledCount: 5, assignmentId: 7 },
  { id: 3, uploadedFilename: 'cat-a.png', title: null, speciesId: 2, speciesName: '고양이', cropCount: 8, labeledCount: 0, assignmentId: null },
  { id: 4, uploadedFilename: 'empty.png', title: null, speciesId: 1, speciesName: '개', cropCount: 0, labeledCount: 0, assignmentId: null },
];

test('label state counts only answers confirmed by the professor', () => {
  assert.deepEqual(tasks.map(labelState), ['COMPLETE', 'PARTIAL', 'NONE', 'NONE']);
  assert.deepEqual(labelStateCounts(tasks), { ALL: 4, COMPLETE: 1, PARTIAL: 1, NONE: 2 });
});

test('filters by tab, species and text (file name, title, #id)', () => {
  assert.deepEqual(filterSmears(tasks, { tab: 'PARTIAL' }).map(t => t.id), [2]);
  assert.deepEqual(filterSmears(tasks, { speciesId: '2' }).map(t => t.id), [3]);
  assert.deepEqual(filterSmears(tasks, { query: ' DOG-' }).map(t => t.id), [1, 2]);
  assert.deepEqual(filterSmears(tasks, { query: '1주차', tab: 'COMPLETE' }).map(t => t.id), [1]);
  assert.deepEqual(filterSmears(tasks, { query: '#3' }).map(t => t.id), [3]);
});

test('sorts by newest, most cells, most unconfirmed cells', () => {
  assert.deepEqual(sortSmears(tasks, 'NEWEST').map(t => t.id), [4, 3, 2, 1]);
  assert.deepEqual(sortSmears(tasks, 'CELLS').map(t => t.id), [2, 1, 3, 4]);
  assert.deepEqual(sortSmears(tasks, 'PENDING').map(t => t.id), [2, 3, 4, 1]);
});

test('paging clamps the page and reports the visible range', () => {
  const items = Array.from({ length: 50 }, (_, i) => i + 1);
  assert.deepEqual(paginate(items, 3, 24), { items: [49, 50], page: 3, pages: 3, total: 50, from: 49, to: 50 });
  assert.equal(paginate(items, 99, 24).page, 3);
  assert.deepEqual(paginate([], 1, 24), { items: [], page: 1, pages: 1, total: 0, from: 0, to: 0 });
  assert.deepEqual(pageNumbers(1, 16), [1, 2, 3, 4, 5, '…', 16]);
  assert.deepEqual(pageNumbers(8, 16), [1, '…', 7, 8, 9, '…', 16]);
  assert.deepEqual(pageNumbers(16, 16), [1, '…', 12, 13, 14, 15, 16]);
  assert.deepEqual(pageNumbers(2, 3), [1, 2, 3]);
});

test('species options list what is in the data', () => {
  assert.deepEqual(speciesOptions(tasks), [{ id: 1, name: '개', count: 3 }, { id: 2, name: '고양이', count: 1 }]);
});

test('deleting every smear of an assignment deletes the assignment', () => {
  assert.deepEqual(deletionPlan([tasks[0], tasks[2]], tasks), [{ type: 'task', id: 3 }, { type: 'task', id: 1 }]);
  assert.deepEqual(deletionPlan([tasks[0], tasks[1]], tasks), [{ type: 'assignment', id: 7 }]);
});

test('the smear library has one entry per image, with how often a published practice used it', () => {
  const smears = [
    { id: 1, originalFilename: 'a.png', uploadedFilename: 'dog-a.jpg', title: '1주차 실습', status: 'IN_PROGRESS', speciesId: 1, speciesName: '개', cropCount: 10, labeledCount: 10 },
    { id: 2, originalFilename: 'a.png', uploadedFilename: 'dog-a.jpg', title: '1주차 실습 (복사)', status: 'DRAFT', speciesId: 1, speciesName: '개', cropCount: 10, labeledCount: 4 },
    { id: 3, originalFilename: 'a.png', uploadedFilename: 'dog-a.jpg', title: '2주차 실습', status: 'ARCHIVED', speciesId: 1, speciesName: '개', cropCount: 10, labeledCount: 10 },
    { id: 4, originalFilename: 'b.png', uploadedFilename: 'cat-b.jpg', title: '준비 중', status: 'DRAFT', speciesId: 2, speciesName: '고양이', cropCount: 6, labeledCount: 0 },
    { id: 5, originalFilename: '', title: '진단평가', status: 'IN_PROGRESS' },
  ];
  const library = smearLibrary(smears);
  assert.deepEqual(library.map(item => item.key), ['b.png', 'a.png']); // newest image first
  const used = library[1];
  assert.equal(used.task.id, 3); // most confirmed answers, then the newest
  assert.deepEqual([used.usedCount, used.usedTitles, used.labeledCount, used.name], [2, ['2주차 실습', '1주차 실습'], 10, 'dog-a.jpg']);
  assert.deepEqual([library[0].usedCount, library[0].usedTitles], [0, []]);

  assert.deepEqual(filterLibrary(library, { usage: 'USED' }).map(item => item.key), ['a.png']);
  assert.deepEqual(filterLibrary(library, { usage: 'UNUSED' }).map(item => item.key), ['b.png']);
  assert.deepEqual(filterLibrary(library, { speciesId: '2' }).map(item => item.key), ['b.png']);
  assert.deepEqual(filterLibrary(library, { query: '2주차' }).map(item => item.key), ['a.png']);
  assert.deepEqual(filterLibrary(library, { query: 'cat', usage: 'USED' }), []);
});
