export type Permission =
  | "leads:read"
  | "leads:write"
  | "leads:delete"
  | "campaigns:read"
  | "campaigns:write"
  | "activities:read"
  | "activities:write"
  | "followups:read"
  | "followups:write"
  | "notifications:read"
  | "notifications:write"
  | "analytics:read"
  | "pipeline:read"
  | "pipeline:manage"
  | "users:manage"
  | "ai:query";

export const rolePermissions = {
  Admin: ["*"],
  "Marketing Manager": [
    "leads:read", "campaigns:read", "campaigns:write", "activities:read",
    "followups:read", "notifications:read", "notifications:write", "analytics:read",
    "pipeline:read", "ai:query",
  ],
  "Sales Agent": [
    "leads:read", "leads:write", "campaigns:read", "activities:read",
    "activities:write", "followups:read", "followups:write", "notifications:read",
    "pipeline:read", "ai:query",
  ],
} as const;
