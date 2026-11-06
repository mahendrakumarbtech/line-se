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
  { key: "AUTH_TOKEN_MISSING", value: "100001", label: "Your request is not authorized please provide a valid token" },
  { key: "AUTH_USER_NOT_FOUND", value: "100002", label: "User not found" },
  { key: "AUTH_NOT_PLATFORM_ROLE", value: "100003", label: "You are not authorized to access this platform" },
  { key: "AUTH_USER_NOT_ACTIVE", value: "100004", label: "Your account is not active please contact admin" },
  { key: "AUTH_ROLE_NOT_ACTIVE", value: "100005", label: "Your role is not active please contact admin" },
  { key: "AUTH_ORG_NOT_ACTIVE", value: "100006", label: "Your organization is not active please contact admin" },
  { key: "AUTH_MEMBERSHIP_NOT_ACTIVE", value: "100007", label: "Your membership is not active please contact admin" },
  { key: "AUTH_ACCOUNT_NOT_ACTIVE", value: "100008", label: "Your account is not active please contact admin" },
  { key: "AUTH_TOKEN_INVALID", value: "100009", label: "Your request is not authorized please provide a valid token" },
  { key: "AUTH_INVALID_PASSWORD", value: "100010", label: "Invalid password" },
  { key: "AUTH_PERMISSION_DENIED", value: "100011", label: "You do not have permission to perform this action" },
  { key: "ORG_NOT_FOUND", value: "300001", label: "Organization not found" },
  { key: "ORG_SLUG_EXISTS", value: "300002", label: "Organization slug already exists" },
  { key: "ORG_CREATE_FAILED", value: "300003", label: "Failed to create organization" },
  { key: "ORG_VALIDATION_FAILED", value: "300004", label: "Validation failed" },
  { key: "ORG_NAME_REQUIRED", value: "300005", label: "Name is required" },
  { key: "ORG_SLUG_REQUIRED", value: "300006", label: "Slug is required" },
  { key: "ORG_TYPE_REQUIRED", value: "300007", label: "Type is required" },
  { key: "ORG_LIST_FAILED", value: "300008", label: "Failed to list organizations" },
  { key: "ORG_ID_REQUIRED", value: "300009", label: "Organization id is required" },
  { key: "ORG_UPDATE_FAILED", value: "300010", label: "Failed to update organization" },
  { key: "ORG_DELETE_FAILED", value: "300011", label: "Failed to delete organization" },
  { key: "ORG_IDS_REQUIRED", value: "300012", label: "Organization ids are required" },
  { key: "ORG_STATUS_REQUIRED", value: "300013", label: "Status is required" },
  { key: "ORG_BULK_DELETE_FAILED", value: "300014", label: "Failed to bulk delete organizations" },
  { key: "USER_NOT_FOUND", value: "200001", label: "User not found" },
  { key: "USER_EMAIL_EXISTS", value: "200002", label: "Email already exists" },
  { key: "USER_PHONE_EXISTS", value: "200003", label: "Phone already exists" },
  { key: "USER_CREATE_FAILED", value: "200004", label: "Failed to create user" },
  { key: "USER_VALIDATION_FAILED", value: "200005", label: "Validation failed" },
  { key: "USER_NAME_REQUIRED", value: "200006", label: "Name is required" },
  { key: "USER_EMAIL_REQUIRED", value: "200007", label: "Email is required" },
  { key: "USER_PHONE_REQUIRED", value: "200008", label: "Phone is required" },
  { key: "USER_PASSWORD_REQUIRED", value: "200009", label: "Password is required" },
  { key: "USER_ROLE_REQUIRED", value: "200010", label: "Role is required" },
  { key: "USER_ROLE_INVALID", value: "200011", label: "Invalid platform role" },
  { key: "USER_LIST_FAILED", value: "200012", label: "Failed to list users" },
  { key: "USER_ID_REQUIRED", value: "200013", label: "User id is required" },
  { key: "USER_UPDATE_FAILED", value: "200014", label: "Failed to update user" },
  { key: "USER_DELETE_FAILED", value: "200015", label: "Failed to delete user" },
  { key: "USER_IDS_REQUIRED", value: "200016", label: "User ids are required" },
  { key: "USER_STATUS_REQUIRED", value: "200017", label: "Status is required" },
  { key: "USER_BULK_DELETE_FAILED", value: "200018", label: "Failed to bulk delete users" },
  { key: "USER_BULK_RESTORE_FAILED", value: "200019", label: "Failed to bulk restore users" },
  { key: "USER_SELF_ACTION_DENIED", value: "200020", label: "You cannot perform this action on your own account" },
]);

const getMessageCode = (key) => MESSAGE_CODES.find((item) => item.key === key);

const getMessageLabel = (key, lang = "en") => {
  const bag = LOCALES[lang] || LOCALES.en;
  const i18nKey = key.startsWith("errors.") ? key : `errors.${key}`;
  return bag[i18nKey] || LOCALES.en[i18nKey] || key;
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

const errorResponse = (key, data, lang = "en") => {
  const err = getMessageCode(key);
  const body = {
    status: 0,
    error_code: err.value,
    key: err.key,
    message: getMessageLabel(err.key, lang),
  };
  if (data !== undefined) body.data = data;
  return body;
};

const successResponse = (data, keyOrMessage, lang = "en") => {
  const body = { status: 1 };
  if (keyOrMessage) {
    // key prefer: "AUTH_LOGIN_SUCCESS" → locales se
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

