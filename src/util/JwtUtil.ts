import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import env from "../config/env.js";

const privateKeyPath = path.resolve(process.cwd(), "auth_private.key");
const publicKeyPath = path.resolve(process.cwd(), "auth_public.key");

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
const publicKey = fs.readFileSync(publicKeyPath, "utf8");

export interface TokenPayload {
  userId: string;
  email: string;
}

class JwtService {
  signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: env.jwtAccessExpiry as string,
      issuer: "firefly-backend"
    } as jwt.SignOptions);
  }

  signRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: env.jwtRefreshExpiry as string,
      issuer: "firefly-backend"
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "firefly-backend"
    }) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: "firefly-backend"
    }) as TokenPayload;
  }
}

export default new JwtService();
