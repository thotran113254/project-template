import { eq, and, or, ilike, count, sql, type SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { knowledgeBase } from "../../db/schema/index.js";
import type {
  KbArticle,
  CreateKbArticleDto,
  UpdateKbArticleDto,
  KbQuery,
  PaginationMeta,
} from "@app/shared";

function toArticle(row: typeof knowledgeBase.$inferSelect): KbArticle {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    tags: (row.tags ?? []) as string[],
    status: row.status as KbArticle["status"],
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listArticles(
  query: KbQuery,
): Promise<{ data: KbArticle[]; meta: PaginationMeta }> {
  const { page, limit, search, category, status } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(ilike(knowledgeBase.title, pattern), ilike(knowledgeBase.content, pattern))!,
    );
  }
  if (category) conditions.push(eq(knowledgeBase.category, category));
  if (status) conditions.push(eq(knowledgeBase.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countResult]] = await Promise.all([
    whereClause
      ? db.select().from(knowledgeBase).where(whereClause).limit(limit).offset(offset)
      : db.select().from(knowledgeBase).limit(limit).offset(offset),
    whereClause
      ? db.select({ total: count() }).from(knowledgeBase).where(whereClause)
      : db.select({ total: count() }).from(knowledgeBase),
  ]);

  return {
    data: rows.map(toArticle),
    meta: {
      page,
      limit,
      total: countResult!.total,
      totalPages: Math.ceil(countResult!.total / limit),
    },
  };
}

export async function getArticleById(id: string): Promise<KbArticle> {
  const [row] = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.id, id))
    .limit(1);

  if (!row) throw new HTTPException(404, { message: "Article not found" });
  return toArticle(row);
}

export async function createArticle(
  dto: CreateKbArticleDto,
  userId: string,
): Promise<KbArticle> {
  const [row] = await db
    .insert(knowledgeBase)
    .values({
      title: dto.title,
      content: dto.content ?? "",
      category: dto.category,
      tags: dto.tags ?? [],
      status: dto.status ?? "draft",
      createdBy: userId,
    })
    .returning();

  return toArticle(row!);
}

export async function updateArticle(
  id: string,
  dto: UpdateKbArticleDto,
): Promise<KbArticle> {
  const [existing] = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.id, id))
    .limit(1);

  if (!existing) throw new HTTPException(404, { message: "Article not found" });

  const [updated] = await db
    .update(knowledgeBase)
    .set({ ...dto, updatedAt: sql`now()` })
    .where(eq(knowledgeBase.id, id))
    .returning();

  return toArticle(updated!);
}

export async function deleteArticle(id: string): Promise<void> {
  const [existing] = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.id, id))
    .limit(1);

  if (!existing) throw new HTTPException(404, { message: "Article not found" });

  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
}
