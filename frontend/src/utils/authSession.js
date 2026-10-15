export const AUTH_SESSION_KEY = 'cell-auth-session-v1';
const LEGACY_KEYS = ['token', 'username', 'name', 'role'];

export function getSessionHomePath(session) {
  if (!session) return '/';
  const role = String(session.role).toUpperCase();
  return role === 'ADMIN' ? '/admin' : role === 'EXPERT' ? '/expert' : '/student';
}

function decodeSession(raw) {
  try {
    const session = JSON.parse(raw);
    return session?.token && session?.username && ['ADMIN', 'EXPERT', 'STUDENT'].includes(String(session.role).toUpperCase())
      ? session : null;
  } catch {
    return null;
  }
}

export function createAuthSession({ storage, onChange, createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}` }) {
  // Migrate existing logins once; subsequent reads use a single atomic record.
  if (storage.getItem(AUTH_SESSION_KEY) === null && storage.getItem('token')) {
    const legacy = Object.fromEntries(LEGACY_KEYS.map(key => [key, storage.getItem(key)]));
    if (decodeSession(JSON.stringify(legacy))) {
      storage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...legacy, sessionId: createId() }));
    }
  }
  LEGACY_KEYS.forEach(key => storage.removeItem(key));

  // This document belongs to one session for its entire lifetime. Navigation
  // on a session change discards old component state and asynchronous work.
  const initialRaw = storage.getItem(AUTH_SESSION_KEY);
  const session = decodeSession(initialRaw);
  let navigating = false;
  const sync = () => {
    if (storage.getItem(AUTH_SESSION_KEY) === initialRaw) return false;
    if (!navigating) {
      navigating = true;
      onChange(decodeSession(storage.getItem(AUTH_SESSION_KEY)));
    }
    return true;
  };
  const assertCurrent = () => {
    if (sync() || navigating) throw new DOMException('로그인 상태가 변경되었습니다.', 'AbortError');
  };

  return {
    getSession: () => session,
    sync,
    assertCurrent,
    getRequestSession() {
      assertCurrent();
      if (!session) throw new DOMException('로그인이 필요합니다.', 'AbortError');
      return session;
    },
    save(user) {
      assertCurrent();
      const next = { ...user, sessionId: createId() };
      if (!decodeSession(JSON.stringify(next))) throw new Error('로그인 응답을 확인해 주세요.');
      storage.setItem(AUTH_SESSION_KEY, JSON.stringify(next));
      sync();
    },
    clear() {
      // A late response from the old account must never remove a new login.
      if (sync() || navigating) return;
      storage.removeItem(AUTH_SESSION_KEY);
      if (!sync()) onChange(null);
    },
  };
}

export function watchAuthSession(session, targetWindow, targetDocument) {
  const sync = () => session.sync();
  const onStorage = event => {
    if (event.storageArea === targetWindow.localStorage && (event.key === AUTH_SESSION_KEY || event.key === null)) sync();
  };
  const onVisible = () => { if (targetDocument.visibilityState === 'visible') sync(); };
  targetWindow.addEventListener('storage', onStorage);
  targetWindow.addEventListener('focus', sync);
  targetDocument.addEventListener('visibilitychange', onVisible);
  sync();
  return () => {
    targetWindow.removeEventListener('storage', onStorage);
    targetWindow.removeEventListener('focus', sync);
    targetDocument.removeEventListener('visibilitychange', onVisible);
  };
}
