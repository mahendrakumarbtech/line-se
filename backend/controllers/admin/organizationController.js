import { errorResponse, successResponse, getMessageCode } from "../../../constants.mjs";
import models from "../../models/index.js";

async function index(req, res) {
  const { filter = {}, page = 1, limit = 10 } = req.body;
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
      limit: limitNum,
      offset,
    };

    if (filter.trashed) {
      query.paranoid = false;
      where.deleted_at = { [Op.ne]: null };
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

async function bulkDelete(req, res) {
  const { ids } = req.body;
  if (!ids) return res.status(400).json(errorResponse("ORG_IDS_REQUIRED"));

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
  if (!organization || !organization.deleted_at) {
    return res.status(404).json(errorResponse("ORG_NOT_FOUND"));
  }

  try {
    await organization.restore();
    return res.status(200).json(successResponse(organization, "Organization restored successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_UPDATE_FAILED"));
  }
}

async function forceDelete(req, res) {
  const { id } = req.body;
  if (!id) return res.status(400).json(errorResponse("ORG_ID_REQUIRED"));

  const organization = await models.Organization.findByPk(id);
  if (!organization) return res.status(404).json(errorResponse("ORG_NOT_FOUND"));

  try {
    await organization.destroy({ force: true }); // force
    return res.status(200).json(successResponse(null, "Organization deleted successfully"));
  } catch {
    return res.status(500).json(errorResponse("ORG_DELETE_FAILED"));
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

export { index, add, softDelete, bulkDelete, restore, forceDelete, changeStatus };