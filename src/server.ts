import createApp from './app';
import { config } from './config';
import { logger } from './lib/logger';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Shutdown requested');

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }

    logger.info('Shutdown complete');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});
