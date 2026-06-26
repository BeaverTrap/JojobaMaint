export type StaffRole = "staff" | "manager" | "admin";

const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  staff: "Staff",
  manager: "Manager",
  admin: "Admin",
};

export function staffRoleRank(role: StaffRole | null | undefined): number {
  if (!role) return 0;
  return STAFF_ROLE_RANK[role];
}

export function hasMinimumStaffRole(
  role: StaffRole | null | undefined,
  minimum: StaffRole,
): boolean {
  return staffRoleRank(role) >= STAFF_ROLE_RANK[minimum];
}

export function canManageSiteContent(
  role: StaffRole | null | undefined,
): boolean {
  return hasMinimumStaffRole(role, "manager");
}

export function isAdminRole(role: StaffRole | null | undefined): boolean {
  return role === "admin";
}
