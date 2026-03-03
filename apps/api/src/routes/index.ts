import { Hono } from "hono";
import { authRoutes } from "../modules/auth/auth-routes.js";
import { userRoutes } from "../modules/users/user-routes.js";
import { resourceRoutes } from "../modules/resources/resource-routes.js";

const routes = new Hono();

routes.get("/", (c) => {
  return c.json({ message: "API is running", version: "v1" });
});

// Auth routes: /auth/*
routes.route("/auth", authRoutes);

// User management routes: /users/*
routes.route("/users", userRoutes);

// Resource management routes: /resources/*
routes.route("/resources", resourceRoutes);

export { routes };
