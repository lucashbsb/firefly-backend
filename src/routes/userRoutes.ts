import { Router } from "express";
import UserController from "../controller/UserController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.USERS_CREATE), (req, res, next) => UserController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.USERS_VIEW), (req, res, next) => UserController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.USERS_VIEW), (req, res, next) => UserController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.USERS_UPDATE), (req, res, next) => UserController.update(req, res, next));

export default router;
