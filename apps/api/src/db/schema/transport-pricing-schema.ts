import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { transportProviders } from "./transport-providers-schema";

export const transportPricing = pgTable(
  "transport_pricing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id").notNull().references(() => transportProviders.id, { onDelete: "cascade" }),
    vehicleClass: varchar("vehicle_class", { length: 50 }).notNull(),
    seatType: varchar("seat_type", { length: 50 }).notNull(),
    capacityPerUnit: integer("capacity_per_unit").notNull().default(1),
    onewayListedPrice: integer("oneway_listed_price").notNull(),
    onewayDiscountPrice: integer("oneway_discount_price"),
    roundtripListedPrice: integer("roundtrip_listed_price"),
    roundtripDiscountPrice: integer("roundtrip_discount_price"),
    childFreeUnder: integer("child_free_under").default(5),
    childDiscountUnder: integer("child_discount_under").default(10),
    childDiscountAmount: integer("child_discount_amount"),
    onboardServices: text("onboard_services"),
    crossProvinceSurcharges: jsonb("cross_province_surcharges").default([]),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    aiVisible: boolean("ai_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("transport_pricing_provider_id_idx").on(table.providerId),
    uniqueIndex("transport_pricing_provider_class_seat_idx").on(
      table.providerId, table.vehicleClass, table.seatType,
    ),
  ],
);

export type TransportPricingRecord = typeof transportPricing.$inferSelect;
export type NewTransportPricingRecord = typeof transportPricing.$inferInsert;
