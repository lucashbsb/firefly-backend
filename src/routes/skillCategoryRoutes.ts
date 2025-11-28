import { Router } from "express";
import SkillCategoryController from "../controller/SkillCategoryController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.SKILL_CATEGORIES_CREATE), (req, res, next) => SkillCategoryController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.SKILL_CATEGORIES_VIEW), (req, res, next) => SkillCategoryController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.SKILL_CATEGORIES_VIEW), (req, res, next) => SkillCategoryController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.SKILL_CATEGORIES_UPDATE), (req, res, next) => SkillCategoryController.update(req, res, next));

export default router;
