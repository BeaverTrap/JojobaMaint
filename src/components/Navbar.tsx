import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Brand";
import ThemeToggle from "@/components/ThemeToggle";
import type { Profile } from "@/lib/database.types";

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

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo in the top-left, links back to the feed (home). */}
        <Link href="/" className="shrink-0" aria-label="Go to feed">
          <Logo size={40} />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink href="/" label="Feed" />
          <NavLink href="/articles" label="Articles" />
          <NavLink href="/galleries" label="Galleries" />

          {isAuthorized && (
            <NavLink href="/admin" label="Dashboard" highlight />
          )}

          <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

          <ThemeToggle />

          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2 pl-1">
                <Avatar src={profile?.avatar_url ?? null} name={displayName} />
                <span className="hidden max-w-[10ch] truncate text-sm font-medium text-ink sm:inline">
                  {displayName}
                </span>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="ml-1 rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-hover hover:text-ink"
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
      </nav>
    </header>
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
          ? "rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
          : "rounded-lg px-3 py-2 text-sm font-semibold text-ink transition hover:bg-brand-50 hover:text-brand-700"
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
