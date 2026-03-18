import { eq, sql } from "drizzle-orm";
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

export async function updateCategory(
  category: string,
  data: { isEnabled?: boolean; creativityLevel?: string },
  updatedBy?: string,
) {
  const setData: Record<string, unknown> = { updatedAt: sql`now()` };
  if (data.isEnabled !== undefined) setData.isEnabled = data.isEnabled;
  if (data.creativityLevel) setData.creativityLevel = data.creativityLevel;
  if (updatedBy) setData.updatedBy = updatedBy;

  const [updated] = await db.update(aiDataSettings)
    .set(setData)
    .where(eq(aiDataSettings.dataCategory, category))
    .returning();
  return updated;
}
