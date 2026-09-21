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
]);

const getMessageCode = (key) => MESSAGE_CODES.find((item) => item.key === key);


const ADMIN_PERMISSIONS = [
  { name: "View Dashboard", slug: "dashboard.view", module: "dashboard" },
  { name: "View Organizations", slug: "organization.view", module: "organization" },
  { name: "Create Organization", slug: "organization.create", module: "organization" },
  { name: "Update Organization", slug: "organization.update", module: "organization" },
  { name: "Delete Organization", slug: "organization.delete", module: "organization" },
  { name: "Force Delete Organization", slug: "organization.force-delete", module: "organization" },
  { name: "Change Organization Status", slug: "organization.change-status", module: "organization" },
  { name: "View Users", slug: "user.view", module: "user" },
  { name: "Create User", slug: "user.create", module: "user" },
  { name: "Update User", slug: "user.update", module: "user" },
  { name: "Delete User", slug: "user.delete", module: "user" },
  { name: "Force Delete User", slug: "user.force-delete", module: "user" },
  { name: "Change User Status", slug: "user.change-status", module: "user" },
  { name: "View Roles", slug: "role.view", module: "role" },
  { name: "Create Role", slug: "role.create", module: "role" },
  { name: "Update Role", slug: "role.update", module: "role" },
  { name: "Delete Role", slug: "role.delete", module: "role" },
  { name: "Force Delete Role", slug: "role.force-delete", module: "role" },
  { name: "Change Role Status", slug: "role.change-status", module: "role" },
];

const errorResponse = (key, data) => {
  const err = getMessageCode(key);
  const body = { status: 0, error_code: err.value, message: err.label };
  if (data !== undefined) body.data = data;
  return body;
};
const successResponse = (data, message) => {
  const body = { status: 1, message: message };
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

export {
  ROLE_TYPE_CODES,
  getRoleType,
  MESSAGE_CODES,
  getMessageCode,
  ADMIN_PERMISSIONS,
  errorResponse,
  successResponse,
  canAccess,
  canAccessAny,
  canAccessAll,
};

