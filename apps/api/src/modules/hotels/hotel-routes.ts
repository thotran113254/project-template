import { Hono } from "hono";
import {
  createHotelSchema,
  updateHotelSchema,
  createHotelRoomSchema,
  updateHotelRoomSchema,
  hotelQuerySchema,
} from "@app/shared";
import { authMiddleware, adminMiddleware } from "../../middleware/auth-middleware.js";
import * as hotelService from "./hotel-service.js";

export const hotelRoutes = new Hono();

hotelRoutes.use("*", authMiddleware);

hotelRoutes.get("/", async (c) => {
  const query = hotelQuerySchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit"),
    search: c.req.query("search"),
    location: c.req.query("location"),
    minStars: c.req.query("minStars"),
    maxPrice: c.req.query("maxPrice"),
  });
  const result = await hotelService.listHotels(query);
  return c.json({ success: true, data: result.data, meta: result.meta });
});

hotelRoutes.get("/slug/:slug", async (c) => {
  const hotel = await hotelService.getHotelBySlug(c.req.param("slug"));
  return c.json({ success: true, data: hotel });
});

hotelRoutes.get("/:id", async (c) => {
  const hotel = await hotelService.getHotelById(c.req.param("id"));
  return c.json({ success: true, data: hotel });
});

hotelRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const dto = createHotelSchema.parse(body);
  const hotel = await hotelService.createHotel(dto);
  return c.json({ success: true, data: hotel }, 201);
});

hotelRoutes.patch("/:id", async (c) => {
  const body = await c.req.json();
  const dto = updateHotelSchema.parse(body);
  const hotel = await hotelService.updateHotel(c.req.param("id"), dto);
  return c.json({ success: true, data: hotel });
});

hotelRoutes.delete("/:id", adminMiddleware, async (c) => {
  await hotelService.deleteHotel(c.req.param("id"));
  return c.json({ success: true, message: "Hotel deleted" });
});

hotelRoutes.get("/:id/rooms", async (c) => {
  const rooms = await hotelService.listRooms(c.req.param("id"));
  return c.json({ success: true, data: rooms });
});

hotelRoutes.post("/:id/rooms", async (c) => {
  const body = await c.req.json();
  const dto = createHotelRoomSchema.parse({ ...body, hotelId: c.req.param("id") });
  const room = await hotelService.createRoom(dto);
  return c.json({ success: true, data: room }, 201);
});

hotelRoutes.patch("/rooms/:roomId", async (c) => {
  const body = await c.req.json();
  const dto = updateHotelRoomSchema.parse(body);
  const room = await hotelService.updateRoom(c.req.param("roomId"), dto);
  return c.json({ success: true, data: room });
});

hotelRoutes.delete("/rooms/:roomId", adminMiddleware, async (c) => {
  await hotelService.deleteRoom(c.req.param("roomId"));
  return c.json({ success: true, message: "Room deleted" });
});
