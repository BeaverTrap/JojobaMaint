import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ADMIN_CREATE_LINKS,
  ADMIN_MANAGE_LINKS,
  WEBMASTER_TOOLS_LINKS,
  adminHubLinksForRole,
} from "@/lib/admin-hub";
import type { AdminHubLink } from "@/lib/admin-hub";
import { MascotScene } from "@/components/Brand";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";
import DebugModeCard from "@/components/DebugModeCard";

export default function AdminHubSections({
  staffRole,
  displayName,
}: {
  staffRole: StaffRole;
  displayName?: string;
}) {
  const createLinks = adminHubLinksForRole(ADMIN_CREATE_LINKS, staffRole);
  const manageLinks = adminHubLinksForRole(ADMIN_MANAGE_LINKS, staffRole);
  const webmasterLinks = adminHubLinksForRole(
    WEBMASTER_TOOLS_LINKS,
    staffRole,
  );

  const firstName = displayName?.trim().split(/\s+/)[0];

  const allLinks = [
    ...(createLinks.length > 0 ? [{ title: "", links: createLinks }] : []),
    ...(manageLinks.length > 0 ? [{ title: "Admin", links: manageLinks }] : []),
    ...(webmasterLinks.length > 0
      ? [{ title: "Webmaster", links: webmasterLinks }]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight text-ink">
          {firstName ? `Welcome, ${firstName}` : "Dashboard"}
        </h1>
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800">
          {STAFF_ROLE_LABELS[staffRole]}
        </span>
      </div>

      {allLinks.map((section) => (
        <HubSection key={section.title || "_staff"} title={section.title}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {section.links.map((link) => (
              <HubLinkCard key={link.href} link={link} />
            ))}
          </div>
        </HubSection>
      ))}
    </div>
  );
}

function HubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      {title ? (
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

function HubLinkCard({ link }: { link: AdminHubLink }) {
  const className =
    "group relative flex h-[4.5rem] items-end overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition hover:border-brand-300 hover:shadow-md active:scale-[0.98]";

  const body = (
    <>
      {link.image ? (
        <Image
          src={link.image}
          alt=""
          aria-hidden
          width={160}
          height={160}
          unoptimized
          className="absolute right-0 top-1/2 h-24 w-24 -translate-y-1/2 object-cover object-top transition-transform duration-300 group-hover:scale-110"
        />
      ) : link.scene ? (
        <MascotScene
          scene={link.scene}
          size={80}
          className="absolute right-0 top-1/2 -translate-y-1/2 transition-transform duration-300 group-hover:scale-110"
        />
      ) : null}
      <span className="absolute inset-0 bg-gradient-to-r from-surface from-40% via-surface/80 to-transparent" />
      <span className="relative z-10 px-3 pb-2 text-[13px] font-bold leading-tight text-ink">
        {link.title}
        {link.newTab ? (
          <span aria-hidden className="ml-1 text-[10px] text-muted">↗</span>
        ) : null}
      </span>
    </>
  );

  if (link.href === "#debug") {
    return <DebugModeCard className={className}>{body}</DebugModeCard>;
  }

  if (link.newTab) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {body}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {body}
    </Link>
  );
}
