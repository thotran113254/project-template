export const USER_ROLES = ["admin", "user"] as const;
export const DEFAULT_ROLE = "user" as const;

export type UserRoleConstant = (typeof USER_ROLES)[number];
