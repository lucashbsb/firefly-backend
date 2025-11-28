import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import AppError from "./AppError.js";
import logger from "../util/Logger.js";

const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    logger.warn("Validation error occurred", { issues: err.flatten() });
    return res.status(422).json({ message: "Validation failed", issues: err.flatten() });
  }
  if (err instanceof AppError) {
    logger.warn(`Application error: ${err.message}`, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({ message: err.message });
  }
  
  logger.error("Unexpected error occurred", {
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });
  
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(500).json({ message: "Unexpected error" });
};

export default errorHandler;
