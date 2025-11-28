import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: process.env.NODE_ENV === "test" ? path.resolve(process.cwd(), ".env.test") : undefined });

const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://localhost:5432/firefly",
  openAiKey: process.env.OPENAI_API_KEY ?? "",
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY ?? "15m",
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY ?? "7d",
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
  cookieDomain: process.env.COOKIE_DOMAIN
};

export default env;
