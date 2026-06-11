import RequestPortalEmbed from "@/components/RequestPortalEmbed";
import RequestPortalPlaceholder from "@/components/RequestPortalPlaceholder";
import { getMaintainXPortalUrl } from "@/lib/maintainx";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a Work Request",
  description:
    "Submit a maintenance work request for Jojoba Hills SKP Resort.",
};

export default function RequestPage() {
  const portalUrl = getMaintainXPortalUrl();

  return (
    <div className="flex min-h-[calc(100dvh-10rem)] flex-col gap-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Submit a Work Request
        </h1>
        <p className="text-sm text-muted">
          Report maintenance issues, request repairs, or ask for help from the
          maintenance team.
        </p>
      </header>

      {portalUrl ? (
        <RequestPortalEmbed url={portalUrl} />
      ) : (
        <RequestPortalPlaceholder />
      )}
    </div>
  );
}
