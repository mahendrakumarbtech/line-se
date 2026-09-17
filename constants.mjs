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
]);

const getMessageCode = (key) => MESSAGE_CODES.find((item) => item.key === key);


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

export {
  ROLE_TYPE_CODES,
  getRoleType,
  MESSAGE_CODES,
  getMessageCode,
  errorResponse,
  successResponse,
};

