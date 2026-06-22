import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import ParkWeatherBar from "@/components/ParkWeatherBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileMenu from "@/components/MobileMenu";
import type { Profile } from "@/lib/database.types";
import { NAV_LINKS, REQUEST_NAV } from "@/lib/nav-links";

export default function Navbar({
  profile,
  isAuthorized,
  isLoggedIn,
}: {
  profile: Profile | null;
  isAuthorized: boolean;
  isLoggedIn: boolean;
}) {
  const displayName = profile?.display_name ?? "Member";
  const menuLinks = [
    ...NAV_LINKS,
    REQUEST_NAV,
    ...(isAuthorized
      ? [{ href: "/admin", label: "Create / dashboard" }]
      : []),
  ];

  return (
    <>
      <header className="no-print sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur dark:bg-black/95">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
          <Link href="/" className="shrink-0" aria-label="Go to feed">
            <Logo size={36} />
          </Link>

          {/* Desktop */}
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 md:flex">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
            {REQUEST_NAV.external ? (
              <a
                href={REQUEST_NAV.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
              >
                {REQUEST_NAV.label}
              </a>
            ) : (
              <Link
                href={REQUEST_NAV.href}
                className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
              >
                {REQUEST_NAV.label}
              </Link>
            )}
            {isAuthorized && (
              <NavLink href="/admin" label="Dashboard" highlight />
            )}
            <div className="mx-1 h-6 w-px bg-line" />
            <ThemeToggle />
            {isLoggedIn ? (
              <>
                <div className="flex items-center gap-2 pl-1">
                  <Avatar
                    src={profile?.avatar_url ?? null}
                    name={displayName}
                  />
                  <span className="max-w-[12ch] truncate text-sm font-medium text-ink">
                    {displayName}
                  </span>
                </div>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-hover hover:text-ink"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Staff sign in
              </Link>
            )}
          </div>

          {/* Mobile header: optional quick new + overflow menu */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {isAuthorized && (
              <Link
                href="/admin"
                className="rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-bold text-white"
              >
                + New
              </Link>
            )}
            <MobileMenu
              links={menuLinks}
              isLoggedIn={isLoggedIn}
              displayName={displayName}
            />
          </div>
        </nav>
        <ParkWeatherBar />
      </header>

      <MobileBottomNav />
    </>
  );
}

function NavLink({
  href,
  label,
  highlight = false,
}: {
  href: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        highlight
          ? "shrink-0 rounded-lg bg-brand-50 px-2.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:bg-brand-900/80 dark:text-brand-200"
          : "shrink-0 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink transition hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-hover dark:hover:text-brand-300"
      }
    >
      {label}
    </Link>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
