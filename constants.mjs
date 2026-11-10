import en from "./locales/en.json" with { type: "json" };
import hi from "./locales/hi.json" with { type: "json" };
import hinglish from "./locales/hinglish.json" with { type: "json" };

const LOCALES = { en, hi, hinglish };

const LIMIT_PER_PAGE = 10;

const ROLE_TYPE_CODES = Object.freeze([
  { key: "SUPER_ADMIN", value: 1, panel: "admin", label: "Super Admin", badgeClass: "badge rounded-pill bg-light-success" },
  { key: "SUPER_ADMIN_STAFF", value: 2, panel: "admin", label: "Super Admin Staff", badgeClass: "badge rounded-pill bg-light-warning" },
  { key: "ORG_ADMIN", value: 3, panel: "organization", label: "Organization Admin", badgeClass: "badge rounded-pill bg-light-warning" },
  { key: "BRANCH_MANAGER", value: 4, panel: "organization", label: "Organization Branch Manager", badgeClass: "badge rounded-pill bg-light-warning" },
  { key: "BRANCH_STAFF", value: 5, panel: "organization", label: "Organization Branch Staff", badgeClass: "badge rounded-pill bg-light-secondary" },
  { key: "AGENT", value: 6, panel: "organization", label: "Agent", badgeClass: "badge rounded-pill bg-light-info" },
]);


const getRoleType = (key) => ROLE_TYPE_CODES.find((item) => item.key === key);


const MESSAGE_CODES = Object.freeze([
  { key: "AUTH_TOKEN_MISSING", value: "100001" },
  { key: "AUTH_USER_NOT_FOUND", value: "100002" },
  { key: "AUTH_NOT_PLATFORM_ROLE", value: "100003" },
  { key: "AUTH_USER_NOT_ACTIVE", value: "100004" },
  { key: "AUTH_ROLE_NOT_ACTIVE", value: "100005" },
  { key: "AUTH_ORG_NOT_ACTIVE", value: "100006" },
  { key: "AUTH_MEMBERSHIP_NOT_ACTIVE", value: "100007" },
  { key: "AUTH_ACCOUNT_NOT_ACTIVE", value: "100008" },
  { key: "AUTH_TOKEN_INVALID", value: "100009" },
  { key: "AUTH_INVALID_PASSWORD", value: "100010" },
  { key: "AUTH_PERMISSION_DENIED", value: "100011" },
  { key: "AUTH_INVALID_CREDENTIALS", value: "100012" },
  { key: "AUTH_EMAIL_NOT_FOUND", value: "100013" },
  { key: "FORM_INVALID", value: "100014" },
  { key: "AUTH_RESET_TOKEN_INVALID", value: "100015" },
  { key: "AUTH_RESET_TOKEN_EXPIRED", value: "100016" },
  { key: "AUTH_PASSWORD_MISMATCH", value: "100017" },
  { key: "AUTH_CONFIRM_PASSWORD_REQUIRED", value: "100018" },
  { key: "AUTH_MAIL_SEND_FAILED", value: "100019" },
  { key: "ORG_NOT_FOUND", value: "300001" },
  { key: "ORG_SLUG_EXISTS", value: "300002" },
  { key: "ORG_CREATE_FAILED", value: "300003" },
  { key: "ORG_VALIDATION_FAILED", value: "300004" },
  { key: "ORG_NAME_REQUIRED", value: "300005" },
  { key: "ORG_SLUG_REQUIRED", value: "300006" },
  { key: "ORG_TYPE_REQUIRED", value: "300007" },
  { key: "ORG_LIST_FAILED", value: "300008" },
  { key: "ORG_ID_REQUIRED", value: "300009" },
  { key: "ORG_UPDATE_FAILED", value: "300010" },
  { key: "ORG_DELETE_FAILED", value: "300011" },
  { key: "ORG_IDS_REQUIRED", value: "300012" },
  { key: "ORG_STATUS_REQUIRED", value: "300013" },
  { key: "ORG_BULK_DELETE_FAILED", value: "300014" },
  { key: "ORG_BULK_RESTORE_FAILED", value: "300015" },
  { key: "USER_NOT_FOUND", value: "200001" },
  { key: "USER_EMAIL_EXISTS", value: "200002" },
  { key: "USER_PHONE_EXISTS", value: "200003" },
  { key: "USER_CREATE_FAILED", value: "200004" },
  { key: "USER_VALIDATION_FAILED", value: "200005" },
  { key: "USER_NAME_REQUIRED", value: "200006" },
  { key: "USER_EMAIL_REQUIRED", value: "200007" },
  { key: "USER_PHONE_REQUIRED", value: "200008" },
  { key: "USER_PASSWORD_REQUIRED", value: "200009" },
  { key: "USER_ROLE_REQUIRED", value: "200010" },
  { key: "USER_ROLE_INVALID", value: "200011" },
  { key: "USER_LIST_FAILED", value: "200012" },
  { key: "USER_ID_REQUIRED", value: "200013" },
  { key: "USER_UPDATE_FAILED", value: "200014" },
  { key: "USER_DELETE_FAILED", value: "200015" },
  { key: "USER_IDS_REQUIRED", value: "200016" },
  { key: "USER_STATUS_REQUIRED", value: "200017" },
  { key: "USER_BULK_DELETE_FAILED", value: "200018" },
  { key: "USER_BULK_RESTORE_FAILED", value: "200019" },
  { key: "USER_SELF_ACTION_DENIED", value: "200020" },
]);

const getMessageCode = (key) => MESSAGE_CODES.find((item) => item.key === key);

/** Resolve user-facing text from locales by MESSAGE key or full i18n key. */
const getMessageLabel = (key, lang = "en") => {
  if (!key) return "";
  const bag = LOCALES[lang] || LOCALES.en;
  const enBag = LOCALES.en;
  if (key.startsWith("errors.") || key.startsWith("success.") || key.includes(".")) {
    return bag[key] || enBag[key] || key;
  }
  return (
    bag[`errors.${key}`] ||
    bag[`success.${key}`] ||
    enBag[`errors.${key}`] ||
    enBag[`success.${key}`] ||
    key
  );
};

const ADMIN_PERMISSIONS = [
  { name: "View Dashboard", slug: "dashboard.view", module: "dashboard" },
  { name: "View Organizations", slug: "organization.view", module: "organization" },
  { name: "Create Organization", slug: "organization.create", module: "organization" },
  { name: "Update Organization", slug: "organization.update", module: "organization" },
  { name: "Delete Organization", slug: "organization.delete", module: "organization" },
  { name: "Manage Deleted Organizations", slug: "organization.manage-delete", module: "organization" },
  { name: "Change Organization Status", slug: "organization.change-status", module: "organization" },
  { name: "View Users", slug: "user.view", module: "user" },
  { name: "Create User", slug: "user.create", module: "user" },
  { name: "Update User", slug: "user.update", module: "user" },
  { name: "Delete User", slug: "user.delete", module: "user" },
  { name: "Manage Deleted Users", slug: "user.manage-delete", module: "user" },
  { name: "Change User Status", slug: "user.change-status", module: "user" },
  { name: "View Roles", slug: "role.view", module: "role" },
  { name: "Create Role", slug: "role.create", module: "role" },
  { name: "Update Role", slug: "role.update", module: "role" },
  { name: "Delete Role", slug: "role.delete", module: "role" },
  { name: "Manage Deleted Roles", slug: "role.manage-delete", module: "role" },
  { name: "Change Role Status", slug: "role.change-status", module: "role" },
];

/**
 * Fail envelope (status number, not boolean):
 * { status: 0, error_code, key, message, errors?, data? }
 * - Field errors → pass { errors: { email: "...", ... } }
 * - Then `message` becomes FORM_INVALID (toast common text); field texts stay in `errors`.
 */
const errorResponse = (key, data, lang = "en") => {
  const err = getMessageCode(key);
  const fieldErrors =
    data && typeof data === "object" && data.errors && typeof data.errors === "object"
      ? data.errors
      : null;

  const body = {
    status: 0,
    error_code: err?.value,
    key: err?.key || key,
    message: fieldErrors
      ? getMessageLabel("FORM_INVALID", lang)
      : getMessageLabel(err?.key || key, lang),
  };

  if (fieldErrors) {
    body.errors = fieldErrors;
    const { errors: _ignore, ...rest } = data;
    if (Object.keys(rest).length) body.data = rest;
  } else if (data !== undefined) {
    body.data = data;
  }
  return body;
};

/**
 * Success envelope:
 * { status: 1, message?, key?, data? }
 */
const successResponse = (data, keyOrMessage, lang = "en") => {
  const body = { status: 1 };
  if (keyOrMessage) {
    body.key = keyOrMessage;
    body.message = getMessageLabel(keyOrMessage, lang);
  }
  if (data !== undefined) body.data = data;
  return body;
};

const canAccess = (userOrKeys, permission) => {
  const key = String(permission || "").trim();
  if (!key) return false;

  // Har authenticated admin ke liye dashboard open
  if (key === "dashboard.view") return true;

  // Har authenticated admin ke liye dashboard open
  if (Array.isArray(userOrKeys)) {
    return userOrKeys.includes(key) || userOrKeys.includes("*");
  }

  if (!userOrKeys || typeof userOrKeys !== "object") return false;

  const roleType = userOrKeys.role?.role_type ?? null;
  if (roleType === getRoleType("SUPER_ADMIN")?.value) return true;

  const keys = userOrKeys.permissions || [];
  if (!Array.isArray(keys) || !keys.length) return false;

  if (keys.includes("*")) return true;
  return keys.includes(key);
};

/** True if the user can perform any of the given permissions. */
function canAccessAny(userOrKeys, permissions) {
  if (!Array.isArray(permissions) || !permissions.length) return false;
  return permissions.some((p) => canAccess(userOrKeys, p));
}

/** True if the user can perform all of the given permissions. */
function canAccessAll(userOrKeys, permissions) {
  if (!Array.isArray(permissions) || !permissions.length) return false;
  return permissions.every((p) => canAccess(userOrKeys, p));
}

const STATUS_OPTIONS = [
  { id: 1, text: "Active" },
  { id: 0, text: "Inactive" },
];

const APP_LANGUAGES = [
  { key: "en", label: "English" },
  { key: "hi", label: "हिन्दी" },
  { key: "hinglish", label: "हिnglish" },
];

export {
  ROLE_TYPE_CODES,
  getRoleType,
  MESSAGE_CODES,
  getMessageCode,
  getMessageLabel,
  errorResponse,
  successResponse,
  ADMIN_PERMISSIONS,
  canAccess,
  canAccessAny,
  canAccessAll,
  LIMIT_PER_PAGE,
  STATUS_OPTIONS,
  APP_LANGUAGES,
};

