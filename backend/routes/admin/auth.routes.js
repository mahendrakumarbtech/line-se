import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { adminLogin, me } from "../../controllers/admin/authController.js";

const router = Router();
router.post("/login", adminLogin);
router.get("/me", adminAuth, me);
export default router;