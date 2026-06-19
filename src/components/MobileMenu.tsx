"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

type LinkItem = { href: string; label: string };

export default function MobileMenu({
  links,
  isLoggedIn,
  displayName,
}: {
  links: LinkItem[];
  isLoggedIn: boolean;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-ink md:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <MenuIcon />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={close}
          />
          <div
            className="absolute right-3 top-[3.75rem] z-[101] flex w-[min(calc(100vw-1.5rem),16.5rem)] max-h-[min(70dvh,calc(100dvh-5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl dark:bg-[#0a0c0b]"
            style={{ backgroundColor: "var(--color-surface)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
              <p className="text-sm font-semibold text-ink">Menu</p>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-hover"
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className="overflow-y-auto p-2">
              <ul className="space-y-0.5">
                {links.map((item) => (
                  <li key={item.href}>
                    {item.href.startsWith("http") ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={close}
                        className="flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-ink hover:bg-hover"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={close}
                        className="flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-ink hover:bg-hover"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <div className="space-y-2 border-t border-line p-3">
              <div className="flex items-center justify-between rounded-lg bg-hover px-2.5 py-1.5">
                <span className="text-sm text-ink">Dark mode</span>
                <ThemeToggle />
              </div>
              {isLoggedIn ? (
                <>
                  <p className="truncate px-1 text-sm font-medium text-ink">
                    {displayName}
                  </p>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="flex min-h-10 w-full items-center justify-center rounded-lg border border-line text-sm font-semibold text-ink hover:bg-hover"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={close}
                  className="flex min-h-10 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white"
                >
                  Staff sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
