import { Router } from "express";
import StudentController from "../controller/StudentController.js";
import { authenticateToken } from "../middleware/AuthMiddleware.js";
import { requirePermission } from "../middleware/PermissionMiddleware.js";
import PermissionCodes from "../security/acl/PermissionCodes.js";

const router = Router();
router.post("/", authenticateToken, requirePermission(PermissionCodes.STUDENTS_CREATE), (req, res, next) => StudentController.create(req, res, next));
router.get("/", authenticateToken, requirePermission(PermissionCodes.STUDENTS_VIEW), (req, res, next) => StudentController.list(req, res, next));
router.get("/:id", authenticateToken, requirePermission(PermissionCodes.STUDENTS_VIEW), (req, res, next) => StudentController.get(req, res, next));
router.patch("/:id", authenticateToken, requirePermission(PermissionCodes.STUDENTS_UPDATE), (req, res, next) => StudentController.update(req, res, next));

export default router;
