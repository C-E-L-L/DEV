import test from 'node:test';
import assert from 'node:assert/strict';
import { mockLogin } from './mockServer.js';

test('mock login signs in each account with its own role', () => {
  assert.equal(mockLogin('student').role, 'STUDENT');
  assert.equal(mockLogin('Student').role, 'STUDENT');
  assert.equal(mockLogin('professor').role, 'EXPERT');
  assert.equal(mockLogin('admin').role, 'ADMIN');
  // Sample students who answered coursework can sign in too.
  assert.equal(mockLogin('20260001').role, 'STUDENT');
  assert.equal(mockLogin('student').accessToken, 'local-mock-student-token');
});

test('mock login rejects IDs that are not accounts instead of signing in as a professor', () => {
  for (const id of ['professorstudent', 'student ', 'nobody', '', undefined, null]) {
    assert.equal(mockLogin(id), null, `"${id}" must not sign in`);
  }
});
