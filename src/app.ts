import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler, requestLogger } from './middlewares';

const timeout = (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  next();
};

const createApp = (): Application => {
  const app = express();

  app.use(requestLogger);
  app.use(timeout);
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
