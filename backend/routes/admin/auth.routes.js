import { Router } from "express";
import AdminAuth from "../../middleware/adminAuth.js";
import { adminLogin, me } from "../../controllers/admin/authController.js";

const router = Router();
router.post("/login", adminLogin);
router.get("/me", AdminAuth, me);
export default router;