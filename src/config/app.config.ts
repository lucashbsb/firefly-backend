import env from "./env.js";

export const appConfig = {
  name: "firefly-backend",
  version: "1.0.0",
  nodeEnv: env.nodeEnv,
  port: env.port,
  isDevelopment: env.nodeEnv === "development",
  isProduction: env.nodeEnv === "production",
  isTest: env.nodeEnv === "test"
};

export default appConfig;
