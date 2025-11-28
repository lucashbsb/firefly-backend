import rateLimit from "express-rate-limit";
import rateLimitConfig from "../config/rate-limit.config.js";

export const loginLimiter = rateLimit({
  windowMs: rateLimitConfig.login.windowMs,
  max: rateLimitConfig.login.max,
  message: "Too many login attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

export const registerLimiter = rateLimit({
  windowMs: rateLimitConfig.register.windowMs,
  max: rateLimitConfig.register.max,
  message: "Too many registration attempts, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false
});

export const refreshTokenLimiter = rateLimit({
  windowMs: rateLimitConfig.refresh.windowMs,
  max: rateLimitConfig.refresh.max,
  message: "Too many token refresh attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: rateLimitConfig.api.windowMs,
  max: rateLimitConfig.api.max,
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false
});
