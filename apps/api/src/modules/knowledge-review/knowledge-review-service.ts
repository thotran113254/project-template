import { eq, and, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketKnowledgeUpdates, markets } from "../../db/schema/index.js";

export async function listPendingReviews() {
  return db
    .select({
      id: marketKnowledgeUpdates.id,
      marketId: marketKnowledgeUpdates.marketId,
      marketName: markets.name,
      aspect: marketKnowledgeUpdates.aspect,
      knowledge: marketKnowledgeUpdates.knowledge,
      status: marketKnowledgeUpdates.status,
      createdBy: marketKnowledgeUpdates.createdBy,
      reviewedBy: marketKnowledgeUpdates.reviewedBy,
      reviewedAt: marketKnowledgeUpdates.reviewedAt,
      reviewNotes: marketKnowledgeUpdates.reviewNotes,
      aiVisible: marketKnowledgeUpdates.aiVisible,
      createdAt: marketKnowledgeUpdates.createdAt,
      updatedAt: marketKnowledgeUpdates.updatedAt,
    })
    .from(marketKnowledgeUpdates)
    .innerJoin(markets, eq(marketKnowledgeUpdates.marketId, markets.id))
    .where(eq(marketKnowledgeUpdates.status, "pending_review"))
    .orderBy(marketKnowledgeUpdates.createdAt);
}

export async function listAllForReview(status?: string) {
  const base = db
    .select({
      id: marketKnowledgeUpdates.id,
      marketId: marketKnowledgeUpdates.marketId,
      marketName: markets.name,
      aspect: marketKnowledgeUpdates.aspect,
      knowledge: marketKnowledgeUpdates.knowledge,
      status: marketKnowledgeUpdates.status,
      createdBy: marketKnowledgeUpdates.createdBy,
      reviewedBy: marketKnowledgeUpdates.reviewedBy,
      reviewedAt: marketKnowledgeUpdates.reviewedAt,
      reviewNotes: marketKnowledgeUpdates.reviewNotes,
      aiVisible: marketKnowledgeUpdates.aiVisible,
      createdAt: marketKnowledgeUpdates.createdAt,
      updatedAt: marketKnowledgeUpdates.updatedAt,
    })
    .from(marketKnowledgeUpdates)
    .innerJoin(markets, eq(marketKnowledgeUpdates.marketId, markets.id));

  if (status) {
    return base.where(eq(marketKnowledgeUpdates.status, status))
      .orderBy(marketKnowledgeUpdates.createdAt);
  }
  return base.orderBy(marketKnowledgeUpdates.createdAt);
}

export async function listMySubmissions(userId: string) {
  return db
    .select({
      id: marketKnowledgeUpdates.id,
      marketId: marketKnowledgeUpdates.marketId,
      marketName: markets.name,
      aspect: marketKnowledgeUpdates.aspect,
      knowledge: marketKnowledgeUpdates.knowledge,
      status: marketKnowledgeUpdates.status,
      reviewNotes: marketKnowledgeUpdates.reviewNotes,
      createdAt: marketKnowledgeUpdates.createdAt,
      updatedAt: marketKnowledgeUpdates.updatedAt,
    })
    .from(marketKnowledgeUpdates)
    .innerJoin(markets, eq(marketKnowledgeUpdates.marketId, markets.id))
    .where(eq(marketKnowledgeUpdates.createdBy, userId))
    .orderBy(marketKnowledgeUpdates.createdAt);
}

export async function approveEntry(id: string, reviewerId: string, reviewNotes?: string) {
  const [existing] = await db.select().from(marketKnowledgeUpdates)
    .where(and(
      eq(marketKnowledgeUpdates.id, id),
      eq(marketKnowledgeUpdates.status, "pending_review"),
    )).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Pending entry not found" });

  const [updated] = await db.update(marketKnowledgeUpdates)
    .set({
      status: "approved",
      aiVisible: true,
      reviewedBy: reviewerId,
      reviewedAt: sql`now()`,
      reviewNotes: reviewNotes ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(marketKnowledgeUpdates.id, id))
    .returning();
  return updated!;
}

export async function rejectEntry(id: string, reviewerId: string, reviewNotes?: string) {
  const [existing] = await db.select().from(marketKnowledgeUpdates)
    .where(and(
      eq(marketKnowledgeUpdates.id, id),
      eq(marketKnowledgeUpdates.status, "pending_review"),
    )).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Pending entry not found" });

  const [updated] = await db.update(marketKnowledgeUpdates)
    .set({
      status: "rejected",
      aiVisible: false,
      reviewedBy: reviewerId,
      reviewedAt: sql`now()`,
      reviewNotes: reviewNotes ?? null,
      updatedAt: sql`now()`,
    })
    .where(eq(marketKnowledgeUpdates.id, id))
    .returning();
  return updated!;
}
