import Link from "next/link";
import type { ReactNode } from "react";
import {
  ADMIN_CREATE_LINKS,
  ADMIN_MANAGE_LINKS,
  ADMIN_TOOLS_LINKS,
  adminHubLinksForRole,
} from "@/lib/admin-hub";
import type { AdminHubLink } from "@/lib/admin-hub";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";

export default function AdminHubSections({
  staffRole,
  activeArea,
}: {
  staffRole: StaffRole;
  activeArea?: "landscaping" | "maintenance";
}) {
  const createLinks = adminHubLinksForRole(ADMIN_CREATE_LINKS, staffRole);
  const manageLinks = adminHubLinksForRole(ADMIN_MANAGE_LINKS, staffRole);
  const adminLinks = adminHubLinksForRole(ADMIN_TOOLS_LINKS, staffRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create feed posts, manage site content, and open edit tools.
          </p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800">
          {STAFF_ROLE_LABELS[staffRole]}
        </span>
      </div>

      {createLinks.length > 0 ? (
        <HubSection title="Create">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {createLinks.map((link) => (
              <HubLinkCard
                key={link.href}
                link={link}
                active={
                  link.href === `/admin?area=${activeArea}` &&
                  activeArea !== undefined
                }
              />
            ))}
          </div>
        </HubSection>
      ) : null}

      {manageLinks.length > 0 ? (
        <HubSection title="Manage">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {manageLinks.map((link) => (
              <HubLinkCard key={link.href} link={link} />
            ))}
          </div>
        </HubSection>
      ) : null}

      {adminLinks.length > 0 ? (
        <HubSection
          title="Admin"
          description="Staff roles are set on each email in the authorized_emails whitelist (staff, manager, or admin)."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {adminLinks.map((link) => (
              <HubLinkCard key={link.href} link={link} />
            ))}
          </div>
        </HubSection>
      ) : null}
    </div>
  );
}

function HubSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function HubLinkCard({
  link,
  active = false,
}: {
  link: AdminHubLink;
  active?: boolean;
}) {
  return (
    <Link
      href={link.href}
      className={
        active
          ? "block rounded-2xl border-2 border-brand-600 bg-brand-50 p-4 shadow-sm dark:bg-brand-950/40"
          : "block rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-brand-300 hover:bg-hover"
      }
    >
      <p className="font-semibold text-ink">{link.title}</p>
      <p className="mt-1 text-sm leading-snug text-muted">{link.description}</p>
    </Link>
  );
}
