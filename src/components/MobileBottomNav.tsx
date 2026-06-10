"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PRIMARY = [
  { href: "/", label: "Feed", match: (p: string) => p === "/" },
  {
    href: "/schedule",
    label: "Schedule",
    match: (p: string) => p.startsWith("/schedule"),
  },
  {
    href: "/water",
    label: "Water",
    match: (p: string) => p.startsWith("/water"),
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
    case "Water":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 2.5c3.5 4.5 7 8.2 7 12a7 7 0 1 1-14 0c0-3.8 3.5-7.5 7-12Z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
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
