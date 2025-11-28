import "reflect-metadata";
import app from "./app";
import env from "./config/env";
import { initializeDataSource } from "./infrastructure/db/DataSource";
import logger from "./util/Logger";

const start = async () => {
  await initializeDataSource();
  app.listen(env.port, () => {
    logger.info(`Server started successfully on port ${env.port}`);
  });
};

start().catch(error => {
  logger.error("Failed to start server", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
  process.exit(1);
});
