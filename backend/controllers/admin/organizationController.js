import { Op } from "sequelize";
import { errorResponse, successResponse, getMessageCode, LIMIT_PER_PAGE, canAccess } from "../../utils/custom.js";
import models from "../../models/index.js";

async function index(req, res) {
  const { filter = {}, page = 1, limit = LIMIT_PER_PAGE } = req.body;
  const offset = (page - 1) * limit;
  try {
    const where = {};
    if (filter.status !== undefined && filter.status !== "") {
      where.status = Number(filter.status);
    }
    if (filter.search?.trim()) {
      where[Op.or] = [
        { name: { [Op.like]: `%${filter.search.trim()}%` } },
        { slug: { [Op.like]: `%${filter.search.trim()}%` } },
      ];
    }

    const query = {
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    };

    if (filter.trashed) {
      if (!canAccess(req.authUser, "organization.manage-delete")) {
        return res.status(403).json(errorResponse("AUTH_PERMISSION_DENIED"));
      }
      query.paranoid = false;
      where.deletedAt = { [Op.ne]: null };
    }

    const { count, rows } = await models.Organization.findAndCountAll(query);
    return res.status(200).json(successResponse({
      organizations: rows,
      total: count,
      page,
      limit
    }, "Organizations listed successfully"));
  } catch (error) {
    return res.status(500).json(errorResponse("ORG_LIST_FAILED"));
  }
}

async function add(req, res) {
  const { name, slug, type, status } = req.body;
  const errors = {};

  if (!name?.trim()) errors.name = getMessageCode("ORG_NAME_REQUIRED").label;
  if (!slug?.trim()) errors.slug = getMessageCode("ORG_SLUG_REQUIRED").label;
  if (type === undefined || type === null || type === "") {
    errors.type = getMessageCode("ORG_TYPE_REQUIRED").label;
  }

  if (slug?.trim() && !errors.slug) {
    const exists = await models.Organization.findOne({ where: { slug: slug.trim() } });
    if (exists) errors.slug = getMessageCode("ORG_SLUG_EXISTS").label;
  }

  if (Object.keys(errors).length) {
    return res.status(400).json(
      errorResponse("ORG_VALIDATION_FAILED", { errors })
    );
  }

  try {
    const organization = await models.Organization.create({ name: name.trim(), slug: slug.trim(), type, status });
    return res.status(200).json(successResponse(organization, "Organization created successfully"));
  } catch (error) {
    return res.status(500).json(errorResponse("ORG_CREATE_FAILED"));
  }
}

async function edit(req, res) {
  const { id, name, slug, type, status } = req.body;
  if (!id) return res.status(400).json(errorResponse("ORG_ID_REQUIRED"));

  const organization = await models.Organization.findByPk(id);
  if (!organization) return res.status(404).json(errorResponse("ORG_NOT_FOUND"));

  const errors = {};
  if (!name?.trim()) errors.name = getMessageCode("ORG_NAME_REQUIRED").label;
  if (!slug?.trim()) errors.slug = getMessageCode("ORG_SLUG_REQUIRED").label;
  if (type === undefined || type === null || type === "") {
    errors.type = getMessageCode("ORG_TYPE_REQUIRED").label;
  }
  if (slug?.trim() && !errors.slug) {
    const exists = await models.Organization.findOne({
      where: { slug: slug.trim(), id: { [Op.ne]: id } },
    });
    if (exists) errors.slug = getMessageCode("ORG_SLUG_EXISTS").label;
  }
  if (Object.keys(errors).length) {
    return res.status(400).json(errorResponse("ORG_VALIDATION_FAILED", { errors }));
  }

  try {
    await organization.update({
      name: name.trim(),
      slug: slug.trim(),
      type,
      ...(status !== undefined ? { status } : {}),
    });
    return res.status(200).json(successResponse(organization, "Organization updated successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_UPDATE_FAILED"));
  }
}

async function softDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("ORG_ID_REQUIRED"));

  const organization = await models.Organization.findByPk(id);
  if (!organization) return res.status(404).json(errorResponse("ORG_NOT_FOUND"));

  try {
    await organization.destroy(); // soft
    return res.status(200).json(successResponse(null, "Organization deleted successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_DELETE_FAILED"));
  }
}

async function bulkSoftDelete(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json(errorResponse("ORG_IDS_REQUIRED"));
  }

  try {
    await models.Organization.destroy({
      where: { id: { [Op.in]: ids } },
    });
    return res.status(200).json(successResponse(null, "Organization deleted successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_DELETE_FAILED"));
  }
}

async function restore(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("ORG_ID_REQUIRED"));

  const organization = await models.Organization.findByPk(id, { paranoid: false });
  if (!organization || !organization.deletedAt) {
    return res.status(404).json(errorResponse("ORG_NOT_FOUND"));
  }

  try {
    await organization.restore();
    return res.status(200).json(successResponse(organization, "Organization restored successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_UPDATE_FAILED"));
  }
}

async function bulkRestore(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json(errorResponse("ORG_IDS_REQUIRED"));
  }

  const organizations = await models.Organization.findAll({ where: { id: { [Op.in]: ids } }, paranoid: false });
  if (!organizations.length) return res.status(400).json(errorResponse("ORG_IDS_REQUIRED"));

  try {
    await models.Organization.restore({ where: { id: { [Op.in]: ids } } });
    return res.status(200).json(successResponse(null, "Organizations restored successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_BULK_RESTORE_FAILED"));
  }
}

async function forceDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("ORG_ID_REQUIRED"));

  const organization = await models.Organization.findByPk(id, { paranoid: false });
  if (!organization) return res.status(404).json(errorResponse("ORG_NOT_FOUND"));

  try {
    await organization.destroy({ force: true }); // force
    return res.status(200).json(successResponse(null, "Organization deleted successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_DELETE_FAILED"));
  }
}

async function bulkForceDelete(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json(errorResponse("ORG_IDS_REQUIRED"));
  }

  try {
    await models.Organization.destroy({ where: { id: { [Op.in]: ids } }, force: true }); // force
    return res.status(200).json(successResponse(null, "Organizations deleted successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_BULK_DELETE_FAILED"));
  }
}

async function changeStatus(req, res) {
  const { id, status } = req.body;
  if (!id) return res.status(400).json(errorResponse("ORG_ID_REQUIRED"));
  if (status === undefined || status === null || status === "") return res.status(400).json(errorResponse("ORG_STATUS_REQUIRED"));

  const organization = await models.Organization.findByPk(id);
  if (!organization) return res.status(404).json(errorResponse("ORG_NOT_FOUND"));

  try {
    await organization.update({ status });
    return res.status(200).json(successResponse(organization, "Organization status changed successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_UPDATE_FAILED"));
  }
}

export { index, add, edit, softDelete, bulkSoftDelete, restore, bulkRestore, forceDelete, bulkForceDelete, changeStatus };