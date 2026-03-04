export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

export const KB_STATUSES = ["draft", "published", "archived"] as const;

export const CHAT_ROLES = ["user", "assistant", "system"] as const;

export const KB_CATEGORIES = [
  { value: "faq", label: "FAQ" },
  { value: "destination", label: "Destination" },
  { value: "product", label: "Product" },
  { value: "policy", label: "Policy" },
  { value: "general", label: "General" },
];

export const HOTEL_AMENITIES = [
  "pool",
  "free-wifi",
  "breakfast",
  "spa",
  "gym",
  "restaurant",
  "bar",
  "parking",
  "room-service",
  "concierge",
  "luxury-spa",
  "fine-dining",
  "eco-friendly",
  "forest-view",
  "private-beach",
];
