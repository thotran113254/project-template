import { relations } from "drizzle-orm";
import { markets } from "./markets-schema";
import { marketCompetitors } from "./market-competitors-schema";
import { marketCustomerJourneys } from "./market-customer-journeys-schema";
import { marketTargetCustomers } from "./market-target-customers-schema";
import { marketAttractions } from "./market-attractions-schema";
import { marketDiningSpots } from "./market-dining-spots-schema";
import { marketTransportation } from "./market-transportation-schema";
import { marketInventoryStrategies } from "./market-inventory-strategies-schema";
import { evaluationCriteria } from "./evaluation-criteria-schema";
import { marketProperties } from "./market-properties-schema";
import { propertyEvaluations } from "./property-evaluations-schema";
import { propertyRooms } from "./property-rooms-schema";
import { roomPricing } from "./room-pricing-schema";
import { pricingConfigs } from "./pricing-configs-schema";
import { itineraryTemplates } from "./itinerary-templates-schema";
import { itineraryTemplateItems } from "./itinerary-template-items-schema";
import { transportProviders } from "./transport-providers-schema";
import { transportPricing } from "./transport-pricing-schema";
import { marketKnowledgeUpdates } from "./market-knowledge-updates-schema";
import { marketExperiences } from "./market-experiences-schema";

export const marketsRelations = relations(markets, ({ many }) => ({
  competitors: many(marketCompetitors),
  customerJourneys: many(marketCustomerJourneys),
  targetCustomers: many(marketTargetCustomers),
  attractions: many(marketAttractions),
  diningSpots: many(marketDiningSpots),
  transportation: many(marketTransportation),
  inventoryStrategies: many(marketInventoryStrategies),
  evaluationCriteria: many(evaluationCriteria),
  properties: many(marketProperties),
  itineraryTemplates: many(itineraryTemplates),
  pricingConfigs: many(pricingConfigs),
  transportProviders: many(transportProviders),
  knowledgeUpdates: many(marketKnowledgeUpdates),
  experiences: many(marketExperiences),
}));

export const marketCompetitorsRelations = relations(marketCompetitors, ({ one }) => ({
  market: one(markets, { fields: [marketCompetitors.marketId], references: [markets.id] }),
}));

export const marketCustomerJourneysRelations = relations(marketCustomerJourneys, ({ one }) => ({
  market: one(markets, { fields: [marketCustomerJourneys.marketId], references: [markets.id] }),
}));

export const marketTargetCustomersRelations = relations(marketTargetCustomers, ({ one }) => ({
  market: one(markets, { fields: [marketTargetCustomers.marketId], references: [markets.id] }),
}));

export const marketAttractionsRelations = relations(marketAttractions, ({ one }) => ({
  market: one(markets, { fields: [marketAttractions.marketId], references: [markets.id] }),
}));

export const marketDiningSpotsRelations = relations(marketDiningSpots, ({ one }) => ({
  market: one(markets, { fields: [marketDiningSpots.marketId], references: [markets.id] }),
}));

export const marketTransportationRelations = relations(marketTransportation, ({ one }) => ({
  market: one(markets, { fields: [marketTransportation.marketId], references: [markets.id] }),
}));

export const marketInventoryStrategiesRelations = relations(marketInventoryStrategies, ({ one }) => ({
  market: one(markets, { fields: [marketInventoryStrategies.marketId], references: [markets.id] }),
}));

export const evaluationCriteriaRelations = relations(evaluationCriteria, ({ one, many }) => ({
  market: one(markets, { fields: [evaluationCriteria.marketId], references: [markets.id] }),
  evaluations: many(propertyEvaluations),
}));

export const marketPropertiesRelations = relations(marketProperties, ({ one, many }) => ({
  market: one(markets, { fields: [marketProperties.marketId], references: [markets.id] }),
  rooms: many(propertyRooms),
  evaluations: many(propertyEvaluations),
  pricingConfigs: many(pricingConfigs),
}));

export const propertyEvaluationsRelations = relations(propertyEvaluations, ({ one }) => ({
  property: one(marketProperties, { fields: [propertyEvaluations.propertyId], references: [marketProperties.id] }),
  criteria: one(evaluationCriteria, { fields: [propertyEvaluations.criteriaId], references: [evaluationCriteria.id] }),
}));

export const propertyRoomsRelations = relations(propertyRooms, ({ one, many }) => ({
  property: one(marketProperties, { fields: [propertyRooms.propertyId], references: [marketProperties.id] }),
  pricing: many(roomPricing),
}));

export const roomPricingRelations = relations(roomPricing, ({ one }) => ({
  room: one(propertyRooms, { fields: [roomPricing.roomId], references: [propertyRooms.id] }),
}));

export const pricingConfigsRelations = relations(pricingConfigs, ({ one }) => ({
  market: one(markets, { fields: [pricingConfigs.marketId], references: [markets.id] }),
  property: one(marketProperties, { fields: [pricingConfigs.propertyId], references: [marketProperties.id] }),
}));

export const itineraryTemplatesRelations = relations(itineraryTemplates, ({ one, many }) => ({
  market: one(markets, { fields: [itineraryTemplates.marketId], references: [markets.id] }),
  items: many(itineraryTemplateItems),
}));

export const itineraryTemplateItemsRelations = relations(itineraryTemplateItems, ({ one }) => ({
  template: one(itineraryTemplates, { fields: [itineraryTemplateItems.templateId], references: [itineraryTemplates.id] }),
}));

export const transportProvidersRelations = relations(transportProviders, ({ one, many }) => ({
  market: one(markets, { fields: [transportProviders.marketId], references: [markets.id] }),
  pricing: many(transportPricing),
}));

export const transportPricingRelations = relations(transportPricing, ({ one }) => ({
  provider: one(transportProviders, { fields: [transportPricing.providerId], references: [transportProviders.id] }),
}));

export const marketKnowledgeUpdatesRelations = relations(marketKnowledgeUpdates, ({ one }) => ({
  market: one(markets, { fields: [marketKnowledgeUpdates.marketId], references: [markets.id] }),
}));

export const marketExperiencesRelations = relations(marketExperiences, ({ one }) => ({
  market: one(markets, { fields: [marketExperiences.marketId], references: [markets.id] }),
}));
