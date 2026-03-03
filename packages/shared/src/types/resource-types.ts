export type ResourceStatus = "active" | "inactive" | "pending" | "error";

export interface Resource {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: ResourceStatus;
  category: string;
  metadata: Record<string, string>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceDto {
  name: string;
  description: string;
  category: string;
  metadata?: Record<string, string>;
}

export interface UpdateResourceDto {
  name?: string;
  description?: string;
  category?: string;
  metadata?: Record<string, string>;
}

export type ResourceAction = "activate" | "deactivate" | "archive" | "restore";
