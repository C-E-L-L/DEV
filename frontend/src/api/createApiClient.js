import axios from 'axios';

export function createApiClient(authSession) {
  const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
  });

  // Never adopt another tab's token while the old account's screen is mounted.
  api.interceptors.request.use((config) => {
    try {
      authSession.assertCurrent();
      if (!/^\/auth\/(login|register)$/.test(config.url)) {
        const session = authSession.getRequestSession();
        config.headers.Authorization = `Bearer ${session.token}`;
        config.authenticatedRequest = true;
      }
    } catch {
      throw new axios.CanceledError('로그인 상태가 변경되어 요청을 취소했습니다.');
    }
    return config;
  });

  // Ignore stale responses, including 401s, once another tab changes the session.
  api.interceptors.response.use(
    (response) => {
      try { authSession.assertCurrent(); }
      catch { throw new axios.CanceledError('이전 로그인 세션의 응답입니다.'); }
      return response;
    },
    (error) => {
      try { authSession.assertCurrent(); }
      catch { return Promise.reject(new axios.CanceledError('이전 로그인 세션의 응답입니다.')); }
      if (error.response?.status === 401 && error.config?.authenticatedRequest) authSession.clear();
      return Promise.reject(error);
    }
  );

  return api;
}
