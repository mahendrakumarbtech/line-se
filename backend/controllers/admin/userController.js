import { Op } from "sequelize";
import {
  errorResponse,
  successResponse,
  getMessageLabel,
  LIMIT_PER_PAGE,
  canAccess,
  hashPassword,
  cacheDel,
  getRoleType,
  USER_SENSITIVE_FIELDS,
} from "../../utils/custom.js";
import models from "../../models/index.js";

const USER_SAFE_ATTR = { exclude: USER_SENSITIVE_FIELDS };

const platformRoleInclude = {
  model: models.UserRole,
  required: false,
  include: [
    {
      model: models.Role,
      where: { organization_id: null },
      required: false,
      attributes: ["id", "name", "role_type", "status"],
    },
  ],
};

const findPlatformRole = async (roleId) => {
  if (!roleId) return null;
  return models.Role.findOne({
    where: {
      id: roleId,
      organization_id: null,
      status: 1,
      role_type: {
        [Op.in]: ROLE_TYPE_ADMIN_VALUES(),
      },
    },
  });
};

function ROLE_TYPE_ADMIN_VALUES() {
  // Super Admin + Super Admin Staff only for platform panel users
  return [
    getRoleType("SUPER_ADMIN")?.value,
    getRoleType("SUPER_ADMIN_STAFF")?.value,
  ].filter((v) => v !== undefined);
}

const invalidateUserCache = (userId) => {
  cacheDel(`user:${userId}`);
  cacheDel(`admin_auth:${userId}`);
};

async function index(req, res) {
  const { filter = {}, page = 1, limit = LIMIT_PER_PAGE } = req.body;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || LIMIT_PER_PAGE;
  const offset = (pageNum - 1) * limitNum;

  try {
    const where = {};
    if (filter.status !== undefined && filter.status !== "") {
      where.status = Number(filter.status);
    }
    if (filter.search?.trim()) {
      const q = `%${filter.search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
      ];
    }

    const query = {
      where,
      attributes: USER_SAFE_ATTR,
      include: [platformRoleInclude],
      order: [["created_at", "DESC"]],
      limit: limitNum,
      offset,
      distinct: true,
    };

    if (filter.trashed) {
      if (!canAccess(req.authUser, "user.manage-delete")) {
        return res.status(403).json(errorResponse("AUTH_PERMISSION_DENIED"));
      }
      query.paranoid = false;
      where.deleted_at = { [Op.ne]: null };
    }

    const { count, rows } = await models.User.findAndCountAll(query);
    return res.status(200).json(
      successResponse(
        { users: rows, total: count, page: pageNum, limit: limitNum },
        "USER_LISTED"
      )
    );
  } catch {
    return res.status(500).json(errorResponse("USER_LIST_FAILED"));
  }
}

async function add(req, res) {
  const { name, email, phone, password, status, role_id } = req.body;
  const errors = {};

  if (!name?.trim()) errors.name = getMessageLabel("USER_NAME_REQUIRED");
  if (!email?.trim()) errors.email = getMessageLabel("USER_EMAIL_REQUIRED");
  if (!phone?.trim()) errors.phone = getMessageLabel("USER_PHONE_REQUIRED");
  if (!password) errors.password = getMessageLabel("USER_PASSWORD_REQUIRED");
  if (!role_id) errors.role_id = getMessageLabel("USER_ROLE_REQUIRED");

  if (email?.trim() && !errors.email) {
    const exists = await models.User.findOne({ where: { email: email.trim() } });
    if (exists) errors.email = getMessageLabel("USER_EMAIL_EXISTS");
  }
  if (phone?.trim() && !errors.phone) {
    const exists = await models.User.findOne({ where: { phone: phone.trim() } });
    if (exists) errors.phone = getMessageLabel("USER_PHONE_EXISTS");
  }

  const role = role_id ? await findPlatformRole(role_id) : null;
  if (role_id && !role) errors.role_id = getMessageLabel("USER_ROLE_INVALID");

  if (Object.keys(errors).length) {
    return res.status(400).json(errorResponse("USER_VALIDATION_FAILED", { errors }));
  }

  try {
    const hashed = await hashPassword(password);
    const user = await models.User.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: hashed,
      status: status === undefined ? 1 : Number(status),
    });

    await models.UserRole.create({ user_id: user.id, role_id: role.id });

    const created = await models.User.findByPk(user.id, {
      attributes: USER_SAFE_ATTR,
      include: [platformRoleInclude],
    });

    return res.status(200).json(successResponse(created, "USER_CREATED"));
  } catch {
    return res.status(500).json(errorResponse("USER_CREATE_FAILED"));
  }
}

async function edit(req, res) {
  const { id, name, email, phone, password, status, role_id } = req.body;
  if (!id) return res.status(400).json(errorResponse("USER_ID_REQUIRED"));

  const user = await models.User.findByPk(id);
  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

  const errors = {};
  if (!name?.trim()) errors.name = getMessageLabel("USER_NAME_REQUIRED");
  if (!email?.trim()) errors.email = getMessageLabel("USER_EMAIL_REQUIRED");
  if (!phone?.trim()) errors.phone = getMessageLabel("USER_PHONE_REQUIRED");
  if (!role_id) errors.role_id = getMessageLabel("USER_ROLE_REQUIRED");

  if (email?.trim() && !errors.email) {
    const exists = await models.User.findOne({
      where: { email: email.trim(), id: { [Op.ne]: id } },
    });
    if (exists) errors.email = getMessageLabel("USER_EMAIL_EXISTS");
  }
  if (phone?.trim() && !errors.phone) {
    const exists = await models.User.findOne({
      where: { phone: phone.trim(), id: { [Op.ne]: id } },
    });
    if (exists) errors.phone = getMessageLabel("USER_PHONE_EXISTS");
  }

  const role = role_id ? await findPlatformRole(role_id) : null;
  if (role_id && !role) errors.role_id = getMessageLabel("USER_ROLE_INVALID");

  if (Object.keys(errors).length) {
    return res.status(400).json(errorResponse("USER_VALIDATION_FAILED", { errors }));
  }

  try {
    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      ...(status !== undefined ? { status: Number(status) } : {}),
    };
    if (password) payload.password = await hashPassword(password);

    await user.update(payload);

    await models.UserRole.destroy({ where: { user_id: id } });
    await models.UserRole.create({ user_id: id, role_id: role.id });

    invalidateUserCache(id);

    const updated = await models.User.findByPk(id, {
      attributes: USER_SAFE_ATTR,
      include: [platformRoleInclude],
    });

    return res.status(200).json(successResponse(updated, "USER_UPDATED"));
  } catch {
    return res.status(500).json(errorResponse("USER_UPDATE_FAILED"));
  }
}

async function softDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("USER_ID_REQUIRED"));
  if (Number(id) === Number(req.authUser?.id)) {
    return res.status(400).json(errorResponse("USER_SELF_ACTION_DENIED"));
  }

  const user = await models.User.findByPk(id);
  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

  try {
    await user.destroy();
    invalidateUserCache(id);
    return res.status(200).json(successResponse(null, "USER_DELETED"));
  } catch {
    return res.status(500).json(errorResponse("USER_DELETE_FAILED"));
  }
}

async function bulkSoftDelete(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json(errorResponse("USER_IDS_REQUIRED"));
  }
  const filtered = ids.filter((id) => Number(id) !== Number(req.authUser?.id));
  if (!filtered.length) {
    return res.status(400).json(errorResponse("USER_SELF_ACTION_DENIED"));
  }

  try {
    await models.User.destroy({ where: { id: { [Op.in]: filtered } } });
    filtered.forEach(invalidateUserCache);
    return res.status(200).json(successResponse(null, "USERS_DELETED"));
  } catch {
    return res.status(500).json(errorResponse("USER_DELETE_FAILED"));
  }
}

async function restore(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("USER_ID_REQUIRED"));

  const user = await models.User.findOne({
    where: { id, deleted_at: { [Op.ne]: null } },
    paranoid: false,
  });
  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

  try {
    await user.restore();
    invalidateUserCache(id);
    const restored = await models.User.findByPk(id, {
      attributes: USER_SAFE_ATTR,
      include: [platformRoleInclude],
    });
    return res.status(200).json(successResponse(restored, "USER_RESTORED"));
  } catch {
    return res.status(500).json(errorResponse("USER_UPDATE_FAILED"));
  }
}

async function bulkRestore(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json(errorResponse("USER_IDS_REQUIRED"));
  }

  try {
    await models.User.restore({ where: { id: { [Op.in]: ids } } });
    ids.forEach(invalidateUserCache);
    return res.status(200).json(successResponse(null, "USERS_RESTORED"));
  } catch {
    return res.status(500).json(errorResponse("USER_BULK_RESTORE_FAILED"));
  }
}

async function forceDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("USER_ID_REQUIRED"));
  if (Number(id) === Number(req.authUser?.id)) {
    return res.status(400).json(errorResponse("USER_SELF_ACTION_DENIED"));
  }

  const user = await models.User.findByPk(id, { paranoid: false });
  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

  try {
    await models.UserRole.destroy({ where: { user_id: id } });
    await user.destroy({ force: true });
    invalidateUserCache(id);
    return res.status(200).json(successResponse(null, "USER_PERMANENTLY_DELETED"));
  } catch {
    return res.status(500).json(errorResponse("USER_DELETE_FAILED"));
  }
}

async function bulkForceDelete(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json(errorResponse("USER_IDS_REQUIRED"));
  }
  const filtered = ids.filter((id) => Number(id) !== Number(req.authUser?.id));
  if (!filtered.length) {
    return res.status(400).json(errorResponse("USER_SELF_ACTION_DENIED"));
  }

  try {
    await models.UserRole.destroy({ where: { user_id: { [Op.in]: filtered } } });
    await models.User.destroy({ where: { id: { [Op.in]: filtered } }, force: true });
    filtered.forEach(invalidateUserCache);
    return res.status(200).json(successResponse(null, "USERS_PERMANENTLY_DELETED"));
  } catch {
    return res.status(500).json(errorResponse("USER_BULK_DELETE_FAILED"));
  }
}

async function changeStatus(req, res) {
  const { id, status } = req.body;
  if (!id) return res.status(400).json(errorResponse("USER_ID_REQUIRED"));
  if (status === undefined || status === null || status === "") {
    return res.status(400).json(errorResponse("USER_STATUS_REQUIRED"));
  }
  if (Number(id) === Number(req.authUser?.id)) {
    return res.status(400).json(errorResponse("USER_SELF_ACTION_DENIED"));
  }

  const user = await models.User.findByPk(id);
  if (!user) return res.status(404).json(errorResponse("USER_NOT_FOUND"));

  try {
    await user.update({ status: Number(status) });
    invalidateUserCache(id);
    const updated = await models.User.findByPk(id, { attributes: USER_SAFE_ATTR });
    return res.status(200).json(successResponse(updated, "USER_STATUS_CHANGED"));
  } catch {
    return res.status(500).json(errorResponse("USER_UPDATE_FAILED"));
  }
}

export {
  index,
  add,
  edit,
  softDelete,
  bulkSoftDelete,
  restore,
  bulkRestore,
  forceDelete,
  bulkForceDelete,
  changeStatus,
};