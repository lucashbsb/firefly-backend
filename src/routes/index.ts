import { Router } from "express";
import authRoutes from "./authRoutes.js";
import cefrLevelRoutes from "./cefrLevelRoutes.js";
import permissionRoutes from "./permissionRoutes.js";
import roleRoutes from "./roleRoutes.js";
import skillCategoryRoutes from "./skillCategoryRoutes.js";
import skillRoutes from "./skillRoutes.js";
import skillTrackRoutes from "./skillTrackRoutes.js";
import studentRoutes from "./studentRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();
router.use("/auth", authRoutes);
router.use("/cefr-levels", cefrLevelRoutes);
router.use("/permissions", permissionRoutes);
router.use("/roles", roleRoutes);
router.use("/skill-categories", skillCategoryRoutes);
router.use("/skill-tracks", skillTrackRoutes);
router.use("/skills", skillRoutes);
router.use("/students", studentRoutes);
router.use("/users", userRoutes);

export default router;
