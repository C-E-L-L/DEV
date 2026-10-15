import { createAuthSession, getSessionHomePath } from './authSession';

export const authSession = createAuthSession({
  storage: window.localStorage,
  onChange: session => window.location.replace(getSessionHomePath(session)),
});
