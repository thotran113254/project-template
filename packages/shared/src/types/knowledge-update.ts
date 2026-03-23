export interface MarketKnowledgeUpdate {
  id: string;
  marketId: string;
  aspect: string;
  knowledge: string;
  status: "draft" | "pending_review" | "approved" | "rejected";
  createdBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  aiVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeUpdateInput {
  aspect: string;
  knowledge: string;
  status?: string;
  sortOrder?: number;
}

export interface UpdateKnowledgeUpdateInput {
  aspect?: string;
  knowledge?: string;
  status?: string;
  aiVisible?: boolean;
  sortOrder?: number;
}
