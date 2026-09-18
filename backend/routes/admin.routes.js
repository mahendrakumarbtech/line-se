
import { Router } from "express";
import { adminAuth } from "../../middleware/adminAuth.js";
import { adminLogin, me } from "../../controllers/admin/authController.js";

const router = Router();
router.post("/login", adminLogin);




router.get("/me", adminAuth, me);
router.post("/list", adminPermission("organization.view"), list);
router.post("/add", adminPermission("organization.create"), create);
router.post("/edit", adminPermission("organization.update"), edit);
router.post("/delete", adminPermission("organization.delete"), softDelete);
router.post("/restore", adminPermission("organization.restore"), restore);
router.post("/force-delete", adminPermission("organization.force-delete"), forceDelete);
router.post("/bulk-delete", adminPermission("organization.bulk-delete"), bulkDelete);
router.post("/change-status", adminPermission("organization.change-status"), changeStatus);


export default router;