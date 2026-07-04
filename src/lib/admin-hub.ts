import type { StaffRole } from "@/lib/staff-roles";
import { hasMinimumStaffRole, isWebmasterRole } from "@/lib/staff-roles";
import type { MascotSceneId } from "@/lib/mascot-scenes";

export type AdminHubLink = {
  href: string;
  title: string;
  description: string;
  minimumRole: StaffRole;
  /** Mascot illustration shown on the hub card. */
  scene?: MascotSceneId;
  /** Direct image path (status art / logo avatar). Takes priority over scene. */
  image?: string;
  /** Renders a live widget preview instead of a static image. */
  widget?: "weather";
  /** Opens in a new tab — used for public-facing pages reached from the hub. */
  newTab?: boolean;
};

export const ADMIN_CREATE_LINKS: AdminHubLink[] = [
  {
    href: "/admin/compose?area=landscaping",
    title: "Landscaping post",
    description: "Quick or structured post for landscaping work.",
    minimumRole: "staff",
    image: "/assets/Mascot_Sunhat_Avatar.png",
  },
  {
    href: "/admin/compose?area=maintenance",
    title: "Maintenance post",
    description: "Quick or structured post for maintenance work.",
    minimumRole: "staff",
    image: "/assets/Mascot_Hardhat_Avatar.png",
  },
  {
    href: "/admin/articles/new",
    title: "New article",
    description: "Write a knowledge-base article or how-to.",
    minimumRole: "manager",
    scene: "reading",
  },
  {
    href: "/admin/tree-assessments/new",
    title: "New tree assessment",
    description: "Log a new tree assessment record.",
    minimumRole: "manager",
    scene: "search",
  },
  {
    href: "/admin/maintenance-assessments/new",
    title: "New maintenance assessment",
    description: "Log a new maintenance assessment record.",
    minimumRole: "manager",
    scene: "tools",
  },
];

export const ADMIN_MANAGE_LINKS: AdminHubLink[] = [
  {
    href: "/admin/announcements",
    title: "Park alerts",
    description: "Make any alert here — water, power, or park-wide notices.",
    minimumRole: "manager",
    image: "/assets/status/alert.png",
  },
  {
    href: "/admin/facilities-status",
    title: "Facilities",
    description: "Washers, dryers, showers, toilets, urinals, and sinks.",
    minimumRole: "manager",
    image: "/assets/status/laundry-ok.png",
  },
  {
    href: "/admin/articles",
    title: "Articles",
    description: "Knowledge-base articles and how-tos.",
    minimumRole: "manager",
    scene: "reading",
  },
  {
    href: "/admin/tree-assessments",
    title: "Tree assessments",
    description: "Review and edit tree assessment records.",
    minimumRole: "manager",
    scene: "search",
  },
  {
    href: "/admin/maintenance-assessments",
    title: "Maintenance assessments",
    description: "Review and edit maintenance assessment records.",
    minimumRole: "manager",
    scene: "tools",
  },
  {
    href: "/admin/pickup-guidelines",
    title: "Pickup guidelines",
    description: "Green waste banner text and summer schedule toggle.",
    minimumRole: "manager",
    scene: "pickup",
  },
];

export const ADMIN_PUBLIC_LINKS: AdminHubLink[] = [
  {
    href: "/map",
    title: "Park map",
    description: "Edit lot positions, places, and map layers.",
    minimumRole: "manager",
    scene: "map",
    newTab: true,
  },
  {
    href: "/water",
    title: "Water usage",
    description: "Sync monthly water reports from the spreadsheet.",
    minimumRole: "manager",
    scene: "water",
    newTab: true,
  },
];

export const ADMIN_TOOLS_LINKS: AdminHubLink[] = [
  {
    href: "/admin/emergency-alerts",
    title: "Emergency SMS Dashboard",
    description:
      "Mass-text alerts with templates, message types, Gemini rewrite, and audit log.",
    minimumRole: "admin",
    image: "/assets/status/alert.png",
  },
  {
    href: "/admin/staff-access",
    title: "Staff access",
    description: "Whitelist Google emails and assign staff, manager, or admin roles.",
    minimumRole: "admin",
    scene: "tools",
  },
];

export const WEBMASTER_TOOLS_LINKS: AdminHubLink[] = [
  {
    href: "/admin/mascot-editor",
    title: "Mascot & branding",
    description: "Upload, position, and preview mascot avatars across the site.",
    minimumRole: "webmaster",
    image: "/assets/Mascot_Hardhat_Avatar.png",
  },
  {
    href: "/weather/stack",
    title: "Weather mascot layout",
    description: "Tune the layered weather mascot used on the weather page.",
    minimumRole: "webmaster",
    widget: "weather",
    newTab: true,
  },
];

export function adminHubLinksForRole(
  links: AdminHubLink[],
  role: StaffRole | null | undefined,
): AdminHubLink[] {
  return links.filter((link) => hasMinimumStaffRole(role, link.minimumRole));
}

export function showAdminToolsSection(role: StaffRole | null | undefined): boolean {
  return hasMinimumStaffRole(role, "admin");
}

export function showWebmasterToolsSection(
  role: StaffRole | null | undefined,
): boolean {
  return isWebmasterRole(role);
}
