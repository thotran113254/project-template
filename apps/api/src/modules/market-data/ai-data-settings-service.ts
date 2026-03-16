import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { aiDataSettings } from "../../db/schema/index.js";

export async function listSettings() {
  return db.select().from(aiDataSettings);
}

export async function toggleCategory(category: string, isEnabled: boolean, updatedBy?: string) {
  const [existing] = await db.select().from(aiDataSettings)
    .where(eq(aiDataSettings.dataCategory, category))
    .limit(1);

  if (!existing) {
    const [created] = await db.insert(aiDataSettings)
      .values({ dataCategory: category, isEnabled, updatedBy: updatedBy ?? null })
      .returning();
    return created!;
  }

  const [updated] = await db.update(aiDataSettings)
    .set({ isEnabled, updatedBy: updatedBy ?? null, updatedAt: sql`now()` })
    .where(eq(aiDataSettings.dataCategory, category))
    .returning();
  return updated!;
}
