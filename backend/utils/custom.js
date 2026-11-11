import { AsyncLocalStorage } from "node:async_hooks";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import models from "../models/index.js";
import { compare, hash } from "bcryptjs";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import {
	ROLE_TYPE_CODES,
	getRoleType,
	MESSAGE_CODES,
	getMessageCode,
	getMessageLabel as baseGetMessageLabel,
	errorResponse as baseErrorResponse,
	successResponse as baseSuccessResponse,
	ADMIN_PERMISSIONS,
	canAccess,
	canAccessAny,
	canAccessAll,
	LIMIT_PER_PAGE,
	APP_LANGUAGES,
	STATUS_OPTIONS,
	ORGANIZATION_TYPE_CODES,
	findLabel,
	getExportType,
	EXPORT_MAX_ROWS,
	slugify,
} from "../../constants.mjs";

const requestLang = new AsyncLocalStorage();
const SUPPORTED_LANGS = new Set(APP_LANGUAGES.map((l) => l.key));

export function resolveLang(raw) {
	const code = String(raw || "en").split(",")[0].trim().toLowerCase();
	return SUPPORTED_LANGS.has(code) ? code : "en";
}

export function getRequestLang() {
	return requestLang.getStore() || "en";
}

export function runWithLang(lang, fn) {
	return requestLang.run(resolveLang(lang), fn);
}

export function getMessageLabel(key, lang) {
	return baseGetMessageLabel(key, lang || getRequestLang());
}

export function errorResponse(key, data, lang) {
	return baseErrorResponse(key, data, lang || getRequestLang());
}

export function successResponse(data, keyOrMessage, lang) {
	return baseSuccessResponse(data, keyOrMessage, lang || getRequestLang());
}

const CACHE_TTL = 5 * 60 * 1000;

const USER_SENSITIVE_FIELDS = ["password", "reset_token", "reset_token_expires"];

const hashPassword = async (password) => hash(password, 10);
const verifyPassword = async (password, hashedPassword) => compare(password, hashedPassword);

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


/**
 * Platform admin auth checks (common for login / forgot / middleware).
 * Success: { user }
 * Fail: { error: label, key } — caller maps into field errors or errorResponse(key)
 */
async function adminAuthValidate(userId) {
	const PLATFORM_ROLES = ROLE_TYPE_CODES
		.filter((r) => r.panel === "admin")
		.map((r) => r.value);

	const fail = (key) => ({ error: getMessageLabel(key), key });

	const adminAuthUser = await getAdminAuthUser(userId);
	if (!adminAuthUser) return fail("AUTH_NOT_PLATFORM_ROLE");

	if (adminAuthUser.role?.status !== 1) {
		return fail("AUTH_ROLE_NOT_ACTIVE");
	}

	if (!PLATFORM_ROLES.includes(adminAuthUser.role?.role_type)) {
		return fail("AUTH_NOT_PLATFORM_ROLE");
	}

	if (adminAuthUser.status !== 1) {
		return fail("AUTH_USER_NOT_ACTIVE");
	}

	return { user: adminAuthUser };
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

let mailTransporterPromise = null;

function hasSmtpConfig() {
	return Boolean(process.env.MAIL_HOST && process.env.MAIL_FROM);
}

async function createMailTransporter() {
	if (hasSmtpConfig()) {
		return nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: Number(process.env.MAIL_PORT || 587),
			secure: String(process.env.MAIL_SECURE || "false") === "true",
			auth:
				process.env.MAIL_USER && process.env.MAIL_PASS
					? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
					: undefined,
		});
	}

	// Dev fallback jab SMTP set na ho — Ethereal preview URL log me aati hai
	const testAccount = await nodemailer.createTestAccount();
	console.log("[mail] SMTP missing — using Ethereal test account:", testAccount.user);
	return nodemailer.createTransport({
		host: testAccount.smtp.host,
		port: testAccount.smtp.port,
		secure: testAccount.smtp.secure,
		auth: { user: testAccount.user, pass: testAccount.pass },
	});
}

async function getMailTransporter() {
	if (!mailTransporterPromise) {
		mailTransporterPromise = createMailTransporter();
	}
	return mailTransporterPromise;
}

/** Send mail. Template body controller / future template store se aayega. */
async function sendMail({ to, subject, html, text }) {
	const transporter = await getMailTransporter();
	const info = await transporter.sendMail({
		from: process.env.MAIL_FROM || '"LineSe" <noreply@linese.local>',
		to,
		subject,
		html,
		text: text || String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
	});

	const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
	if (previewUrl) console.log("[mail] Ethereal preview:", previewUrl);

	return { messageId: info.messageId, previewUrl };
}

// ---------- export (csv / excel / pdf) ----------
const csvEscape = (v) => {
	const s = String(v ?? "");
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Bounded page / limit from request body. */
const getPagination = ({ page, limit } = {}, maxLimit = 100) => {
	const safePage = Math.max(1, parseInt(page, 10) || 1);
	const safeLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || LIMIT_PER_PAGE));
	return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
};

function writePdf(res, title, labels, rows) {
	const doc = new PDFDocument({ size: "A4", layout: labels.length > 5 ? "landscape" : "portrait", margin: 30 });
	doc.pipe(res);

	const left = doc.page.margins.left;
	const width = doc.page.width - left - doc.page.margins.right;
	const colWidth = width / labels.length;
	const rowHeight = 20;

	const drawRow = (cells, isHeader = false) => {
		if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
			doc.addPage();
			drawRow(labels, true);
		}
		const y = doc.y;
		if (isHeader) doc.rect(left, y, width, rowHeight).fill("#f0f0ff");
		doc.fillColor(isHeader ? "#566a7f" : "#333333").font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(9);
		cells.forEach((cell, i) => {
			doc.text(String(cell), left + i * colWidth + 4, y + 6, {
				width: colWidth - 8,
				lineBreak: false,
				ellipsis: true,
			});
		});
		doc.moveTo(left, y + rowHeight).lineTo(left + width, y + rowHeight).strokeColor("#e7e7ff").stroke();
		doc.x = left;
		doc.y = y + rowHeight;
	};

	doc.font("Helvetica-Bold").fontSize(14).fillColor("#566a7f").text(title);
	doc.moveDown(0.5);
	drawRow(labels, true);
	rows.forEach((r) => drawRow(r));
	doc.end();
}

/**
 * One exporter for every list.
 * headers: [{ key, label, value?(row, index) }]  — value() for computed cells (sr no, labels, dates)
 * type: EXPORT_TYPE_CODES key (CSV | EXCEL | PDF), default CSV
 */
async function sendExport(res, { headers, data, filename = "export", type }) {
	const format = getExportType(type) || getExportType("CSV");
	const labels = headers.map((h) => h.label || h.key);
	const rows = (data || []).map((row, i) => headers.map((h) => (h.value ? h.value(row, i) : row[h.key]) ?? ""));
	const name = String(filename).replace(/[^\w.-]+/g, "_");

	res.setHeader("Content-Type", format.mime);
	res.setHeader("Content-Disposition", `attachment; filename="${name}.${format.value}"`);
	res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

	if (format.key === "EXCEL") {
		const workbook = new ExcelJS.Workbook();
		const sheet = workbook.addWorksheet(name.slice(0, 31));
		sheet.columns = labels.map((header) => ({ header, width: Math.max(14, header.length + 4) }));
		sheet.getRow(1).font = { bold: true };
		sheet.addRows(rows);
		await workbook.xlsx.write(res);
		return res.end();
	}

	if (format.key === "PDF") return writePdf(res, filename, labels, rows);

	const csv = [labels, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
	return res.send(`\uFEFF${csv}`);
}

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "");

export {
	// constants re-export
	STATUS_OPTIONS,
	ORGANIZATION_TYPE_CODES,
	findLabel,
	slugify,
	EXPORT_MAX_ROWS,
	getPagination,
	sendExport,
	formatDateTime,
	ROLE_TYPE_CODES,
	getRoleType,
	MESSAGE_CODES,
	getMessageCode,
	ADMIN_PERMISSIONS,
	canAccess,
	canAccessAny,
	canAccessAll,
	LIMIT_PER_PAGE,
	APP_LANGUAGES,
	// helpers
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
	hashPassword,
	verifyPassword,
	USER_SENSITIVE_FIELDS,
	sendMail,
	hasSmtpConfig,
}