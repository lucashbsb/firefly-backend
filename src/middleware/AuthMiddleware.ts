import { NextFunction, Request, Response } from "express";
import AppError from "../exception/AppError.js";
import jwtService from "../util/JwtUtil.js";
import securityConfig from "../config/security.config.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticateToken = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies[securityConfig.cookies.accessTokenName];
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    
    const token = cookieToken || headerToken;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = jwtService.verifyAccessToken(token);
    const authReq = req as AuthenticatedRequest;
    authReq.userId = payload.userId;
    authReq.userEmail = payload.email;

    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      next(new AppError("Token expired", 401));
    } else if (error instanceof Error && error.name === "JsonWebTokenError") {
      next(new AppError("Invalid token", 401));
    } else {
      next(error);
    }
  }
};
