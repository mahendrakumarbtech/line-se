import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  canAccess,
  LIMIT_PER_PAGE,
  STATUS_OPTIONS,
  ORGANIZATION_TYPE_CODES,
  APP_LANGUAGES,
  getMessageLabel,
  findLabel,
  EXPORT_TYPE_CODES,
  THEME_OPTIONS,
  slugify,
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
  THEME: `${STORAGE_PREFIX}theme`,
  MENU_COLLAPSED: `${STORAGE_PREFIX}menu_collapsed`,
};

// ---------- theme (light / dark / system) ----------
const systemDarkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

export function getTheme() {
  const saved = getLocal(STORAGE_KEYS.THEME);
  return THEME_OPTIONS.some((t) => t.key === saved) ? saved : "light";
}

export function applyTheme(theme = getTheme()) {
  const resolved = theme === "system" ? (systemDarkQuery().matches ? "dark" : "light") : theme;
  document.documentElement.setAttribute("data-bs-theme", resolved);
}

export function setTheme(theme) {
  setLocal(STORAGE_KEYS.THEME, theme);
  applyTheme(theme);
}

/** Re-apply when OS theme changes while "system" selected. Returns unsubscribe. */
export function watchSystemTheme() {
  const query = systemDarkQuery();
  const onChange = () => {
    if (getTheme() === "system") applyTheme("system");
  };
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

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

export function getInitials(name, fallback = "A") {
  return String(name || fallback)
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ---------- list pagination ----------
export function getTotalPages(totalRows, pageSize) {
  return Math.max(1, Math.ceil(Number(totalRows || 0) / (pageSize || 1)));
}

/** Page number buttons: 1 … around current … last */
export function getPageItems(totalPages, current) {
  const pages = Math.max(1, Number(totalPages) || 1);
  const cur = Math.min(Math.max(1, Number(current) || 1), pages);
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const items = [1];
  const start = Math.max(2, cur - 1);
  const end = Math.min(pages - 1, cur + 1);
  if (start > 2) items.push("…");
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < pages - 1) items.push("…");
  items.push(pages);
  return items;
}

// ---------- toast / confirm ----------
export const notify = {
  success: (msg) => toast.success(msg),
  error: (msg) => toast.error(msg),
  warning: (msg) => toast.warning(msg),
  info: (msg) => toast.info(msg),
};

export function confirmAction({
  title = "Are you sure?",
  text = "",
  confirmText = "Yes",
  cancelText = "Cancel",
  icon = "warning",
} = {}) {
  return Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: "#696cff",
  }).then((r) => r.isConfirmed);
}

export {
  canAccess,
  LIMIT_PER_PAGE,
  STATUS_OPTIONS,
  ORGANIZATION_TYPE_CODES,
  APP_LANGUAGES,
  getMessageLabel,
  findLabel,
  EXPORT_TYPE_CODES,
  THEME_OPTIONS,
  slugify,
};