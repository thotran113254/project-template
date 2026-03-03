export const API_PREFIX = "/api/v1";

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    ME: "/auth/me",
  },
  USERS: {
    BASE: "/users",
    BY_ID: "/users/:id",
  },
  RESOURCES: {
    BASE: "/resources",
    BY_ID: "/resources/:id",
    ACTION: "/resources/:id/action",
  },
  HEALTH: "/health",
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
