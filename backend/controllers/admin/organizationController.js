import { errorResponse, successResponse, getMessageCode } from "../../../constants.mjs";
import models from "../../models/index.js";

async function index(req, res) {
    const { filter = {}, page = 1, limit = 10 } = req.body;
    const offset = (page - 1) * limit;
    try {
        const { count, rows } = await models.Organization.findAndCountAll({
            where: {
                status: 1
            },
            order: [['created_at', 'DESC']],
            limit,
            offset
        });
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

export { index, add };