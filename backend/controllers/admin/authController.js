import crypto from "node:crypto";
import models from "../../models/index.js";
import {
  comparePassword,
  signToken,
  errorResponse,
  successResponse,
  getMessageLabel,
  adminAuthValidate,
} from "../../utils/custom.js";

async function adminLogin(req, res) {
  const email = String(req.body?.email || "").trim();
  const password = req.body?.password;
  const errors = {};

  if (!email) {
    errors.email = getMessageLabel("USER_EMAIL_REQUIRED");
  }
  if (!password) {
    errors.password = getMessageLabel("USER_PASSWORD_REQUIRED");
  }

  let user = null;
  if (email && !errors.email) {
    user = await models.User.findOne({ where: { email } });
    if (!user) {
      errors.email = getMessageLabel("AUTH_INVALID_CREDENTIALS");
    }
  }

  if (user && password && !errors.email && !errors.password) {
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      errors.email = getMessageLabel("AUTH_INVALID_CREDENTIALS");
    }
  }

  let authUser = null;
  if (user && Object.keys(errors).length === 0) {
    const result = await adminAuthValidate(user.id);
    if (result.error) {
      errors.email = result.error;
    } else {
      authUser = result.user;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errorResponse("FORM_INVALID", { errors }));
  }

  const token = signToken({ user_id: user.id });
  return res.status(200).json(
    successResponse({ token, user: authUser }, "AUTH_LOGIN_SUCCESS")
  );
}

async function forgotPassword(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const errors = {};

  if (!email) {
    errors.email = getMessageLabel("USER_EMAIL_REQUIRED");
  }

  let user = null;
  if (email && !errors.email) {
    user = await models.User.findOne({ where: { email } });
    if (!user) {
      errors.email = getMessageLabel("AUTH_EMAIL_NOT_FOUND");
    }
  }

  if (user && !errors.email) {
    const result = await adminAuthValidate(user.id);
    if (result.error) {
      errors.email = result.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errorResponse("FORM_INVALID", { errors }));
  }

  // Email template + SMTP baad me; abhi reset token prepare (log only)
  const resetToken = crypto.randomBytes(32).toString("hex");
  console.log("[forgot-password] reset token (email pending):", {
    email: user.email,
    resetToken,
    resetUrl: `/admin/reset-password?token=${resetToken}`,
  });

  return res.status(200).json(successResponse(null, "AUTH_FORGOT_SENT"));
}

async function dashboard(req, res) {
  return res.status(200).json(successResponse(req.authUser));
}

async function adminRegister(req, res) {
  const { name, email, password } = req.body;
  const user = await models.User.create({ name, email, password });
  return res.status(200).json(successResponse(user));
}

export {
  adminLogin,
  forgotPassword,
  dashboard,
  adminRegister,
};
