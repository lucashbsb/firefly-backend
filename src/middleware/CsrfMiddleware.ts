import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const csrfTokens = new Map<string, { token: string; expiresAt: Date }>();

const generateToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  const sessionId = req.cookies.firefly_access_token || crypto.randomUUID();
  csrfTokens.set(sessionId, { token, expiresAt });
  
  res.setHeader("X-CSRF-Token", token);
  next();
};

export const verifyCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }

  const sessionId = req.cookies.firefly_access_token;
  const providedToken = req.headers["x-csrf-token"] as string;

  if (!sessionId || !providedToken) {
    return res.status(403).json({ message: "CSRF token missing" });
  }

  const stored = csrfTokens.get(sessionId);
  if (!stored || stored.token !== providedToken || stored.expiresAt < new Date()) {
    csrfTokens.delete(sessionId);
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
};

export const cleanupExpiredTokens = () => {
  const now = new Date();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
    }
  }
};

setInterval(cleanupExpiredTokens, 15 * 60 * 1000);
