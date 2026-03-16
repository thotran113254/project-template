import { z } from "zod";

export const createMarketSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  region: z.string().max(100).optional(),
  geography: z.string().optional(),
  seasonInfo: z.string().optional(),
  weatherInfo: z.string().optional(),
  highlights: z.string().optional(),
  travelTips: z.string().optional(),
  localSpecialties: z.array(z.string()).optional(),
  accommodationOverview: z.string().optional(),
  visitorStats: z.record(z.unknown()).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  aiVisible: z.boolean().optional(),
});

export const updateMarketSchema = createMarketSchema.partial();

export const createCompetitorSchema = z.object({
  groupName: z.string().min(1).max(255),
  description: z.string().optional(),
  examples: z.string().optional(),
  mainChannels: z.string().optional(),
  implementation: z.string().optional(),
  effectiveness: z.string().max(50).optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  competitionDensity: z.string().optional(),
  sortOrder: z.number().int().optional(),
  aiVisible: z.boolean().optional(),
});

export const createCustomerJourneySchema = z.object({
  phaseName: z.string().max(100).optional(),
  stageOrder: z.number().int(),
  stageName: z.string().min(1).max(255),
  customerActions: z.string().optional(),
  touchpoints: z.string().optional(),
  painpoints: z.string().optional(),
  customerInfoNeeds: z.string().optional(),
  businessTouchpoints: z.string().optional(),
  extendedDetails: z.string().optional(),
  aiVisible: z.boolean().optional(),
});

export const createTargetCustomerSchema = z.object({
  segmentName: z.string().min(1).max(100),
  ageRange: z.string().max(50).optional(),
  gender: z.string().max(50).optional(),
  occupation: z.string().optional(),
  incomeRange: z.string().max(100).optional(),
  location: z.string().optional(),
  travelMotivation: z.string().optional(),
  bookingHabits: z.string().optional(),
  stayDuration: z.string().max(100).optional(),
  travelFrequency: z.string().max(100).optional(),
  primaryChannels: z.string().optional(),
  contentInterests: z.string().optional(),
  painPoints: z.string().optional(),
  preferences: z.string().optional(),
  trustFactors: z.string().optional(),
  decisionFactors: z.string().optional(),
  sortOrder: z.number().int().optional(),
  aiVisible: z.boolean().optional(),
});

export const createAttractionSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(50).optional(),
  position: z.string().optional(),
  natureDescription: z.string().optional(),
  experienceValue: z.string().optional(),
  popularity: z.string().max(50).optional(),
  bestTime: z.string().optional(),
  costInfo: z.string().optional(),
  suitableFor: z.string().optional(),
  connectivity: z.string().optional(),
  risks: z.string().optional(),
  images: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  aiVisible: z.boolean().optional(),
});

export const createDiningSpotSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(50),
  address: z.string().optional(),
  priceRange: z.string().max(100).optional(),
  priceLevel: z.enum(["budget", "mid", "premium"]).optional(),
  notableFeatures: z.string().optional(),
  cuisineType: z.string().max(100).optional(),
  operatingHours: z.string().max(100).optional(),
  contactInfo: z.record(z.unknown()).optional(),
  images: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
  aiVisible: z.boolean().optional(),
});

export const createTransportationSchema = z.object({
  routeSegment: z.string().min(1).max(255),
  transportType: z.string().min(1).max(50),
  departurePoints: z.string().optional(),
  arrivalPoints: z.string().optional(),
  duration: z.string().max(100).optional(),
  costInfo: z.string().optional(),
  convenienceNotes: z.string().optional(),
  packageIntegration: z.string().optional(),
  suitableFor: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
  aiVisible: z.boolean().optional(),
});

export const createInventoryStrategySchema = z.object({
  monthRange: z.string().min(1).max(50),
  seasonName: z.string().max(100).optional(),
  demandLevel: z.string().max(50).optional(),
  priceVariation: z.string().optional(),
  holdingType: z.enum(["none", "hard", "soft"]).optional(),
  targetSegment: z.string().optional(),
  applicablePeriods: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().optional(),
  aiVisible: z.boolean().optional(),
});
