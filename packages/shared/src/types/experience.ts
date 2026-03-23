export interface MarketExperience {
  id: string;
  marketId: string;
  activityName: string;
  cost: string | null;
  description: string | null;
  images: string[];
  notes: string | null;
  sortOrder: number;
  aiVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExperienceInput {
  activityName: string;
  cost?: string | null;
  description?: string | null;
  images?: string[];
  notes?: string | null;
  sortOrder?: number;
}

export interface UpdateExperienceInput {
  activityName?: string;
  cost?: string | null;
  description?: string | null;
  images?: string[];
  notes?: string | null;
  aiVisible?: boolean;
  sortOrder?: number;
}
