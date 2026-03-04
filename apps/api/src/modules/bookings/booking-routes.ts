import { Hono } from "hono";
import { createBookingSchema, updateBookingSchema } from "@app/shared";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import * as bookingService from "./booking-service.js";

export const bookingRoutes = new Hono();

bookingRoutes.use("*", authMiddleware);

bookingRoutes.get("/", async (c) => {
  const user = c.get("user");
  const result = await bookingService.listBookings(user.sub, user.role);
  return c.json({ success: true, data: result });
});

bookingRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const booking = await bookingService.getBookingById(c.req.param("id"), user.sub, user.role);
  return c.json({ success: true, data: booking });
});

bookingRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = createBookingSchema.parse(body);
  const booking = await bookingService.createBooking(dto, user.sub);
  return c.json({ success: true, data: booking }, 201);
});

bookingRoutes.patch("/:id", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = updateBookingSchema.parse(body);
  const booking = await bookingService.updateBooking(c.req.param("id"), dto, user.sub, user.role);
  return c.json({ success: true, data: booking });
});

bookingRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  await bookingService.deleteBooking(c.req.param("id"), user.sub, user.role);
  return c.json({ success: true, message: "Booking deleted" });
});
