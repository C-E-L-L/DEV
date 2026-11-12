import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { AUTH_SESSION_KEY, SKIP_REMEMBERED_KEY, createAuthSession, getSessionHomePath, watchAuthSession } from './authSession.js';
import { createApiClient } from '../api/createApiClient.js';

const professor = { username: 'professor', name: '교수', role: 'EXPERT', token: 'expert-token', sessionId: 'initial' };
const student = { username: 'student', name: '학생', role: 'STUDENT', token: 'student-token', sessionId: 'next' };

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

// A browser: one shared persistent storage (localStorage) and one sessionStorage per tab.
function browser({ remembered = null } = {}) {
  const persistent = memoryStorage(remembered ? { [AUTH_SESSION_KEY]: JSON.stringify(remembered) } : {});
  const redirects = [];
  let counter = 0;
  const openTab = (tabStorage = memoryStorage()) => {
    const session = createAuthSession({
      storage: tabStorage,
      persistentStorage: persistent,
      onChange: next => redirects.push(getSessionHomePath(next)),
      createId: () => `new-${++counter}`,
    });
    // Reloading the page keeps the tab's sessionStorage but builds a new session object.
    return { session, storage: tabStorage, reload: () => openTab(tabStorage) };
  };
  return { persistent, redirects, openTab };
}

const loggedInTab = (b, user) => b.openTab(memoryStorage({ [AUTH_SESSION_KEY]: JSON.stringify(user) }));

test('each tab keeps its own account: logging in elsewhere never changes or redirects this tab', () => {
  const b = browser();
  const first = loggedInTab(b, professor);
  const second = b.openTab();
  second.session.save(student);
  assert.equal(first.session.sync(), false);
  assert.equal(first.session.getRequestSession().token, 'expert-token');
  assert.deepEqual(b.redirects, ['/student']);
  assert.equal(second.reload().session.getRequestSession().token, 'student-token');
});

test('logging out one tab leaves other tabs signed in', () => {
  const b = browser();
  const first = loggedInTab(b, professor);
  const second = loggedInTab(b, student);
  second.session.clear();
  assert.deepEqual(b.redirects, ['/login']);
  assert.equal(first.session.sync(), false);
  assert.equal(first.session.getRequestSession().username, 'professor');
});

test('without "로그인 상태 유지" a new tab starts logged out', () => {
  const b = browser();
  b.openTab().session.save(student);
  assert.equal(b.persistent.getItem(AUTH_SESSION_KEY), null);
  assert.equal(b.openTab().session.getSession(), null);
});

test('"로그인 상태 유지" signs new tabs (and restarts) in to the remembered account', () => {
  const b = browser();
  const tab = b.openTab();
  tab.session.save(student, { remember: true });
  const stored = JSON.parse(b.persistent.getItem(AUTH_SESSION_KEY));
  assert.equal(stored.username, 'student');
  assert.equal(stored.sessionId, 'new-1');
  assert.equal(tab.reload().session.getSession().username, 'student');
  assert.equal(b.openTab().session.getSession().username, 'student');
});

test('logging out the remembered account forgets it, and that tab does not silently sign back in', () => {
  const b = browser({ remembered: student });
  const adopted = b.openTab();
  assert.equal(adopted.session.getSession().username, 'student');
  adopted.session.clear();
  assert.equal(b.persistent.getItem(AUTH_SESSION_KEY), null);
  assert.equal(adopted.reload().session.getSession(), null);
});

test('logging out a different account keeps the remembered one, but the tab stays logged out', () => {
  const b = browser({ remembered: student });
  const other = b.openTab(memoryStorage({ [AUTH_SESSION_KEY]: JSON.stringify(professor) }));
  other.session.clear();
  assert.equal(JSON.parse(b.persistent.getItem(AUTH_SESSION_KEY)).username, 'student');
  const reloaded = other.reload();
  assert.equal(reloaded.session.getSession(), null);
  assert.equal(reloaded.storage.getItem(SKIP_REMEMBERED_KEY), '1');
  // Logging in again in that tab clears the opt-out marker.
  reloaded.session.save(professor);
  assert.equal(reloaded.storage.getItem(SKIP_REMEMBERED_KEY), null);
});

test('switching accounts in the same tab blocks the old screen and redirects to the new home', () => {
  const b = browser();
  const tab = loggedInTab(b, professor);
  assert.equal(tab.session.getRequestSession().token, 'expert-token');
  tab.storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
  assert.throws(() => tab.session.getRequestSession(), { name: 'AbortError' });
  assert.deepEqual(b.redirects, ['/student']);
});

test('a late logout cannot erase the newer account in the same tab', () => {
  const b = browser();
  const tab = loggedInTab(b, professor);
  tab.storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
  tab.session.clear();
  assert.equal(JSON.parse(tab.storage.getItem(AUTH_SESSION_KEY)).username, 'student');
  assert.deepEqual(b.redirects, ['/student']);
});

test('pre-v1 login keys and an existing shared login become the remembered account; malformed fails closed', () => {
  const legacy = browser();
  for (const key of ['token', 'username', 'name', 'role']) legacy.persistent.setItem(key, professor[key]);
  assert.equal(legacy.openTab().session.getRequestSession().username, 'professor');
  assert.equal(legacy.persistent.getItem('token'), null);

  const upgraded = browser({ remembered: professor });
  assert.equal(upgraded.openTab().session.getSession().username, 'professor');

  const broken = browser();
  broken.persistent.setItem(AUTH_SESSION_KEY, '{broken');
  assert.equal(broken.openTab().session.getSession(), null);
  assert.equal(broken.persistent.getItem(AUTH_SESSION_KEY), null);
});

test('focus and visibility re-check this tab', () => {
  for (const eventType of ['focus', 'visibilitychange']) {
    const b = browser();
    const tab = loggedInTab(b, professor);
    const targetWindow = new EventTarget();
    const targetDocument = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    const stop = watchAuthSession(tab.session, targetWindow, targetDocument);
    tab.storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
    (eventType === 'visibilitychange' ? targetDocument : targetWindow).dispatchEvent(new Event(eventType));
    assert.deepEqual(b.redirects, ['/student']);
    stop();
  }
});

test('Axios never sends a request using a newer account from an old page', async () => {
  const b = browser();
  const tab = loggedInTab(b, professor);
  const api = createApiClient(tab.session);
  let sent = 0;
  api.defaults.adapter = async config => {
    sent++;
    assert.equal(config.headers.Authorization, 'Bearer expert-token');
    return { status: 200, data: {}, config };
  };
  await api.get('/tasks');
  tab.storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
  await assert.rejects(api.get('/tasks'), axios.isCancel);
  assert.equal(sent, 1);
});

for (const status of [200, 401]) {
  test(`a delayed ${status} response from the old account is discarded without logging out the new account`, async () => {
    const b = browser();
    const tab = loggedInTab(b, professor);
    const api = createApiClient(tab.session);
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
    tab.storage.setItem(AUTH_SESSION_KEY, JSON.stringify(student));
    const rejection = assert.rejects(request, axios.isCancel);
    finish();
    await rejection;
    assert.equal(JSON.parse(tab.storage.getItem(AUTH_SESSION_KEY)).username, 'student');
  });
}

test('current-session 401 logs out (and forgets it if remembered), but a failed public login does not', async () => {
  const b = browser({ remembered: professor });
  const tab = b.openTab();
  const api = createApiClient(tab.session);
  api.defaults.adapter = async config => {
    throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, config });
  };
  await assert.rejects(api.post('/auth/login'), { message: 'Unauthorized' });
  assert.notEqual(tab.storage.getItem(AUTH_SESSION_KEY), null);
  assert.deepEqual(b.redirects, []);
  await assert.rejects(api.get('/tasks'), { message: 'Unauthorized' });
  assert.equal(tab.storage.getItem(AUTH_SESSION_KEY), null);
  assert.equal(b.persistent.getItem(AUTH_SESSION_KEY), null);
  assert.deepEqual(b.redirects, ['/login']);
});
