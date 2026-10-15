import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { AUTH_SESSION_KEY, createAuthSession, getSessionHomePath, watchAuthSession } from './authSession.js';
import { createApiClient } from '../api/createApiClient.js';

const professor = { username: 'professor', name: '교수', role: 'EXPERT', token: 'expert-token', sessionId: 'initial' };
const student = { username: 'student', name: '학생', role: 'STUDENT', token: 'student-token', sessionId: 'next' };
function setup(initial = professor) {
  const values = new Map(initial ? [[AUTH_SESSION_KEY, JSON.stringify(initial)]] : []);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
  const redirects = [];
  let counter = 0;
  const tab = () => createAuthSession({ storage, onChange: session => redirects.push(getSessionHomePath(session)), createId: () => `new-${++counter}` });
  return { storage, redirects, tab };
}

test('another tab logout redirects to login without a refresh and preserves preferences', () => {
  const { storage, redirects, tab } = setup();
  storage.setItem('cell-image-display-settings-v1', 'preferences');
  const first = tab();
  const second = tab();
  second.clear();
  assert.equal(first.sync(), true);
  assert.deepEqual(redirects, ['/', '/']);
  assert.throws(() => first.getRequestSession(), { name: 'AbortError' });
  assert.equal(storage.getItem('cell-image-display-settings-v1'), 'preferences');
});

test('switching accounts blocks the old screen before a storage event arrives', () => {
  const { storage, redirects, tab } = setup();
  const first = tab();
  assert.equal(first.getRequestSession().token, 'expert-token');
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
  assert.throws(() => first.getRequestSession(), { name: 'AbortError' });
  first.sync();
  assert.deepEqual(redirects, ['/student']);
  assert.equal(tab().getRequestSession().token, 'student-token');
});

test('a different account with the same role and token still resets the page', () => {
  const { storage, redirects, tab } = setup();
  const first = tab();
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...professor, username: 'another-professor', sessionId: 'another' }));
  first.sync();
  assert.deepEqual(redirects, ['/expert']);
});

test('a late logout cannot erase the newer account', () => {
  const { storage, redirects, tab } = setup();
  const old = tab();
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
  old.clear();
  assert.equal(JSON.parse(storage.getItem(AUTH_SESSION_KEY)).username, 'student');
  assert.deepEqual(redirects, ['/student']);
});

test('login writes one complete session and redirects to its role home', () => {
  const { storage, redirects, tab } = setup(null);
  tab().save(student);
  const stored = JSON.parse(storage.getItem(AUTH_SESSION_KEY));
  assert.equal(stored.username, 'student');
  assert.equal(stored.role, 'STUDENT');
  assert.equal(stored.token, 'student-token');
  assert.equal(stored.sessionId, 'new-1');
  assert.deepEqual(redirects, ['/student']);
});

test('existing login keys migrate and malformed sessions fail closed', () => {
  const { storage, tab } = setup(null);
  for (const key of ['token', 'username', 'name', 'role']) storage.setItem(key, professor[key]);
  assert.equal(tab().getRequestSession().username, 'professor');
  assert.equal(storage.getItem('token'), null);
  storage.setItem(AUTH_SESSION_KEY, '{broken');
  assert.equal(tab().getSession(), null);
});

test('storage events synchronize tabs; focus and visibility handle suspended tabs', () => {
  for (const eventType of ['storage', 'focus', 'visibilitychange']) {
    const { storage, redirects, tab } = setup();
    const targetWindow = Object.assign(new EventTarget(), { localStorage: storage });
    const targetDocument = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const stop = watchAuthSession(tab(), targetWindow, targetDocument);
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
    const unrelated = Object.assign(new Event('storage'), { key: 'preferences', storageArea: storage });
    targetWindow.dispatchEvent(unrelated);
    assert.deepEqual(redirects, []);
    const event = Object.assign(new Event(eventType), { key: AUTH_SESSION_KEY, storageArea: storage });
    (eventType === 'visibilitychange' ? targetDocument : targetWindow).dispatchEvent(event);
    assert.deepEqual(redirects, ['/student']);
    stop();
  }
});

test('Axios never sends a request using the new account from an old page', async () => {
  const { storage, tab } = setup();
  const api = createApiClient(tab());
  let sent = 0;
  api.defaults.adapter = async config => {
    sent++;
    assert.equal(config.headers.Authorization, 'Bearer expert-token');
    return { status: 200, data: {}, config };
  };
  await api.get('/tasks');
  storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
  await assert.rejects(api.get('/tasks'), axios.isCancel);
  assert.equal(sent, 1);
});

for (const status of [200, 401]) {
  test(`a delayed ${status} response from the old account is discarded without logging out the new account`, async () => {
    const { storage, tab } = setup();
    const api = createApiClient(tab());
    let finish;
    let started;
    const ready = new Promise(resolve => { started = resolve; });
    api.defaults.adapter = config => new Promise((resolve, reject) => {
      finish = () => status === 200 ? resolve({ status, data: {}, config })
        : reject(new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status, config }));
      started();
    });
    const request = api.get('/tasks');
    await ready;
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
    const rejection = assert.rejects(request, axios.isCancel);
    finish();
    await rejection;
    assert.equal(JSON.parse(storage.getItem(AUTH_SESSION_KEY)).username, 'student');
  });
}

test('current-session 401 logs out, but a failed public login does not clear sessions', async () => {
  const { storage, redirects, tab } = setup();
  const api = createApiClient(tab());
  api.defaults.adapter = async config => {
    throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, config });
  };
  await assert.rejects(api.post('/auth/login'), { message: 'Unauthorized' });
  assert.notEqual(storage.getItem(AUTH_SESSION_KEY), null);
  assert.deepEqual(redirects, []);
  await assert.rejects(api.get('/tasks'), { message: 'Unauthorized' });
  assert.equal(storage.getItem(AUTH_SESSION_KEY), null);
  assert.deepEqual(redirects, ['/']);
});
