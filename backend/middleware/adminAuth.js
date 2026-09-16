import { verifyToken, getAdminAuthUser } from "../utils/custom.js";
import { ROLE_TYPE_CODES, errorResponse } from "../../constants.mjs";

const PLATFORM_ROLES = ROLE_TYPE_CODES.filter((item) => item.panel === "admin").map((item) => item.value);
export default async function AdminAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json(errorResponse("AUTH_TOKEN_MISSING"));
        }

        const decoded = verifyToken(header.split(" ")[1]);

        let userDetails = await getAdminAuthUser(decoded.user_id);
        if (!userDetails) {
            return res.status(401).json(errorResponse("AUTH_USER_NOT_FOUND"));
        }
        if (!PLATFORM_ROLES.includes(userDetails.role?.role_type)) {
            return res.status(401).json(errorResponse("AUTH_NOT_PLATFORM_ROLE"));
        }
        if (userDetails.role?.status !== 1) {
            return res.status(401).json(errorResponse("AUTH_ROLE_INACTIVE"));
        }
        if (userDetails.status !== 1) {
            return res.status(401).json(errorResponse("AUTH_ACCOUNT_INACTIVE"));
        }


        req.authUser = userDetails;
        next();
    } catch {
        return res.status(401).json(errorResponse("AUTH_TOKEN_INVALID"));
    }
}