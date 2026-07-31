export const ROLE = {
  USER: "user",
  PREMIUM: "premium",
  MODERATOR: "moderator",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export type AdminUserFilter = "all" | "free" | Exclude<UserRole, "user">;

export function isAdminRole(role: string | null | undefined): boolean {
  return role === ROLE.ADMIN;
}
