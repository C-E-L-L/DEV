import { authSession } from './browserAuthSession';

export async function fetchAuthImage(url) {
  const { token } = authSession.getRequestSession();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  authSession.assertCurrent();
  if (res.status === 401) authSession.clear();
  if (!res.ok) throw new Error(`Image load failed: ${res.status}`);
  const blob = await res.blob();
  authSession.assertCurrent();
  return URL.createObjectURL(blob);
}
