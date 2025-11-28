import { Router } from "express";
import RoleController from "../controller/RoleController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.ROLES_CREATE), (req, res, next) => RoleController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.ROLES_VIEW), (req, res, next) => RoleController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.ROLES_VIEW), (req, res, next) => RoleController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.ROLES_UPDATE), (req, res, next) => RoleController.update(req, res, next));

export default router;
