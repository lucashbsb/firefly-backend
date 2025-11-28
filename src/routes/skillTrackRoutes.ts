import { Router } from "express";
import SkillTrackController from "../controller/SkillTrackController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.SKILL_TRACKS_CREATE), (req, res, next) => SkillTrackController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.SKILL_TRACKS_VIEW), (req, res, next) => SkillTrackController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.SKILL_TRACKS_VIEW), (req, res, next) => SkillTrackController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.SKILL_TRACKS_UPDATE), (req, res, next) => SkillTrackController.update(req, res, next));

export default router;
