import { getLocal, STORAGE_KEYS } from "../utils/custom";

export const API_URL = import.meta.env.VITE_API_URL;

/** Low-level fetch. GET → body as query string; others → JSON body. */
export function sendRequest(path, { method = "POST", body, token } = {}) {
  const headers = { "x-lang": getLocal(STORAGE_KEYS.LANG) || "en" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${API_URL}${path}`;
  const init = { method, headers };
  if (body && method === "GET") {
    url += `?${new URLSearchParams(body)}`;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  return fetch(url, init);
}

async function saveFile(res, fallbackName) {
  const disposition = res.headers.get("content-disposition") || "";
  const name = disposition.match(/filename="?([^";]+)"?/)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Every API call. JSON response → envelope { status, message, data, ... }.
 * File response (export) → saved to disk, returns { status: 1 }.
 * apiRequest("/admin/organizations/index", { page }, { token })
 * apiRequest("/admin/x", null, { token, method: "GET" })
 */
export async function apiRequest(path, body = {}, { token = null, method = "POST", filename = "download" } = {}) {
  const res = await sendRequest(path, { method, body, token }).catch(() => null);
  if (!res) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok || isJson) return res.json().catch(() => null);

  await saveFile(res, filename);
  return { status: 1 };
}
