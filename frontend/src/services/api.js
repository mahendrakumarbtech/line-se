export const API_URL = import.meta.env.VITE_API_URL;


export async function apiPost(path, body = {}, { token = null } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return data; // { status: 0|1, message, data, error_code }
}