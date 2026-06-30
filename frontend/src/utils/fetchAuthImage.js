export async function fetchAuthImage(url) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
  if (!res.ok) throw new Error(`Image load failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
