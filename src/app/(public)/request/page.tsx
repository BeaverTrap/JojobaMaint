import RequestPortalPlaceholder from "@/components/RequestPortalPlaceholder";
import { getMaintainXPortalUrl } from "@/lib/maintainx";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Submit a Work Request",
  description:
    "Submit a maintenance work request for Jojoba Hills SKP Resort.",
};

export default function RequestPage() {
  const portalUrl = getMaintainXPortalUrl();
  if (portalUrl) redirect(portalUrl);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          Submit a Work Request
        </h1>
        <p className="text-sm text-muted">
          Report maintenance issues, request repairs, or ask for help from the
          maintenance team.
        </p>
      </header>

      <RequestPortalPlaceholder />
    </div>
  );
}
