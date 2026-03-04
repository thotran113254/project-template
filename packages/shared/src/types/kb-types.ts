export type KbStatus = "draft" | "published" | "archived";

export interface KbArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: KbStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateKbArticleDto = {
  title: string;
  content?: string;
  category: string;
  tags?: string[];
  status?: KbStatus;
};

export type UpdateKbArticleDto = Partial<CreateKbArticleDto>;

export type KbQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
};
