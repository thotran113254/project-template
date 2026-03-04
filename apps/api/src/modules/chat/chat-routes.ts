import { Hono } from "hono";
import { createChatSessionSchema, sendMessageSchema } from "@app/shared";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import * as chatService from "./chat-service.js";

export const chatRoutes = new Hono();

chatRoutes.use("*", authMiddleware);

chatRoutes.get("/sessions", async (c) => {
  const user = c.get("user");
  const sessions = await chatService.listSessions(user.sub);
  return c.json({ success: true, data: sessions });
});

chatRoutes.post("/sessions", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = createChatSessionSchema.parse(body);
  const session = await chatService.createSession(user.sub, dto.title);
  return c.json({ success: true, data: session }, 201);
});

chatRoutes.delete("/sessions/:id", async (c) => {
  const user = c.get("user");
  await chatService.deleteSession(c.req.param("id"), user.sub);
  return c.json({ success: true, message: "Session deleted" });
});

chatRoutes.get("/sessions/:id/messages", async (c) => {
  const user = c.get("user");
  const messages = await chatService.getMessages(c.req.param("id"), user.sub);
  return c.json({ success: true, data: messages });
});

chatRoutes.post("/sessions/:id/messages", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const dto = sendMessageSchema.parse(body);
  const messages = await chatService.sendMessage(
    c.req.param("id"),
    user.sub,
    dto.content,
  );
  return c.json({ success: true, data: messages }, 201);
});
