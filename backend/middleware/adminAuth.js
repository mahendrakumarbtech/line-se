import { verifyToken, adminAuthValidate } from "../utils/custom.js";
import { errorResponse } from "../../constants.mjs";

export default async function AdminAuth(req, res, next) {

    try {
        const header = req.headers.authorization;
        if (!header?.startsWith("Bearer ")) {
            return res.status(401).json(errorResponse("AUTH_TOKEN_MISSING"));
        }

        const decoded = verifyToken(header.split(" ")[1]);

        let result = await adminAuthValidate(decoded.user_id);
        if (!result.status){
            return res.status(401).json(result);
        }
        req.authUser = result.data;
        next();
    } catch {
        return res.status(401).json(errorResponse("AUTH_TOKEN_INVALID"));
    }
}