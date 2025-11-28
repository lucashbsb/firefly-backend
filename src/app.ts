import cors from "cors";
import express from "express";
import helmet from "helmet";
import expressWinston from "express-winston";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import errorHandler from "./exception/ErrorHandler.js";
import notFound from "./exception/NotFoundHandler.js";
import { apiLimiter } from "./middleware/RateLimitMiddleware.js";
import { generateCsrfToken, verifyCsrfToken } from "./security/csrf/CsrfProtection.js";
import corsConfig from "./config/cors.config.js";
import env from "./config/env.js";
import logger from "./util/Logger.js";

const app = express();

app.use(cors(corsConfig));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: false,
  msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  expressFormat: false,
  colorize: false
}));
app.use(generateCsrfToken);
app.use(verifyCsrfToken);
app.use("/api", apiLimiter, routes);
app.use(notFound);
app.use(errorHandler);

export default app;
