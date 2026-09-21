
import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { adminPermission } from "../middleware/adminPermission.js";
import { resourceRoute } from "../utils/routeHelper.js";
import { adminLogin, adminRegister, dashboard } from "../controllers/admin/authController.js";
import * as OrganizationController from "../controllers/admin/organizationController.js";

const router = Router();

router.post("/login", adminLogin);
router.post("/register", adminRegister);

router.use(adminAuth);

router.post("/dashboard", adminPermission("dashboard.view"), dashboard);

resourceRoute(router, { prefix: "organizations", permission: "organization", controller: OrganizationController });
// resourceRoute(router, { prefix: "users", permission: "user", controller: UserController });


export default router;