import { Router } from "express";
import PermissionController from "../controller/PermissionController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.PERMISSIONS_CREATE), (req, res, next) => PermissionController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.PERMISSIONS_VIEW), (req, res, next) => PermissionController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.PERMISSIONS_VIEW), (req, res, next) => PermissionController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.PERMISSIONS_UPDATE), (req, res, next) => PermissionController.update(req, res, next));

export default router;
