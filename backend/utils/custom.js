import jwt from "jsonwebtoken";
import models from "../models/index.js";
import { compare } from "bcryptjs";
import { ROLE_TYPE_CODES, errorResponse, successResponse } from "../../constants.mjs";
const CACHE_TTL = 5 * 60 * 1000;

const USER_SENSITIVE_FIELDS = ["password"];


const signToken = (payload) =>
	jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

const verifyToken = (token) =>
	jwt.verify(token, process.env.JWT_SECRET);

const comparePassword = async (password, hashedPassword) => {
	return await compare(password, hashedPassword);
};


const store = new Map();

const cacheGet = (key) => {
	const row = store.get(key);
	if (!row) return null;
	if (row.exp < Date.now()) {
		store.delete(key);
		return null;
	}
	return row.value;
};

const cacheSet = (key, value, ttlMs = 5 * 60 * 1000) => {
	store.set(key, { value, exp: Date.now() + ttlMs });
};

const cacheDel = (key) => store.delete(key);

const cacheDelByPrefix = (prefix) => {
	for (const key of store.keys()) {
		if (key.startsWith(prefix)) store.delete(key);
	}
};

const sanitizeUserColumns = (row) => {
	if (!row) return row;
	const stripOne = (item) => {
		const data = item.toJSON ? item.toJSON() : { ...item };
		USER_SENSITIVE_FIELDS.forEach((f) => delete data[f]);
		return data;
	};
	return Array.isArray(row) ? row.map(stripOne) : stripOne(row);
};

const getUserDetails = async (params) => {
	const { where, attributes, include, orderBy, limit, offset, isSingle } = params;
	const cacheable = isSingle && where?.id && !include;
	const key = cacheable ? `user:${where?.id ?? ""}` : null;

	if (key) {
		const hit = cacheGet(key);
		if (hit) return hit;
	}

	const row = isSingle
		? await models.User.findOne({ where, attributes, include })
		: await models.User.findAll({ where, attributes, include, orderBy, limit, offset });

	const sanitized = sanitizeUserColumns(row);

	if (key && sanitized) cacheSet(key, sanitized, CACHE_TTL);
	return sanitized;
};

const getOrganizationDetails = async (params) => {
	const { where, attributes, include, orderBy, limit, offset, isSingle } = params;
	const cacheable = isSingle && where?.id && !include;
	const key = cacheable ? `organization:${where?.id ?? ""}` : null;

	if (key) {
		const hit = cacheGet(key);
		if (hit) return hit;
	}

	const row = isSingle
		? await models.Organization.findOne({ where, attributes, include })
		: await models.Organization.findAll({ where, attributes, include, orderBy, limit, offset });
	if (key && row) cacheSet(key, row, CACHE_TTL);
	return row;
};
const getRoleDetails = async (params) => {
	const { where, attributes, include, orderBy, limit, offset, isSingle } = params;
	const cacheable = isSingle && where?.id && !include;
	const key = cacheable ? `role:${where?.id ?? ""}` : null;

	if (key) {
		const hit = cacheGet(key);
		if (hit) return hit;
	}

	const row = isSingle
		? await models.Role.findOne({ where, attributes, include })
		: await models.Role.findAll({ where, attributes, include, orderBy, limit, offset });
	if (key && row) cacheSet(key, row, CACHE_TTL);
	return row;
};

const getUserOrganizationDetails = async (params) => {
	const { where, attributes, include, orderBy, limit, offset, isSingle } = params;
	const cacheable = isSingle && where?.id && !include;
	const key = cacheable ? `user_organization:${where?.id ?? ""}` : null;

	if (key) {
		const hit = cacheGet(key);
		if (hit) return hit;
	}

	const row = isSingle
		? await models.UserOrganization.findOne({ where, attributes, include })
		: await models.UserOrganization.findAll({ where, attributes, include, orderBy, limit, offset });
	if (key && row) cacheSet(key, row, CACHE_TTL);
	return row;
};

const getAdminAuthUser = async (userId) => {
	const key = `admin_auth:${userId}`;
	const hit = cacheGet(key);
	if (hit) return hit;

	const user = await getUserDetails({
		where: { id: userId },
		attributes: ["id", "name", "email", "status"],
		include: [{
			model: models.UserRole,
			required: true,
			include: [{
				model: models.Role,
				where: { organization_id: null },
				include: [{ model: models.Permission, attributes: ["slug"] }],
			}],
		}],
		isSingle: true
	});

	if (!user) return null;

	const role = user.UserRole?.Role;
	if (!role) return null;

	const result = {
		id: user.id,
		name: user.name,
		email: user.email,
		status: user.status,
		role: { id: role?.id, name: role?.name ?? null, role_type: role?.role_type ?? null, status: role?.status ?? 0 },
		permissions: (role?.Permissions || []).map((p) => p.slug),
	};
	cacheSet(key, result, CACHE_TTL);
	return result;
};


async function adminAuthValidate(userId) {
    const PLATFORM_ROLES = ROLE_TYPE_CODES
        .filter((r) => r.panel === "admin")
        .map((r) => r.value);

    const adminAuthUser = await getAdminAuthUser(userId);
    if (!adminAuthUser) return errorResponse("AUTH_NOT_PLATFORM_ROLE");

    if (adminAuthUser.role?.status !== 1) {
        return errorResponse("AUTH_ROLE_NOT_ACTIVE");
    }

    if (!PLATFORM_ROLES.includes(adminAuthUser.role?.role_type)) {
        return errorResponse("AUTH_NOT_PLATFORM_ROLE");
    }

	if (adminAuthUser.status !== 1) {
		return errorResponse("AUTH_USER_NOT_ACTIVE");
	}

    return successResponse(adminAuthUser, "Authentication successful");
}

const getUserWithPermissions = async (userId, roleId, organizationId) => {
	const key = `auth:${userId}:${organizationId ?? "platform"}`;
	const hit = cacheGet(key);
	if (hit) return hit;
	const user = await getUserDetails({ where: { id: userId }, attributes: ["id", "name", "email", "status"], isSingle: true });
	if (!user) return null;
	const role = await getRoleDetails({ where: { id: roleId }, attributes: ["id", "name", "role_type", "status"], isSingle: true });
	if (!role) return null;
	if (!organizationId) {
		const result = {
			id: user.id,
			name: user.name,
			email: user.email,
			status: user.status,
			organization: null,
			membership: null,
			role: {
				id: role?.id,
				name: role?.name ?? null,
				role_type: role?.role_type ?? null,
				status: role?.status ?? 0,
			},
			permissions: role?.Permissions?.map((p) => p.slug) ?? [],
		};
		cacheSet(key, result, CACHE_TTL);
		return result;
	}
	const organization = await getOrganizationDetails({ where: { id: organizationId }, isSingle: true });
	if (!organization) return null;
	const membership = await getUserOrganizationDetails(
		{
			where: { user_id: userId, organization_id: organizationId },
			attributes: ["id", "status"],
			include: [{
				model: models.Role,
				include: [{ model: models.Permission, attributes: ["slug"] }]
			}],
			isSingle: true
		}
	);
	if (!membership) return null;
	const result = {
		id: user.id,
		name: user.name,
		email: user.email,
		status: user.status,
		organization: organizationId ? { id: organization.id, name: organization.name, status: organization.status } : null,
		membership: organizationId ? { id: membership.id, status: membership.status } : null,
		role: { id: role?.id, name: role?.name ?? null, role_type: role?.role_type ?? null, status: role?.status ?? 0 },
		permissions: (membership.Role?.Permissions || []).map((p) => p.slug),
	};
	cacheSet(key, result, CACHE_TTL);
	return result;
};



export {
	signToken,
	verifyToken,
	comparePassword,
	cacheGet,
	cacheSet,
	cacheDel,
	cacheDelByPrefix,
	getAdminAuthUser,
	adminAuthValidate,
	getUserWithPermissions,
}