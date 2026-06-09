import Link from "next/link";
import PrintReportButton from "@/components/PrintReportButton";
import ShareButtons from "@/components/ShareButtons";
import type { ShareableContent } from "@/lib/social-share";

/** Top-of-page actions for printable detail views. */
export default function PrintReportToolbar({
  backHref,
  backLabel,
  fileName,
  shareContent,
}: {
  backHref: string;
  backLabel: string;
  fileName: string;
  shareContent: ShareableContent;
}) {
  return (
    <div className="no-print space-y-3">
      <Link
        href={backHref}
        className="text-sm font-medium text-brand-700 hover:underline"
      >
        {backLabel}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ShareButtons
          content={shareContent}
          variant="inline"
          className="px-0 py-0"
        />
        <PrintReportButton fileName={fileName} />
      </div>
    </div>
  );
}
