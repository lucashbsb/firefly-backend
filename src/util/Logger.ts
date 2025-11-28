import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import env from "../config/env.js";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  if (stack) {
    msg += `\n${stack}`;
  }
  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }
  return msg;
});

const fileRotateTransport = new DailyRotateFile({
  filename: "var/logs/application-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "14d",
  format: combine(timestamp(), errors({ stack: true }), json())
});

const errorRotateTransport = new DailyRotateFile({
  level: "error",
  filename: "var/logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxSize: "20m",
  maxFiles: "30d",
  format: combine(timestamp(), errors({ stack: true }), json())
});

const logger = winston.createLogger({
  level: env.nodeEnv === "production" ? "info" : "debug",
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        consoleFormat
      )
    }),
    fileRotateTransport,
    errorRotateTransport
  ]
});

export default logger;
