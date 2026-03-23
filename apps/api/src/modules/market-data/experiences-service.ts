import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { marketExperiences } from "../../db/schema/index.js";
import type { MarketExperienceRecord, NewMarketExperienceRecord } from "../../db/schema/index.js";

export async function listExperiences(marketId: string) {
  return db.select().from(marketExperiences)
    .where(eq(marketExperiences.marketId, marketId))
    .orderBy(asc(marketExperiences.sortOrder), asc(marketExperiences.createdAt));
}

export async function createExperience(
  data: Omit<NewMarketExperienceRecord, "id" | "createdAt" | "updatedAt">,
) {
  const [record] = await db.insert(marketExperiences).values(data).returning();
  return record!;
}

export async function updateExperience(id: string, data: Partial<MarketExperienceRecord>) {
  const [existing] = await db.select().from(marketExperiences)
    .where(eq(marketExperiences.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Experience not found" });
  const [updated] = await db.update(marketExperiences)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(marketExperiences.id, id))
    .returning();
  return updated!;
}

export async function deleteExperience(id: string) {
  const [existing] = await db.select().from(marketExperiences)
    .where(eq(marketExperiences.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Experience not found" });
  await db.delete(marketExperiences).where(eq(marketExperiences.id, id));
}
