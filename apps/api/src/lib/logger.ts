import { env } from "../env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const configuredLevel = (env.LOG_LEVEL ?? "info") as LogLevel;
const isProduction = env.NODE_ENV === "production";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[configuredLevel];
}

function formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  if (isProduction) return JSON.stringify(entry);

  const prefix = `[${entry.timestamp.slice(11, 23)}] ${level.toUpperCase().padEnd(5)}`;
  const extra = data ? ` ${JSON.stringify(data)}` : "";
  return `${prefix} ${message}${extra}`;
}

export const logger = {
  debug(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("debug")) console.debug(formatMessage("debug", message, data));
  },
  info(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("info")) console.log(formatMessage("info", message, data));
  },
  warn(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("warn")) console.warn(formatMessage("warn", message, data));
  },
  error(message: string, data?: Record<string, unknown>): void {
    if (shouldLog("error")) console.error(formatMessage("error", message, data));
  },
};
