
import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { adminLogin, me } from "../controllers/admin/authController.js";
import { adminPermission } from "../middleware/adminPermission.js";
import { index, add, edit, softDelete, bulkDelete, restore, forceDelete, changeStatus } from "../controllers/admin/organizationController.js";

const router = Router();

router.use(adminAuth).exclude(adminLogin);
router.post("/login", adminLogin);
router.post("/register", adminRegister);
router.post("/logout", adminLogout);


router.post("/me", me);

router.post("/index",  adminPermission("organization.view"), index);
router.post("/add", adminPermission("organization.create"), add);
router.post("/edit", adminPermission("organization.update"), edit);
router.post("/delete", adminPermission("organization.delete"), softDelete);
router.post("/bulk-delete", adminPermission("organization.delete"), bulkDelete);
router.post("/restore", adminPermission("organization.force-delete"), restore);
router.post("/force-delete", adminPermission("organization.force-delete"), forceDelete);
router.post("/change-status", adminPermission("organization.change-status"), changeStatus);


export default router;