import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesQuestion, parseQuestion, questionCoursework } from './studentQuestions.js';

test('question categories strip only a known prefix and preserve the full question body', () => {
  assert.deepEqual(parseQuestion('헷갈림: Band인지 궁금해요.\n사진: 오른쪽 세포'), { category: '헷갈림', body: 'Band인지 궁금해요.\n사진: 오른쪽 세포' });
  assert.deepEqual(parseQuestion('화질 문제'), { category: '화질 문제', body: '화질 문제' });
  assert.deepEqual(parseQuestion('세포: 경계가 흐려요'), { category: '기타', body: '세포: 경계가 흐려요' });
  assert.deepEqual(parseQuestion(null), { category: '기타', body: '질문 내용이 없습니다.' });
});

test('every smear in a grouped assignment links to the student coursework', () => {
  const context = questionCoursework([{ title: '혈액 세포 과제', path: '/student/work/assignment/3', tasks: [{ id: 8 }, { id: 9 }] }]);
  assert.deepEqual(context.get('8'), context.get('9'));
  assert.equal(context.get('9').title, '혈액 세포 과제');
  assert.equal(context.get('9').path, '/student/work/assignment/3');
  assert.equal(context.get('10'), undefined);
});

test('question filters combine reply status, category and course or reply search', () => {
  const pending = { reason: '헷갈림: 이 세포는 무엇인가요?' };
  const answered = { ...pending, replies: [{ message: 'Band가 맞습니다.' }] };
  assert.equal(matchesQuestion(pending, { status: 'pending', category: '헷갈림', search: '혈액' }, '혈액 과제'), true);
  assert.equal(matchesQuestion(answered, { status: 'pending' }), false);
  assert.equal(matchesQuestion(answered, { status: 'answered', search: ' BAND ' }), true);
  assert.equal(matchesQuestion(answered, { category: '화질 문제' }), false);
  assert.equal(matchesQuestion(pending, { search: 'Band' }), false);
});
