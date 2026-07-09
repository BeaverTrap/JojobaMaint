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
  /** Direct image path (status art / logo). Takes priority over scene. */
  image?: string;
  /** Opens in a new tab — used for public-facing pages reached from the hub. */
  newTab?: boolean;
};

export const DEFAULT_COMPOSE_HREF = "/admin/compose?area=maintenance";

export const ADMIN_CREATE_LINKS: AdminHubLink[] = [
  {
    href: "/admin/compose?area=landscaping",
    title: "Landscaping post",
    description: "Quick or structured post for landscaping work.",
    minimumRole: "staff",
    image: "/assets/Mascot_Sunhat.png",
  },
  {
    href: "/admin/compose?area=maintenance",
    title: "Maintenance post",
    description: "Quick or structured post for maintenance work.",
    minimumRole: "staff",
    image: "/assets/Mascot_Hardhat.png",
  },
  {
    href: "/admin/facilities-status",
    title: "Facilities",
    description: "Washers, dryers, showers, toilets, urinals, and sinks.",
    minimumRole: "staff",
    image: "/assets/status/laundry-ok.png",
  },
  {
    href: "/admin/articles",
    title: "Articles",
    description: "Knowledge-base guides and how-tos.",
    minimumRole: "manager",
    scene: "reading",
  },
  {
    href: "/admin/tree-assessments",
    title: "Landscaping assessments",
    description: "Review and edit tree and lot evaluations.",
    minimumRole: "manager",
    scene: "search",
  },
  {
    href: "/admin/maintenance-assessments",
    title: "Maintenance assessments",
    description: "Review ponds, halls, and site project records.",
    minimumRole: "manager",
    scene: "tools",
  },
];

export const ADMIN_MANAGE_LINKS: AdminHubLink[] = [
  {
    href: "/admin/announcements",
    title: "Park alerts",
    description: "Make any alert here — water, power, or park-wide notices.",
    minimumRole: "admin",
    image: "/assets/status/alert.png",
  },
  {
    href: "/admin/pickup-guidelines",
    title: "Pickup guidelines",
    description: "Green waste banner text and summer schedule toggle.",
    minimumRole: "admin",
    scene: "pickup",
  },
  {
    href: "/map",
    title: "Park map",
    description: "Edit lot positions, places, and map layers.",
    minimumRole: "admin",
    scene: "map",
    newTab: true,
  },
  {
    href: "/water",
    title: "Water usage",
    description: "Sync monthly water reports from the spreadsheet.",
    minimumRole: "admin",
    scene: "water",
    newTab: true,
  },
  {
    href: "/admin/emergency-alerts",
    title: "Emergency SMS",
    description: "Mass-text alerts to all residents.",
    minimumRole: "admin",
    scene: "alertSms",
  },
  {
    href: "/admin/staff-access",
    title: "Staff access",
    description: "Whitelist emails and assign roles.",
    minimumRole: "admin",
    scene: "welcome",
  },
];

export const ADMIN_PUBLIC_LINKS: AdminHubLink[] = [];

export const ADMIN_TOOLS_LINKS: AdminHubLink[] = [];

export const WEBMASTER_TOOLS_LINKS: AdminHubLink[] = [
  {
    href: "/admin/mascot-editor",
    title: "Mascot & branding",
    description: "Colors, wordmark, avatars, temp mascots — all live.",
    minimumRole: "webmaster",
    image: "/assets/Mascot_Hardhat.png",
  },
  {
    href: "/admin/weather-layout",
    title: "Weather layout",
    description: "Tune the layered weather mascot.",
    minimumRole: "webmaster",
    image: "/assets/mascot/weather/quail_001.png",
  },
  {
    href: "#debug",
    title: "Debug mode",
    description: "View as staff, manager, or admin.",
    minimumRole: "webmaster",
    scene: "astronaut",
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
