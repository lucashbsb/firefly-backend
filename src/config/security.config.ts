import env from "./env.js";

const isProduction = env.nodeEnv === "production";

export const securityConfig = {
  jwt: {
    accessExpiry: env.jwtAccessExpiry,
    refreshExpiry: env.jwtRefreshExpiry,
    algorithm: "RS256" as const,
    issuer: "firefly-backend"
  },
  cookies: {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    path: "/",
    domain: isProduction ? env.cookieDomain : undefined,
    accessTokenName: "firefly_access_token",
    refreshTokenName: "firefly_refresh_token"
  },
  bcrypt: {
    rounds: 10
  },
  rateLimits: {
    login: {
      windowMs: 15 * 60 * 1000,
      max: 5
    },
    register: {
      windowMs: 60 * 60 * 1000,
      max: 3
    },
    refresh: {
      windowMs: 15 * 60 * 1000,
      max: 10
    },
    api: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  }
};

export default securityConfig;
