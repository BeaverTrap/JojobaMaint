"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { StaffRole } from "@/lib/staff-roles";
import { STAFF_ROLES, STAFF_ROLE_LABELS } from "@/lib/staff-roles";

type ViewAs = StaffRole | "public" | null;

const ROLE_COLORS: Record<StaffRole, string> = {
  staff: "bg-gray-500",
  manager: "bg-blue-500",
  admin: "bg-purple-500",
  webmaster: "bg-brand-600",
};

export default function WebmasterToolbar({
  realRole,
  debugRole,
}: {
  realRole: StaffRole;
  debugRole: ViewAs;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [currentDebug, setCurrentDebug] = useState<ViewAs>(debugRole);

  useEffect(() => {
    setCurrentDebug(debugRole);
  }, [debugRole]);

  useEffect(() => {
    function handleOpen() {
      setCollapsed(false);
    }
    window.addEventListener("jw:open-debug", handleOpen);
    return () => window.removeEventListener("jw:open-debug", handleOpen);
  }, []);

  async function switchRole(role: ViewAs) {
    setSwitching(true);
    try {
      await fetch("/api/debug/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setCurrentDebug(role === "webmaster" ? null : role);
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  const effectiveRole: StaffRole | "public" = currentDebug ?? realRole;
  const isImpersonating = currentDebug !== null;

  const effectiveLabel = effectiveRole === "public" ? "Public" : STAFF_ROLE_LABELS[effectiveRole];
  const effectiveColor = effectiveRole === "public" ? "bg-slate-400" : ROLE_COLORS[effectiveRole];

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className={`fixed bottom-4 right-4 z-[9999] flex h-8 items-center gap-1.5 rounded-full px-3 shadow-lg transition-all hover:scale-105 active:scale-95 ${
          isImpersonating ? "bg-amber-500 text-white" : "bg-ink text-surface"
        }`}
        title="Webmaster debug toolbar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-wide">
          {isImpersonating ? `As ${effectiveLabel}` : "WM"}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-ink px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-surface">Debug</span>
        <button onClick={() => setCollapsed(true)} className="text-surface/60 hover:text-surface">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="space-y-2 px-3 py-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Route</span>
          <span className="max-w-[160px] truncate font-mono text-ink">{pathname}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Real role</span>
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <span className={`inline-block h-2 w-2 rounded-full ${ROLE_COLORS[realRole]}`} />
            {STAFF_ROLE_LABELS[realRole]}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Viewing as</span>
          <span className={`flex items-center gap-1.5 font-semibold ${isImpersonating ? "text-amber-600 dark:text-amber-400" : "text-ink"}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${effectiveColor}`} />
            {effectiveLabel}
            {isImpersonating ? " ⚠" : ""}
          </span>
        </div>
      </div>

      {/* Role switcher */}
      <div className="border-t border-line px-3 py-2.5">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">View as role</span>
        <div className="grid grid-cols-2 gap-1">
          {STAFF_ROLES.map((role) => {
            const isActive = effectiveRole === role && (role === "webmaster" ? !isImpersonating : isImpersonating);
            const isReset = role === "webmaster" && !isImpersonating;
            return (
              <button
                key={role}
                disabled={switching}
                onClick={() => switchRole(role === "webmaster" ? null : role)}
                className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 ${
                  isActive || isReset
                    ? "bg-ink text-surface"
                    : "bg-gray-100 text-ink hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
                }`}
              >
                {STAFF_ROLE_LABELS[role]}
              </button>
            );
          })}
          <button
            disabled={switching}
            onClick={() => switchRole("public")}
            className={`col-span-2 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-40 ${
              effectiveRole === "public"
                ? "bg-ink text-surface"
                : "bg-gray-100 text-ink hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15"
            }`}
          >
            Public (logged out)
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="border-t border-line px-3 py-2.5">
        <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-muted">Quick nav</span>
        <div className="flex flex-wrap gap-1">
          {[
            { label: "Admin", href: "/admin" },
            { label: "Staff", href: "/admin/staff-access" },
            { label: "Facilities", href: "/admin/facilities-status" },
            { label: "SMS", href: "/admin/emergency-alerts" },
            { label: "Feed", href: "/feed" },
            { label: "Home", href: "/" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                pathname === link.href
                  ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200"
                  : "text-muted hover:bg-gray-100 hover:text-ink dark:hover:bg-white/10"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {isImpersonating ? (
        <div className="border-t border-amber-200 bg-amber-50 px-3 py-2 text-center dark:border-amber-800 dark:bg-amber-950/30">
          <button
            onClick={() => switchRole(null)}
            disabled={switching}
            className="text-[11px] font-bold text-amber-700 hover:underline disabled:opacity-40 dark:text-amber-400"
          >
            ✕ Stop impersonating
          </button>
        </div>
      ) : null}
    </div>
  );
}
