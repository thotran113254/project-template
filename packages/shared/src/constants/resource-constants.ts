export const RESOURCE_STATUSES = [
  "active",
  "inactive",
  "pending",
  "error",
] as const;

export const RESOURCE_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "service", label: "Service" },
  { value: "product", label: "Product" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
] as const;
