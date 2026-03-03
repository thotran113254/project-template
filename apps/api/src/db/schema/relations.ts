import { relations } from "drizzle-orm";
import { users } from "./users-schema";
import { resources } from "./resources-schema";

export const usersRelations = relations(users, ({ many }) => ({
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id],
  }),
}));
