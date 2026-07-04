export type StaffRole = "staff" | "manager" | "admin" | "webmaster";

export const STAFF_ROLES: StaffRole[] = [
  "staff",
  "manager",
  "admin",
  "webmaster",
];

const STAFF_ROLE_RANK: Record<StaffRole, number> = {
  staff: 1,
  manager: 2,
  admin: 3,
  webmaster: 4,
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  staff: "Staff",
  manager: "Manager",
  admin: "Admin",
  webmaster: "Webmaster",
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

/** Operational admin tools (SMS, whitelist, etc.) — admin and webmaster. */
export function isAdminRole(role: StaffRole | null | undefined): boolean {
  return hasMinimumStaffRole(role, "admin");
}

/** Site builder / dev layout tools — webmaster only. */
export function isWebmasterRole(role: StaffRole | null | undefined): boolean {
  return role === "webmaster";
}

export function canManageStaffAccess(
  role: StaffRole | null | undefined,
): boolean {
  return hasMinimumStaffRole(role, "admin");
}

/** Roles the signed-in user may assign when editing the whitelist. */
export function assignableStaffRoles(actorRole: StaffRole): StaffRole[] {
  if (isWebmasterRole(actorRole)) {
    return STAFF_ROLES;
  }
  if (hasMinimumStaffRole(actorRole, "admin")) {
    return ["staff", "manager", "admin"];
  }
  return [];
}

export function parseStaffRole(value: unknown): StaffRole | null {
  if (
    typeof value === "string" &&
    STAFF_ROLES.includes(value as StaffRole)
  ) {
    return value as StaffRole;
  }
  return null;
}
