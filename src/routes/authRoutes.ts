import { Router } from "express";
import AuthController from "../controller/AuthController.js";
import { loginLimiter, registerLimiter, refreshTokenLimiter } from "../middleware/RateLimitMiddleware.js";

const router = Router();
router.post("/login", loginLimiter, (req, res, next) => AuthController.login(req, res, next));
router.post("/register", registerLimiter, (req, res, next) => AuthController.register(req, res, next));
router.post("/refresh", refreshTokenLimiter, (req, res, next) => AuthController.refresh(req, res, next));

export default router;
