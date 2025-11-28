import { NextFunction, Request, Response } from "express";
import AuthService from "../service/AuthService.js";
import { loginSchema, registerSchema, refreshTokenSchema } from "../validation/auth/auth.schema.js";
import securityConfig from "../config/security.config.js";
import { setAccessTokenCookie, setRefreshTokenCookie } from "../util/CookieHelper.js";

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = loginSchema.parse(req.body);
      const result = await AuthService.login(payload);
      
      setAccessTokenCookie(res, result.accessToken);
      setRefreshTokenCookie(res, result.refreshToken);

      res.json({ user: result.user });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = registerSchema.parse(req.body);
      const result = await AuthService.register(payload);
      
      setAccessTokenCookie(res, result.accessToken);
      setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json({ user: result.user });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies[securityConfig.cookies.refreshTokenName];
      if (!refreshToken) {
        throw new Error("Refresh token not found");
      }

      const result = await AuthService.refreshToken({ refreshToken });
      
      setAccessTokenCookie(res, result.accessToken);
      setRefreshTokenCookie(res, result.refreshToken);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
