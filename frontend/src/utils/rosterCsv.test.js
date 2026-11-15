import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeCsvBytes, parseCsv, parseRosterCsv, ROSTER_CSV_TEMPLATE } from './rosterCsv.js';

test('parses quoted fields, escaped quotes, CRLF and blank lines', () => {
  assert.deepEqual(parseCsv('a,"b, c","d ""e"""\r\n\r\n1,2,3\n'), [['a', 'b, c', 'd "e"'], ['1', '2', '3']]);
  assert.deepEqual(parseCsv('학번;성명\n1;가'), [['학번', '성명'], ['1', '가']]);
  assert.deepEqual(parseCsv(''), []);
});

test('header columns may be in any order', () => {
  const { rows, problems, hasHeader } = parseRosterCsv('﻿분반,성명,학번\n1분반,홍길동,2026001\n,김철수,2026002\n');
  assert.equal(hasHeader, true);
  assert.deepEqual(problems, []);
  assert.deepEqual(rows, [
    { studentId: '2026001', name: '홍길동', section: '1분반' },
    { studentId: '2026002', name: '김철수', section: null },
  ]);
});

test('without a header the order is 학번, 성명, 분반; bad lines are reported with their line number', () => {
  const { rows, problems, hasHeader } = parseRosterCsv('2026001,홍길동,A\n,이름만\n2026001,중복\n2026003\n');
  assert.equal(hasHeader, false);
  assert.deepEqual(rows, [
    { studentId: '2026001', name: '홍길동', section: 'A' },
    { studentId: '2026003', name: null, section: null },
  ]);
  assert.deepEqual(problems.map(p => p.line), [2, 3]);
});

test('the downloadable template parses to one example row', () => {
  assert.deepEqual(parseRosterCsv(ROSTER_CSV_TEMPLATE).rows, [{ studentId: '2026001', name: '홍길동', section: '1분반' }]);
});

test('decodes UTF-8 and falls back to EUC-KR (Excel on Korean Windows)', () => {
  assert.equal(decodeCsvBytes(new TextEncoder().encode('학번,성명')), '학번,성명');
  // "학번" in EUC-KR
  assert.equal(decodeCsvBytes(new Uint8Array([0xc7, 0xd0, 0xb9, 0xf8])), '학번');
});
