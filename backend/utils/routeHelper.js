import { adminPermission } from "../middleware/adminPermission.js";

function resourceRoute(router, { prefix, permission, controller, middleware = [] }) {
  const p = permission; // "organization"
  const c = controller;
  if (typeof c.index === "function") router.post(`${prefix}/index`, ...middleware, ...(p ? [adminPermission(`${p}.view`)] : []), c.index);
  if (typeof c.add === "function") router.post(`${prefix}/add`, ...middleware, ...(p ? [adminPermission(`${p}.create`)] : []), c.add);
  if (typeof c.edit === "function") router.post(`${prefix}/edit`, ...middleware, ...(p ? [adminPermission(`${p}.update`)] : []), c.edit);
  if (typeof c.softDelete === "function") router.post(`${prefix}/delete`, ...middleware, ...(p ? [adminPermission(`${p}.delete`)] : []), c.softDelete);
  if (typeof c.bulkDelete === "function") router.post(`${prefix}/bulk-delete`, ...middleware, ...(p ? [adminPermission(`${p}.delete`)] : []), c.bulkDelete);
  if (typeof c.restore === "function") router.post(`${prefix}/restore`, ...middleware, ...(p ? [adminPermission(`${p}.force-delete`)] : []), c.restore);
  if (typeof c.forceDelete === "function") router.post(`${prefix}/force-delete`, ...middleware, ...(p ? [adminPermission(`${p}.force-delete`)] : []), c.forceDelete);
  if (typeof c.changeStatus === "function") router.post(`${prefix}/change-status`, ...middleware, ...(p ? [adminPermission(`${p}.change-status`)] : []), c.changeStatus);
}

export {
	resourceRoute,
}