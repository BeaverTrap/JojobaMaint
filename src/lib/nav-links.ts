import { getMaintainXPortalUrl } from "@/lib/maintainx";

export const NAV_LINKS = [
  { href: "/feed", label: "Feed", shortLabel: "Feed" },
  { href: "/schedule", label: "Schedule", shortLabel: "Schedule" },
  { href: "/water", label: "Water", shortLabel: "Water" },
  { href: "/map", label: "Park map", shortLabel: "Map" },
] as const;

const maintainXPortalUrl = getMaintainXPortalUrl();

export const REQUEST_NAV = {
  href: maintainXPortalUrl ?? "/request",
  label: "Submit Request",
  shortLabel: "Request",
  external: maintainXPortalUrl !== null,
} as const;

export function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export type NavLink = (typeof NAV_LINKS)[number];

/** Paths grouped under a nav item (e.g. site directory + profiles under Park map). */
const NAV_PATH_ALIASES: Partial<Record<string, readonly string[]>> = {
  "/feed": [
    "/posts",
    "/articles",
    "/tree-assessments",
    "/maintenance-assessments",
  ],
  "/map": ["/sites"],
};

export function matchNavPath(href: string, pathname: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  const aliases = NAV_PATH_ALIASES[href];
  if (!aliases) return false;
  return aliases.some(
    (alias) => pathname === alias || pathname.startsWith(`${alias}/`),
  );
}
