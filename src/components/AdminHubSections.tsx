import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ADMIN_CREATE_LINKS,
  ADMIN_MANAGE_LINKS,
  ADMIN_PUBLIC_LINKS,
  ADMIN_TOOLS_LINKS,
  WEBMASTER_TOOLS_LINKS,
  adminHubLinksForRole,
} from "@/lib/admin-hub";
import type { AdminHubLink } from "@/lib/admin-hub";
import { MascotScene } from "@/components/Brand";
import WeatherMascotStack from "@/components/WeatherMascotStack";
import { STAFF_ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";

export default function AdminHubSections({
  staffRole,
  displayName,
}: {
  staffRole: StaffRole;
  displayName?: string;
}) {
  const createLinks = adminHubLinksForRole(ADMIN_CREATE_LINKS, staffRole);
  const manageLinks = adminHubLinksForRole(ADMIN_MANAGE_LINKS, staffRole);
  const publicLinks = adminHubLinksForRole(ADMIN_PUBLIC_LINKS, staffRole);
  const adminLinks = adminHubLinksForRole(ADMIN_TOOLS_LINKS, staffRole);
  const webmasterLinks = adminHubLinksForRole(
    WEBMASTER_TOOLS_LINKS,
    staffRole,
  );

  const firstName = displayName?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-ink">
          {firstName ? `Welcome, ${firstName}` : "Dashboard"}
        </h1>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-200 dark:bg-brand-950 dark:text-brand-200 dark:ring-brand-800">
          {STAFF_ROLE_LABELS[staffRole]}
        </span>
      </div>

      {createLinks.length > 0 ? (
        <HubSection title="Create">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {createLinks.map((link) => (
              <HubLinkCard key={link.href} link={link} />
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

      {publicLinks.length > 0 ? (
        <HubSection title="Public pages">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {publicLinks.map((link) => (
              <HubLinkCard key={link.href} link={link} />
            ))}
          </div>
        </HubSection>
      ) : null}

      {adminLinks.length > 0 ? (
        <HubSection title="Admin">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {adminLinks.map((link) => (
              <HubLinkCard key={link.href} link={link} />
            ))}
          </div>
        </HubSection>
      ) : null}

      {webmasterLinks.length > 0 ? (
        <HubSection title="Webmaster">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {webmasterLinks.map((link) => (
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
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink">
        {title}
      </h2>
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
  const className = active
    ? "group relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-brand-600 bg-brand-50 p-4 shadow-sm dark:bg-brand-950/40"
    : "group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-brand-300 hover:bg-hover";

  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          {link.title}
          {link.newTab ? (
            <span aria-hidden className="text-xs text-muted">
              ↗
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-sm leading-snug text-muted">
          {link.description}
        </p>
      </div>
      {link.widget === "weather" ? (
        <WeatherMascotStack
          temperatureF={78}
          weatherLabel="Sunny"
          weatherCode={0}
          isDay
          width={168}
          className="shrink-0 self-center transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : link.image ? (
        <Image
          src={link.image}
          alt=""
          aria-hidden
          width={128}
          height={128}
          unoptimized
          className="h-16 w-16 shrink-0 object-contain drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : link.scene ? (
        <MascotScene
          scene={link.scene}
          size={64}
          className="shrink-0 drop-shadow-sm transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : null}
    </>
  );

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
