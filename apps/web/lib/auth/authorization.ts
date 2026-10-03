import type { DeeptechlyAuthSession } from "./session";

export const APPLICATION_ROLES = ["SUPER_ADMIN", "ADMIN", "USER", "VIEWER"] as const;
export type ApplicationRole = (typeof APPLICATION_ROLES)[number];

export type Permission =
  | "research.submit"
  | "settings.self"
  | "settings.routine"
  | "settings.protected"
  | "users.manage"
  | "super_admin.manage"
  | "audit.read";

const permissions: Record<ApplicationRole, readonly Permission[]> = {
  SUPER_ADMIN: ["research.submit", "settings.self", "settings.routine", "settings.protected", "users.manage", "super_admin.manage", "audit.read"],
  ADMIN: ["research.submit", "settings.self", "settings.routine", "users.manage", "audit.read"],
  USER: ["research.submit", "settings.self"],
  VIEWER: ["settings.self"]
};

export function hasPermission(session: Pick<DeeptechlyAuthSession, "role">, permission: Permission) {
  return permissions[session.role].includes(permission);
}

export function isAdministrativeRole(role: ApplicationRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function normalizeApplicationRole(value: string | null | undefined): ApplicationRole {
  return APPLICATION_ROLES.includes(value as ApplicationRole) ? (value as ApplicationRole) : "USER";
}

export function highestApplicationRole(roles: string[]): ApplicationRole {
  for (const role of APPLICATION_ROLES) if (roles.includes(role)) return role;
  return "USER";
}
