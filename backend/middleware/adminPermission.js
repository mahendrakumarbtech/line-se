import { canAccess, canAccessAny, errorResponse } from "../../constants.mjs";
/**
 * Laravel-style permission gate for Express routes.
 *
 * even when roles/permissions tables were emptied (orphan role_id).
 */
function adminPermission(...permissions) {
  const keys = permissions.flat().filter(Boolean);
  return (req, res, next) => {
    if (!keys.length) return next();
    const allowed =
      keys.length === 1
        ? canAccess(req.authUser, keys[0])
        : canAccessAny(req.authUser, keys);
    if (!allowed) {
      return res.status(403).json(errorResponse("AUTH_PERMISSION_DENIED")); // constants me add
    }
    return next();
  };
}

export { adminPermission };
