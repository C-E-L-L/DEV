import { createAuthSession, getSessionHomePath } from './authSession';

export const authSession = createAuthSession({
  storage: window.sessionStorage, // per tab: each tab can use a different account
  persistentStorage: window.localStorage, // "로그인 상태 유지" account for new tabs / restarts
  onChange: session => window.location.replace(getSessionHomePath(session)),
});
