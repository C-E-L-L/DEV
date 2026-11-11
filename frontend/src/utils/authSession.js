export const AUTH_SESSION_KEY = 'cell-auth-session-v1';
// Set in a tab after an explicit logout so that tab does not silently re-adopt the remembered account.
export const SKIP_REMEMBERED_KEY = 'cell-auth-skip-remembered-v1';
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

/**
 * Login session for one browser tab.
 *
 * - `storage` is per-tab (sessionStorage): every tab can be signed in to a different account and
 *   never reads another tab's token, so accounts cannot mix between tabs.
 * - `persistentStorage` (localStorage) holds the account chosen with "로그인 상태 유지". A tab
 *   without its own login adopts it once at startup (new tab, browser restart).
 */
export function createAuthSession({
  storage,
  persistentStorage = null,
  onChange,
  createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
}) {
  // Migrate pre-v1 per-field logins (kept in persistent storage) once into a single record.
  const legacyStore = persistentStorage || storage;
  if (legacyStore.getItem(AUTH_SESSION_KEY) === null && legacyStore.getItem('token')) {
    const legacy = Object.fromEntries(LEGACY_KEYS.map(key => [key, legacyStore.getItem(key)]));
    if (decodeSession(JSON.stringify(legacy))) {
      legacyStore.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...legacy, sessionId: createId() }));
    }
  }
  LEGACY_KEYS.forEach(key => legacyStore.removeItem(key));

  if (persistentStorage && storage.getItem(AUTH_SESSION_KEY) === null && storage.getItem(SKIP_REMEMBERED_KEY) === null) {
    const remembered = persistentStorage.getItem(AUTH_SESSION_KEY);
    if (decodeSession(remembered)) storage.setItem(AUTH_SESSION_KEY, remembered);
    else if (remembered !== null) persistentStorage.removeItem(AUTH_SESSION_KEY);
  }

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
    save(user, { remember = false } = {}) {
      assertCurrent();
      const next = { ...user, sessionId: createId() };
      if (!decodeSession(JSON.stringify(next))) throw new Error('로그인 응답을 확인해 주세요.');
      const raw = JSON.stringify(next);
      storage.setItem(AUTH_SESSION_KEY, raw);
      storage.removeItem(SKIP_REMEMBERED_KEY);
      if (persistentStorage && remember) persistentStorage.setItem(AUTH_SESSION_KEY, raw);
      sync();
    },
    clear() {
      // A late response from the old account must never remove a new login.
      if (sync() || navigating) return;
      storage.removeItem(AUTH_SESSION_KEY);
      if (persistentStorage) {
        storage.setItem(SKIP_REMEMBERED_KEY, '1');
        // Logging out of the remembered account also forgets it; another tab's remembered account stays.
        const remembered = decodeSession(persistentStorage.getItem(AUTH_SESSION_KEY));
        if (session && remembered?.sessionId === session.sessionId) persistentStorage.removeItem(AUTH_SESSION_KEY);
      }
      if (!sync()) onChange(null);
    },
  };
}

/** Re-checks this tab's session when the tab regains focus or becomes visible. */
export function watchAuthSession(session, targetWindow, targetDocument) {
  const sync = () => session.sync();
  const onVisible = () => { if (targetDocument.visibilityState === 'visible') sync(); };
  targetWindow.addEventListener('focus', sync);
  targetDocument.addEventListener('visibilitychange', onVisible);
  sync();
  return () => {
    targetWindow.removeEventListener('focus', sync);
    targetDocument.removeEventListener('visibilitychange', onVisible);
  };
}
