import { getLocal, STORAGE_KEYS } from "../utils/custom";

export const API_URL = import.meta.env.VITE_API_URL;

function postRequest(path, body, token) {
  const headers = {
    "Content-Type": "application/json",
    "x-lang": getLocal(STORAGE_KEYS.LANG) || "en",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
}

export async function apiPost(path, body = {}, { token = null } = {}) {
  const res = await postRequest(path, body, token);
  return res.json().catch(() => null); // { status: 0|1, message, data, error_code, key }
}

/** POST that returns a file (export). Saves it; returns { status: 1 } or the API error envelope. */
export async function apiDownload(path, body = {}, { token = null, filename = "export" } = {}) {
  const res = await postRequest(path, body, token).catch(() => null);
  if (!res) return null;
  if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
    return res.json().catch(() => null);
  }

  const disposition = res.headers.get("content-disposition") || "";
  const name = disposition.match(/filename="?([^";]+)"?/)?.[1] || filename;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return { status: 1 };
}