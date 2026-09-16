const ROLE_TYPE_CODES = Object.freeze([
  { key: "SUPER_ADMIN", value: 1, panel: "admin", label: "Super Admin", badgeClass: "badge rounded-pill bg-light-success" },
  { key: "SUPER_ADMIN_STAFF", value: 2, panel: "admin", label: "Super Admin Staff", badgeClass: "badge rounded-pill bg-light-warning" },
  { key: "ORG_ADMIN", value: 3, panel: "organization", label: "Organization Admin", badgeClass: "badge rounded-pill bg-light-warning" },
  { key: "BRANCH_MANAGER", value: 4, panel: "organization", label: "Organization Branch Manager", badgeClass: "badge rounded-pill bg-light-warning" },
  { key: "BRANCH_STAFF", value: 5, panel: "organization", label: "Organization Branch Staff", badgeClass: "badge rounded-pill bg-light-secondary" },
  { key: "AGENT", value: 6, panel: "organization", label: "Agent", badgeClass: "badge rounded-pill bg-light-info" },
]);


const getRoleType = (key) => ROLE_TYPE_CODES.find((item) => item.key === key);


const ERROR_CODES = Object.freeze([
  { key: "AUTH_TOKEN_MISSING", value: "100001", label: "Your request is not authorized please provide a valid token" },
  { key: "AUTH_USER_NOT_FOUND", value: "100002", label: "Your request is not authorized please provide a valid token" },
  { key: "AUTH_NOT_PLATFORM_ROLE", value: "100003", label: "Your request is not authorized please provide a valid token" },
  { key: "AUTH_ROLE_INACTIVE", value: "100004", label: "Your role is not active please contact admin" },
  { key: "AUTH_ORG_INACTIVE", value: "100005", label: "Your organization is not active please contact admin" },
  { key: "AUTH_MEMBERSHIP_INACTIVE", value: "100006", label: "Your membership is not active please contact admin" },
  { key: "AUTH_ACCOUNT_INACTIVE", value: "100007", label: "Your account is not active please contact admin" },
  { key: "AUTH_TOKEN_INVALID", value: "100008", label: "Your request is not authorized please provide a valid token" },
]);

const getErrorCode = (key) => ERROR_CODES.find((item) => item.key === key);


const errorResponse = (key, data) => {
  const err = getErrorCode(key);
  const body = { status: false, error_code: err.value, message: err.label };
  if (data !== undefined) body.data = data;
  return body;
};
const successResponse = (data, message) => {
  const body = { status: true };
  if (message) body.message = message;
  if (data !== undefined) body.data = data;
  return body;
};

export {
  ROLE_TYPE_CODES,
  getRoleType,
  ERROR_CODES,
  getErrorCode,
  errorResponse,
  successResponse,
};

