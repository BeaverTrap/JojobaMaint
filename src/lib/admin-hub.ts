import type { StaffRole } from "@/lib/staff-roles";
import { hasMinimumStaffRole, isAdminRole } from "@/lib/staff-roles";

export type AdminHubLink = {
  href: string;
  title: string;
  description: string;
  minimumRole: StaffRole;
};

export const ADMIN_CREATE_LINKS: AdminHubLink[] = [
  {
    href: "/admin?area=landscaping",
    title: "Landscaping post",
    description: "Quick or structured post for landscaping work.",
    minimumRole: "staff",
  },
  {
    href: "/admin?area=maintenance",
    title: "Maintenance post",
    description: "Quick or structured post for maintenance work.",
    minimumRole: "staff",
  },
];

export const ADMIN_MANAGE_LINKS: AdminHubLink[] = [
  {
    href: "/admin/articles",
    title: "Articles",
    description: "Knowledge-base articles and how-tos.",
    minimumRole: "manager",
  },
  {
    href: "/admin/tree-assessments",
    title: "Tree assessments",
    description: "Review and edit tree assessment records.",
    minimumRole: "manager",
  },
  {
    href: "/admin/maintenance-assessments",
    title: "Maintenance assessments",
    description: "Review and edit maintenance assessment records.",
    minimumRole: "manager",
  },
  {
    href: "/admin/pickup-guidelines",
    title: "Pickup guidelines",
    description: "Green waste banner text and summer schedule toggle.",
    minimumRole: "manager",
  },
  {
    href: "/map",
    title: "Park map",
    description: "Edit lot positions, places, and map layers.",
    minimumRole: "manager",
  },
  {
    href: "/water",
    title: "Water usage",
    description: "Sync monthly water reports from the spreadsheet.",
    minimumRole: "manager",
  },
];

export const ADMIN_TOOLS_LINKS: AdminHubLink[] = [
  {
    href: "/weather/stack",
    title: "Weather mascot layout",
    description: "Tune the layered weather mascot used on the weather page.",
    minimumRole: "admin",
  },
];

export function adminHubLinksForRole(
  links: AdminHubLink[],
  role: StaffRole | null | undefined,
): AdminHubLink[] {
  return links.filter((link) => hasMinimumStaffRole(role, link.minimumRole));
}

export function showAdminToolsSection(role: StaffRole | null | undefined): boolean {
  return isAdminRole(role);
}
