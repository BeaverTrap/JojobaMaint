export const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/schedule", label: "Schedule" },
  { href: "/water", label: "Water" },
  { href: "/map", label: "Park map" },
] as const;

export const REQUEST_NAV = {
  href: "/request",
  label: "Submit Request",
  shortLabel: "Request",
} as const;

export type NavLink = (typeof NAV_LINKS)[number];

/** Paths grouped under a nav item (e.g. site directory + profiles under Park map). */
const NAV_PATH_ALIASES: Partial<Record<string, readonly string[]>> = {
  "/map": ["/sites"],
};

export function matchNavPath(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  const aliases = NAV_PATH_ALIASES[href];
  if (!aliases) return false;
  return aliases.some(
    (alias) => pathname === alias || pathname.startsWith(`${alias}/`),
  );
}
