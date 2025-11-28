import { Router } from "express";
import CefrLevelController from "../controller/CefrLevelController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.CEFR_LEVELS_CREATE), (req, res, next) => CefrLevelController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.CEFR_LEVELS_VIEW), (req, res, next) => CefrLevelController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.CEFR_LEVELS_VIEW), (req, res, next) => CefrLevelController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.CEFR_LEVELS_UPDATE), (req, res, next) => CefrLevelController.update(req, res, next));

export default router;
