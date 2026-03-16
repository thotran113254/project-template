import { eq, asc, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import { evaluationCriteria, propertyEvaluations } from "../../db/schema/index.js";
import type {
  EvaluationCriteriaRecord,
  NewEvaluationCriteriaRecord,
  NewPropertyEvaluationRecord,
} from "../../db/schema/index.js";

export async function listCriteria(marketId?: string) {
  if (marketId) {
    return db.select().from(evaluationCriteria)
      .where(eq(evaluationCriteria.marketId, marketId))
      .orderBy(asc(evaluationCriteria.sortOrder));
  }
  return db.select().from(evaluationCriteria).orderBy(asc(evaluationCriteria.sortOrder));
}

export async function createCriteria(data: Omit<NewEvaluationCriteriaRecord, "id" | "createdAt" | "updatedAt">) {
  const [record] = await db.insert(evaluationCriteria).values(data).returning();
  return record!;
}

export async function updateCriteria(id: string, data: Partial<EvaluationCriteriaRecord>) {
  const [existing] = await db.select().from(evaluationCriteria).where(eq(evaluationCriteria.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Criteria not found" });
  const [updated] = await db.update(evaluationCriteria)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(evaluationCriteria.id, id))
    .returning();
  return updated!;
}

export async function deleteCriteria(id: string) {
  const [existing] = await db.select().from(evaluationCriteria).where(eq(evaluationCriteria.id, id)).limit(1);
  if (!existing) throw new HTTPException(404, { message: "Criteria not found" });
  await db.delete(evaluationCriteria).where(eq(evaluationCriteria.id, id));
}

export async function listEvaluations(propertyId: string) {
  return db.select({ evaluation: propertyEvaluations, criteria: evaluationCriteria })
    .from(propertyEvaluations)
    .leftJoin(evaluationCriteria, eq(propertyEvaluations.criteriaId, evaluationCriteria.id))
    .where(eq(propertyEvaluations.propertyId, propertyId));
}

export async function bulkUpsertEvaluations(
  propertyId: string,
  items: { criteriaId: string; value?: string; notes?: string; aiVisible?: boolean }[],
) {
  if (items.length === 0) return [];
  const values: NewPropertyEvaluationRecord[] = items.map((item) => ({
    propertyId,
    criteriaId: item.criteriaId,
    value: item.value ?? null,
    notes: item.notes ?? null,
    aiVisible: item.aiVisible ?? true,
  }));

  const result = await db.insert(propertyEvaluations)
    .values(values)
    .onConflictDoUpdate({
      target: [propertyEvaluations.propertyId, propertyEvaluations.criteriaId],
      set: {
        value: sql`EXCLUDED.value`,
        notes: sql`EXCLUDED.notes`,
        aiVisible: sql`EXCLUDED.ai_visible`,
        updatedAt: sql`now()`,
      },
    })
    .returning();
  return result;
}
