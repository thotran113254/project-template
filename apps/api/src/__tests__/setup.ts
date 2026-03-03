/**
 * Test setup: set env vars before any module imports them.
 */
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5433/test_db";
process.env["JWT_ACCESS_SECRET"] = "test-access-secret-that-is-at-least-32-chars!!";
process.env["JWT_REFRESH_SECRET"] = "test-refresh-secret-that-is-at-least-32-chars!";
process.env["JWT_ACCESS_EXPIRES_IN"] = "15m";
process.env["JWT_REFRESH_EXPIRES_IN"] = "7d";
process.env["NODE_ENV"] = "test";
process.env["API_PORT"] = "3099";
process.env["API_PREFIX"] = "/api/v1";
process.env["REDIS_HOST"] = "localhost";
process.env["REDIS_PORT"] = "6380";
