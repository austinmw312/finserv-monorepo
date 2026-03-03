export enum Role {
  ADMIN = "admin",
  TRADER = "trader",
  ANALYST = "analyst",
  SUPPORT = "support",
  VIEWER = "viewer",
}

export type Permission =
  | "accounts:read"
  | "accounts:write"
  | "accounts:delete"
  | "trades:read"
  | "trades:execute"
  | "trades:cancel"
  | "transfers:create"
  | "transfers:approve"
  | "notifications:read"
  | "notifications:manage"
  | "kyc:read"
  | "kyc:approve"
  | "admin:users"
  | "admin:settings";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    "accounts:read",
    "accounts:write",
    "accounts:delete",
    "trades:read",
    "trades:execute",
    "trades:cancel",
    "transfers:create",
    "transfers:approve",
    "notifications:read",
    "notifications:manage",
    "kyc:read",
    "kyc:approve",
    "admin:users",
    "admin:settings",
  ],
  [Role.TRADER]: [
    "accounts:read",
    "trades:read",
    "trades:execute",
    "trades:cancel",
    "transfers:create",
    "notifications:read",
  ],
  [Role.ANALYST]: [
    "accounts:read",
    "trades:read",
    "notifications:read",
  ],
  [Role.SUPPORT]: [
    "accounts:read",
    "accounts:write",
    "notifications:read",
    "notifications:manage",
    "kyc:read",
  ],
  [Role.VIEWER]: [
    "accounts:read",
    "trades:read",
  ],
};

export function checkPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}
