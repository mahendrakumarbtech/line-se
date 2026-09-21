import models from "../../models/index.js";
import { adminAuthValidate, comparePassword, signToken } from "../../utils/custom.js";
import { errorResponse, successResponse } from "../../../constants.mjs";


async function adminLogin(req, res) {
    const { email, password } = req.body;


    const user = await models.User.findOne({ where: { email } });
    if (!user) return res.status(401).json(errorResponse("AUTH_USER_NOT_FOUND"));
    if (user.status !== 1) return res.status(401).json(errorResponse("AUTH_USER_NOT_ACTIVE"));

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) return res.status(401).json(errorResponse("AUTH_INVALID_PASSWORD"));

    const validated = await adminAuthValidate(user.id);
    if (!validated.status) return res.status(401).json(validated);

    const token = signToken({ user_id: user.id });
    return res.status(200).json(successResponse({ token, user: validated.data }, "Login successful"));
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
    dashboard,
    adminRegister
};