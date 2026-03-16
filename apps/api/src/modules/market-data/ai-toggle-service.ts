import { eq, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { db } from "../../db/connection.js";
import {
  markets,
  marketCompetitors,
  marketCustomerJourneys,
  marketTargetCustomers,
  marketAttractions,
  marketDiningSpots,
  marketTransportation,
  marketInventoryStrategies,
  marketProperties,
  propertyRooms,
  propertyEvaluations,
  roomPricing,
  itineraryTemplates,
  pricingConfigs,
} from "../../db/schema/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABLE_MAP: Record<string, { table: any; idCol: any }> = {
  market: { table: markets, idCol: markets.id },
  competitor: { table: marketCompetitors, idCol: marketCompetitors.id },
  customer_journey: { table: marketCustomerJourneys, idCol: marketCustomerJourneys.id },
  target_customer: { table: marketTargetCustomers, idCol: marketTargetCustomers.id },
  attraction: { table: marketAttractions, idCol: marketAttractions.id },
  dining_spot: { table: marketDiningSpots, idCol: marketDiningSpots.id },
  transportation: { table: marketTransportation, idCol: marketTransportation.id },
  inventory_strategy: { table: marketInventoryStrategies, idCol: marketInventoryStrategies.id },
  property: { table: marketProperties, idCol: marketProperties.id },
  room: { table: propertyRooms, idCol: propertyRooms.id },
  property_evaluation: { table: propertyEvaluations, idCol: propertyEvaluations.id },
  room_pricing: { table: roomPricing, idCol: roomPricing.id },
  itinerary_template: { table: itineraryTemplates, idCol: itineraryTemplates.id },
  pricing_config: { table: pricingConfigs, idCol: pricingConfigs.id },
};

export async function toggleAiVisible(entityType: string, entityId: string, aiVisible: boolean) {
  const entry = TABLE_MAP[entityType];
  if (!entry) throw new HTTPException(400, { message: `Unknown entity type: ${entityType}` });

  const { table, idCol } = entry;

  const [existing] = await db.select().from(table).where(eq(idCol, entityId)).limit(1);
  if (!existing) throw new HTTPException(404, { message: `${entityType} not found` });

  const [updated] = await db.update(table)
    .set({ aiVisible, updatedAt: sql`now()` })
    .where(eq(idCol, entityId))
    .returning();
  return updated;
}
