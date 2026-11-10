import crypto from "node:crypto";
import models from "../../models/index.js";
import {
  comparePassword,
  signToken,
  errorResponse,
  successResponse,
  getMessageLabel,
  adminAuthValidate,
  hashPassword,
  cacheDel,
  cacheDelByPrefix,
  sendMail,
} from "../../utils/custom.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

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

  const resetToken = crypto.randomBytes(32).toString("hex");
  await user.update({
    reset_token: hashResetToken(resetToken),
    reset_token_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const frontendUrl = String(process.env.FRONTEND_URL || "http://localhost:5009").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/admin/reset-password?token=${resetToken}`;

  // TODO: template store (dabba) se subject/html build — abhi minimal body
  try {
    const sent = await sendMail({
      to: user.email,
      subject: "Reset your LineSe admin password",
      text: `Hi ${user.name || "there"},\n\nReset link (valid 60 min):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n`,
      html: `<p>Hi ${user.name || "there"},</p><p>Reset link (valid 60 min):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`,
    });
    console.log("[forgot-password] mail sent:", {
      email: user.email,
      messageId: sent.messageId,
      previewUrl: sent.previewUrl || null,
      resetUrl,
    });
  } catch (err) {
    console.error("[forgot-password] mail failed:", err?.message || err);
    await user.update({ reset_token: null, reset_token_expires: null });
    return res.status(500).json(errorResponse("AUTH_MAIL_SEND_FAILED"));
  }

  return res.status(200).json(successResponse(null, "AUTH_FORGOT_SENT"));
}

async function resetPassword(req, res) {
  const token = String(req.body?.token || "").trim();
  const password = req.body?.password;
  const confirm = req.body?.confirm;
  const errors = {};

  if (!token) {
    errors.token = getMessageLabel("AUTH_RESET_TOKEN_INVALID");
  }
  if (!password) {
    errors.password = getMessageLabel("USER_PASSWORD_REQUIRED");
  }
  if (!confirm) {
    errors.confirm = getMessageLabel("AUTH_CONFIRM_PASSWORD_REQUIRED");
  } else if (password && confirm !== password) {
    errors.confirm = getMessageLabel("AUTH_PASSWORD_MISMATCH");
  }

  let user = null;
  if (token && !errors.token) {
    user = await models.User.findOne({
      where: { reset_token: hashResetToken(token) },
    });
    if (!user) {
      errors.token = getMessageLabel("AUTH_RESET_TOKEN_INVALID");
    } else if (!user.reset_token_expires || user.reset_token_expires < new Date()) {
      errors.token = getMessageLabel("AUTH_RESET_TOKEN_EXPIRED");
    }
  }

  if (user && Object.keys(errors).length === 0) {
    const result = await adminAuthValidate(user.id);
    if (result.error) {
      errors.token = result.error;
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errorResponse("FORM_INVALID", { errors }));
  }

  await user.update({
    password: await hashPassword(password),
    reset_token: null,
    reset_token_expires: null,
  });

  cacheDel(`admin_auth:${user.id}`);
  cacheDel(`user:${user.id}`);
  cacheDelByPrefix(`auth:${user.id}:`);

  return res.status(200).json(successResponse(null, "AUTH_RESET_SUCCESS"));
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
  resetPassword,
  dashboard,
  adminRegister,
};
