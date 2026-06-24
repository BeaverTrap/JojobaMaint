import RequestPortalPlaceholder from "@/components/RequestPortalPlaceholder";
import PageMascotHeading from "@/components/PageMascotHeading";
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
      <PageMascotHeading
        scene="sleep"
        title="Submit a Work Request"
        description="Report maintenance issues, request repairs, or ask for help from the maintenance team."
      />

      <RequestPortalPlaceholder />
    </div>
  );
}
