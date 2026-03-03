import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { ApiResponse } from "@app/shared";
import { logger } from "../lib/logger.js";

/**
 * Global error handler middleware for Hono.
 * Catches all errors and formats them as ApiResponse.
 */
export async function errorHandler(err: Error, c: Context): Promise<Response> {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".") || "root";
      if (!details[path]) {
        details[path] = [];
      }
      details[path].push(issue.message);
    }

    const body: ApiResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details,
      },
    };

    return c.json(body, 422);
  }

  // Handle Hono HTTP exceptions
  if (err instanceof HTTPException) {
    const body: ApiResponse = {
      success: false,
      error: {
        code: `HTTP_${err.status}`,
        message: err.message,
      },
    };

    return c.json(body, err.status);
  }

  // Handle Postgres unique constraint violations
  const pgErr = err as { code?: string; constraint_name?: string };
  if (pgErr.code === "23505") {
    const body: ApiResponse = {
      success: false,
      error: {
        code: "CONFLICT",
        message: "A record with this value already exists",
      },
    };
    return c.json(body, 409);
  }

  // Handle Postgres invalid UUID format
  if (pgErr.code === "22P02") {
    const body: ApiResponse = {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid ID format",
      },
    };
    return c.json(body, 400);
  }

  // Log unexpected errors
  logger.error("Unhandled error", { error: err.message, stack: err.stack });

  // Generic internal server error
  const body: ApiResponse = {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env["NODE_ENV"] === "production"
          ? "An internal server error occurred"
          : err.message,
    },
  };

  return c.json(body, 500);
}

/**
 * Not found handler for unmatched routes.
 */
export async function notFoundHandler(c: Context): Promise<Response> {
  const body: ApiResponse = {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
  };

  return c.json(body, 404);
}
