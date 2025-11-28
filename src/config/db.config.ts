import env from "./env.js";

export const dbConfig = {
  type: "postgres" as const,
  url: env.databaseUrl,
  synchronize: false,
  logging: env.nodeEnv !== "test"
};

export default dbConfig;
