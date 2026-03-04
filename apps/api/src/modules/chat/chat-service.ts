import { eq, desc, asc } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { chatSessions, chatMessages } from "../../db/schema/index.js";
import type { ChatSession, ChatMessage } from "@app/shared";

const AI_PLACEHOLDER =
  "I'm your AI Travel Assistant. I can help you find hotels, plan trips, and answer travel questions. This is a placeholder response.";

function toSession(row: typeof chatSessions.$inferSelect): ChatSession {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    createdAt: row.createdAt.toISOString(),
  };
}

function toMessage(row: typeof chatMessages.$inferSelect): ChatMessage {
  return {
    id: row.id,
    sessionId: row.sessionId,
    role: row.role as ChatMessage["role"],
    content: row.content,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listSessions(userId: string): Promise<ChatSession[]> {
  const rows = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.createdAt));
  return rows.map(toSession);
}

export async function createSession(
  userId: string,
  title?: string,
): Promise<ChatSession> {
  const [row] = await db
    .insert(chatSessions)
    .values({ userId, title: title ?? "New Chat" })
    .returning();
  return toSession(row!);
}

export async function deleteSession(
  id: string,
  userId: string,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, id))
    .limit(1);

  if (!existing) throw new HTTPException(404, { message: "Session not found" });
  if (existing.userId !== userId)
    throw new HTTPException(403, { message: "Access denied" });

  await db.delete(chatSessions).where(eq(chatSessions.id, id));
}

export async function getMessages(
  sessionId: string,
  userId: string,
): Promise<ChatMessage[]> {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (!session) throw new HTTPException(404, { message: "Session not found" });
  if (session.userId !== userId)
    throw new HTTPException(403, { message: "Access denied" });

  const rows = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  return rows.map(toMessage);
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  content: string,
): Promise<ChatMessage[]> {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (!session) throw new HTTPException(404, { message: "Session not found" });
  if (session.userId !== userId)
    throw new HTTPException(403, { message: "Access denied" });

  const [userMsg] = await db
    .insert(chatMessages)
    .values({ sessionId, role: "user", content, metadata: {} })
    .returning();

  const [assistantMsg] = await db
    .insert(chatMessages)
    .values({ sessionId, role: "assistant", content: AI_PLACEHOLDER, metadata: {} })
    .returning();

  return [toMessage(userMsg!), toMessage(assistantMsg!)];
}
