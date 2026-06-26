"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NAV_LINKS,
  REQUEST_NAV,
  isExternalHref,
  matchNavPath,
} from "@/lib/nav-links";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden dark:bg-black/95"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-5xl items-stretch justify-around px-0.5">
        {[...NAV_LINKS, REQUEST_NAV].map((item) => {
          const active = matchNavPath(item.href, pathname);
          const label = "shortLabel" in item ? item.shortLabel : item.label;
          const className =
            active
              ? "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-brand-600 dark:text-brand-300"
              : item.href === REQUEST_NAV.href
                ? "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-brand-600 dark:text-brand-400"
                : "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 text-muted";

          if (isExternalHref(item.href)) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <NavIcon name={item.label} active={active} />
                <span className="max-w-full truncate text-[10px] font-semibold leading-none">
                  {label}
                </span>
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={className}>
              <NavIcon name={item.label} active={active} />
              <span className="max-w-full truncate text-[10px] font-semibold leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = "currentColor";
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
    case "Outdoors":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 17a4 4 0 0 1 .9-7.9A5 5 0 0 1 18 9a3.5 3.5 0 0 1 .5 7H8Z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Park map":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 4 3 6.5V20l6-2.5L15 20l6-2.5V4l-6 2.5L9 4Z"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path
            d="M9 4v13.5M15 6.5V20"
            stroke={stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "Submit Request":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 5v14M5 12h14"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="2" fill={active ? stroke : "none"} stroke={stroke} strokeWidth="1.75" />
        </svg>
      );
  }
}
