import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeReviewCells, classKey, confusionKey, matchesAnalysisFocus, matchesCellFilter,
  resolveReviewLink, reviewEntries, reviewKey, reviewSpecies, summarizeReviewCells,
} from './studentReview.js';

const cell = (cropId, correctLabel, studentLabel, isCorrect, speciesCode = 'DOG') => ({
  cropId, correctLabel, studentLabel, isCorrect, speciesCode,
  speciesName: speciesCode === 'DOG' ? '개' : '고양이',
});
const dog = [
  cell(1, 'Band', 'Segment', false), cell(2, 'Band', 'Band', true),
  cell(3, 'Band', 'UNKNOWN', false), cell(4, 'Segment', 'Band', false),
  cell(5, 'Segment', 'Segment', true), cell(6, null, 'UNKNOWN', null),
  { ...cell(7, null, 'Segment', null), gtLabel: 'Band', pseudoLabel: 'Band' },
  cell(10, 'Band', 'Segment', false),
];
const cat = [cell(8, 'Band', 'Segment', false, 'CAT'), cell(9, 'Band', 'Band', true, 'CAT')];
const reviews = [
  { scopeType: 'ASSIGNMENT', scopeId: 1, title: '과제', cells: dog },
  { scopeType: 'DIAGNOSTIC', scopeId: 2, title: '진단평가', cells: cat },
];
const entries = reviewEntries(reviews);

test('review entries preserve original cell indices and coursework identity when filtering errors', () => {
  const wrong = entries.filter(({ cell }) => matchesCellFilter(cell, 'wrong'));
  assert.deepEqual(wrong.map(entry => entry.cell.cropId), [1, 3, 4, 10, 8]);
  assert.deepEqual(wrong.map(entry => entry.index), [0, 2, 3, 7, 0]);
  assert.equal(wrong[4].key, 'DIAGNOSTIC-2-8');
  const taskOnly = wrong.filter(entry => reviewKey(entry.review) === 'ASSIGNMENT-1');
  assert.deepEqual(taskOnly.map(entry => entry.cell.cropId), [1, 3, 4, 10]);
});

test('summary excludes pending answers from accuracy and counts unknown as a subset, not an additional wrong answer', () => {
  assert.deepEqual(summarizeReviewCells(entries), {
    total: 10, graded: 8, correct: 3, wrong: 5, pending: 2, unknown: 2, gradedUnknown: 1, accuracy: 38,
  });
  assert.equal(entries.filter(({ cell }) => matchesCellFilter(cell, 'unknown')).length, 2);
  assert.equal(entries.filter(({ cell }) => matchesCellFilter(cell, 'pending')).length, 2);
});

test('class rates use the true-class denominator, keep species separate and ignore unpublished labels', () => {
  const analysis = analyzeReviewCells(entries);
  const dogBand = analysis.classes.find(row => row.key === classKey(dog[0]));
  assert.deepEqual({ total: dogBand.total, correct: dogBand.correct, wrong: dogBand.wrong, unknown: dogBand.unknown, accuracy: dogBand.accuracy },
    { total: 4, correct: 1, wrong: 3, unknown: 1, accuracy: 25 });
  const dogSegment = analysis.classes.find(row => row.key === classKey(dog[3]));
  assert.equal(dogSegment.total, 2);
  assert.equal(dogSegment.accuracy, 50);
  const catBand = analysis.classes.find(row => row.key === classKey(cat[0]));
  assert.equal(catBand.total, 2);
  assert.equal(catBand.accuracy, 50);
  assert.equal(analysis.classes.length, 3);
  assert.equal(analysis.classes[0].key, dogBand.key);
});

test('confusions show my answer to correct answer and never merge unknown responses or species', () => {
  const { pairs } = analyzeReviewCells(entries);
  assert.equal(pairs.length, 3);
  assert.deepEqual(pairs[0], { key: confusionKey(dog[0]), answer: 'Segment', correct: 'Band', count: 2 });
  assert.equal(pairs.some(pair => pair.answer === 'UNKNOWN'), false);
  assert.equal(pairs.find(pair => pair.key === confusionKey(cat[0])).count, 1);
});

test('analysis selections open exactly the matching graded errors, preserving source entries', () => {
  const selected = focus => entries.filter(entry => matchesAnalysisFocus(entry, focus)).map(entry => entry.cell.cropId);
  assert.deepEqual(selected({ kind: 'class', key: classKey(dog[0]) }), [1, 3, 10]);
  assert.deepEqual(selected({ kind: 'pair', key: confusionKey(dog[0]) }), [1, 10]);
  assert.deepEqual(selected({ kind: 'unknown' }), [3]);
  assert.deepEqual(selected(null), [1, 3, 4, 10, 8]);
});

test('empty and pending-only scopes have no fabricated accuracy or weak classes', () => {
  const empty = analyzeReviewCells([]);
  assert.equal(empty.summary.accuracy, null);
  assert.deepEqual(empty.classes, []);
  assert.deepEqual(empty.pairs, []);
  const pending = analyzeReviewCells(reviewEntries([{ ...reviews[0], cells: dog.filter(item => item.isCorrect == null) }]));
  assert.equal(pending.summary.pending, 2);
  assert.equal(pending.summary.accuracy, null);
  assert.deepEqual(pending.classes, []);
  assert.deepEqual(pending.pairs, []);
});

test('species choices follow published species data and missing metadata is never presented as dog', () => {
  assert.equal(reviewSpecies(entries).length, 2);
  assert.deepEqual(reviewSpecies([{ cell: {} }]), [{ code: 'UNSPECIFIED', name: '동물 종 미확인' }]);
});

test('dashboard deep links select the requested coursework, original cell and first wrong answer', () => {
  assert.deepEqual(resolveReviewLink(reviews, { review: 'ASSIGNMENT-1', cell: '5' }), { key: 'ASSIGNMENT-1', index: 4, filter: 'correct' });
  const reordered = [{ ...reviews[0], cells: [dog[1], dog[0], dog[2]] }];
  assert.deepEqual(resolveReviewLink(reordered, { review: 'ASSIGNMENT-1', focus: 'wrong' }), { key: 'ASSIGNMENT-1', index: 1, filter: 'wrong' });
  assert.deepEqual(resolveReviewLink(reviews, { review: 'DIAGNOSTIC-2', cell: '8' }), { key: 'DIAGNOSTIC-2', index: 0, filter: 'wrong' });
  assert.deepEqual(resolveReviewLink(reviews, { review: 'ASSIGNMENT-1', cell: '3' }), { key: 'ASSIGNMENT-1', index: 2, filter: 'unknown' });
  assert.deepEqual(resolveReviewLink(reviews, { review: 'ASSIGNMENT-1' }), { key: 'ASSIGNMENT-1', index: 1, filter: 'correct' });
  const wrongOnly = [{ ...reviews[0], cells: [dog[0], dog[2]] }];
  assert.deepEqual(resolveReviewLink(wrongOnly, { review: 'ASSIGNMENT-1' }), { key: 'ASSIGNMENT-1', index: 0, filter: 'wrong' });
  assert.equal(resolveReviewLink(reviews, { review: 'TASK-999' }), null);
});
