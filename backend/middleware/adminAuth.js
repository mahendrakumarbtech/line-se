import { verifyToken, adminAuthValidate, errorResponse } from "../utils/custom.js";

async function adminAuth(req, res, next) {

    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json(errorResponse("AUTH_TOKEN_MISSING"));
        }

        const decoded = verifyToken(header.split(" ")[1]);

        const result = await adminAuthValidate(decoded.user_id);
        if (result.error) {
            return res.status(401).json(errorResponse(result.key));
        }
        req.authUser = result.user;
        next();
    } catch {
        return res.status(401).json(errorResponse("AUTH_TOKEN_INVALID"));
    }
}

export { adminAuth };
