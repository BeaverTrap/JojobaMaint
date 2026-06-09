"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PRIMARY = [
  { href: "/", label: "Feed", match: (p: string) => p === "/" },
  {
    href: "/tree-assessments",
    label: "Landscape",
    match: (p: string) => p.startsWith("/tree-assessments"),
  },
  {
    href: "/maintenance-assessments",
    label: "Maint",
    match: (p: string) => p.startsWith("/maintenance-assessments"),
  },
  {
    href: "/schedule",
    label: "Schedule",
    match: (p: string) => p.startsWith("/schedule"),
  },
] as const;

export default function MobileBottomNav({
  isAuthorized,
}: {
  isAuthorized: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden dark:bg-black/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-1">
        {PRIMARY.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-brand-600 dark:text-brand-300"
                  : "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-muted"
              }
            >
              <NavIcon name={item.label} active={active} />
              <span className="max-w-full truncate text-[10px] font-semibold leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
        <Link
          href={isAuthorized ? "/admin" : "/login"}
          className={
            pathname.startsWith("/admin") || pathname === "/login"
              ? "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-brand-600 dark:text-brand-300"
              : "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-muted"
          }
        >
          <NavIcon name="More" active={pathname.startsWith("/admin")} />
          <span className="max-w-full truncate text-[10px] font-semibold leading-none">
            {isAuthorized ? "Create" : "Sign in"}
          </span>
        </Link>
      </div>
    </nav>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "currentColor" : "currentColor";
  const className = "h-5 w-5";
  switch (name) {
    case "Feed":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 6h16M4 12h16M4 18h10"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "Schedule":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M7 3v2M17 3v2M4 8h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Landscape":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c-4 4-8 6-8 11a8 8 0 1 0 16 0c0-5-4-7-8-11Z"
            stroke={stroke}
            strokeWidth="1.75"
          />
        </svg>
      );
    case "Maint":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Articles":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M14 4v5h5" stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="6" r="1.5" fill={stroke} />
          <circle cx="12" cy="12" r="1.5" fill={stroke} />
          <circle cx="12" cy="18" r="1.5" fill={stroke} />
        </svg>
      );
  }
}
