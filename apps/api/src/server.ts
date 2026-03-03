import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { env } from "./env.js";
import { queryClient } from "./db/connection.js";
import { connectRedis, closeRedis } from "./lib/redis-client.js";
import { logger } from "./lib/logger.js";

const port = env.API_PORT;

logger.info("Starting server", { port, env: env.NODE_ENV, prefix: env.API_PREFIX });

// Connect Redis (non-blocking — falls back to in-memory if unavailable)
await connectRedis();

const server = serve({
  fetch: app.fetch,
  port,
});

logger.info("Server running", { url: `http://localhost:${port}`, health: `http://localhost:${port}/health` });

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info("Shutting down", { signal });
  server.close();
  await closeRedis();
  await queryClient.end();
  logger.info("Server stopped");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
