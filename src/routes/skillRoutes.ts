import { Router } from "express";
import SkillController from "../controller/SkillController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.SKILLS_CREATE), (req, res, next) => SkillController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.SKILLS_VIEW), (req, res, next) => SkillController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.SKILLS_VIEW), (req, res, next) => SkillController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.SKILLS_UPDATE), (req, res, next) => SkillController.update(req, res, next));

export default router;
