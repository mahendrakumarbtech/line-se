import {
  canAccess,
  LIMIT_PER_PAGE,
  STATUS_OPTIONS,
  APP_LANGUAGES,
  getMessageLabel,
} from "../../../constants.mjs";

const STORAGE_PREFIX = "linese_";

// ---------- localStorage ----------
export function setLocal(key, value) {
  if (value === undefined || value === null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
}

export function getLocal(key, { json = false } = {}) {
  const raw = localStorage.getItem(key);
  if (raw == null) return null;
  if (!json) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeLocal(key) {
  localStorage.removeItem(key);
}

export function clearLocal(keys = []) {
  keys.forEach((k) => localStorage.removeItem(k));
}

// ---------- encrypt / decrypt (token-derived AES-GCM) ----------
async function tokenToKey(token) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(token));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function bufToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function base64ToBuf(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function encryptWithToken(token, value) {
  if (!token) throw new Error("token required for encrypt");
  const key = await tokenToKey(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(
    typeof value === "string" ? value : JSON.stringify(value)
  );
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${bufToBase64(iv.buffer)}:${bufToBase64(cipher)}`;
}

export async function decryptWithToken(token, payload, { json = true } = {}) {
  if (!token || !payload) return null;
  try {
    const [ivB64, dataB64] = payload.split(":");
    if (!ivB64 || !dataB64) return null;
    const key = await tokenToKey(token);
    const iv = new Uint8Array(base64ToBuf(ivB64));
    const plainBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      base64ToBuf(dataB64)
    );
    const text = new TextDecoder().decode(plainBuf);
    return json ? JSON.parse(text) : text;
  } catch {
    return null;
  }
}

// ---------- admin session helpers ----------
export function setAdminToken(token) {
  setLocal(STORAGE_KEYS.ADMIN_TOKEN, token);
}

export function getAdminToken() {
  return getLocal(STORAGE_KEYS.ADMIN_TOKEN);
}

export async function setAdminUser(user, token) {
  if (!token || !user) return;
  const encrypted = await encryptWithToken(token, user);
  setLocal(STORAGE_KEYS.ADMIN_USER, encrypted);
}

export async function getAdminUser(token) {
  const encrypted = getLocal(STORAGE_KEYS.ADMIN_USER);
  return decryptWithToken(token, encrypted, { json: true });
}

export function clearAdminSession() {
  clearLocal([STORAGE_KEYS.ADMIN_TOKEN, STORAGE_KEYS.ADMIN_USER]);
}

export const STORAGE_KEYS = {
  ADMIN_TOKEN: `${STORAGE_PREFIX}admin_token`,
  ADMIN_USER: `${STORAGE_PREFIX}admin_user`,
  LANG: `${STORAGE_PREFIX}lang`,
};

// --- date helpers (pickers) ---
export function toLocalIsoDate(d = new Date()) {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toLocalIsoTime(d = new Date()) {
  const x = d instanceof Date ? d : new Date(d);
  return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`;
}

export function parseLocalIsoDate(iso) {
  if (!iso) return new Date();
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDate(d) {
  if (!d) return "";
  return parseLocalIsoDate(toLocalIsoDate(d)).toLocaleDateString();
}

export function formatDateTime(dateIso, timeIso) {
  if (!dateIso) return "";
  return `${formatDate(dateIso)}${timeIso ? ` ${timeIso}` : ""}`;
}

export function apiMessage(res, t, fallbackKey = "common.error") {
  // prefer API key → errors.AUTH_INVALID_PASSWORD
  if (res?.key) {
    const i18nKey = `errors.${res.key}`;
    const translated = t(i18nKey);
    if (translated !== i18nKey) return translated;
  }
  return res?.message || t(fallbackKey);
}

/** Apply API field errors: { status:0, message, errors: { email, password, ... } } */
export function applyServerErrors(resOrErrors, setErrors) {
  const fieldErrors =
    resOrErrors?.errors && typeof resOrErrors.errors === "object"
      ? resOrErrors.errors
      : resOrErrors?.data?.errors && typeof resOrErrors.data.errors === "object"
        ? resOrErrors.data.errors
        : null;
  if (!fieldErrors) return;
  setErrors((prev) => ({ ...prev, ...fieldErrors }));
}

// baad me yahi se constants re-export bhi kar sakte ho:
export {
  canAccess,
  LIMIT_PER_PAGE,
  STATUS_OPTIONS,
  APP_LANGUAGES,
  getMessageLabel,
};