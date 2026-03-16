export interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  region: string | null;
  geography: string | null;
  seasonInfo: string | null;
  weatherInfo: string | null;
  highlights: string | null;
  travelTips: string | null;
  localSpecialties: string[];
  accommodationOverview: string | null;
  visitorStats: Record<string, unknown>;
  images: string[];
  status: string;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketCompetitor {
  id: string;
  marketId: string;
  groupName: string;
  description: string | null;
  examples: string | null;
  mainChannels: string | null;
  implementation: string | null;
  effectiveness: string | null;
  strengths: string | null;
  weaknesses: string | null;
  competitionDensity: string | null;
  sortOrder: number;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketCustomerJourney {
  id: string;
  marketId: string;
  phaseName: string | null;
  stageOrder: number;
  stageName: string;
  customerActions: string | null;
  touchpoints: string | null;
  painpoints: string | null;
  customerInfoNeeds: string | null;
  businessTouchpoints: string | null;
  extendedDetails: string | null;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketTargetCustomer {
  id: string;
  marketId: string;
  segmentName: string;
  ageRange: string | null;
  gender: string | null;
  occupation: string | null;
  incomeRange: string | null;
  location: string | null;
  travelMotivation: string | null;
  bookingHabits: string | null;
  stayDuration: string | null;
  travelFrequency: string | null;
  primaryChannels: string | null;
  contentInterests: string | null;
  painPoints: string | null;
  preferences: string | null;
  trustFactors: string | null;
  decisionFactors: string | null;
  sortOrder: number;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketAttraction {
  id: string;
  marketId: string;
  name: string;
  type: string | null;
  position: string | null;
  natureDescription: string | null;
  experienceValue: string | null;
  popularity: string | null;
  bestTime: string | null;
  costInfo: string | null;
  suitableFor: string | null;
  connectivity: string | null;
  risks: string | null;
  images: string[];
  sortOrder: number;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketDiningSpot {
  id: string;
  marketId: string;
  name: string;
  category: string;
  address: string | null;
  priceRange: string | null;
  priceLevel: string | null;
  notableFeatures: string | null;
  cuisineType: string | null;
  operatingHours: string | null;
  contactInfo: Record<string, unknown>;
  images: string[];
  sortOrder: number;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}
