import {
  hasResolutionInfo,
  resolutionStatusLabel,
} from "@/lib/tree-assessment-display";
import type { TreeAssessment } from "@/lib/database.types";

export default function AssessmentResolutionSection({
  assessment,
}: {
  assessment: Pick<TreeAssessment, "resolution_status" | "resolution_notes">;
}) {
  if (!hasResolutionInfo(assessment)) return null;

  const statusLabel = resolutionStatusLabel(assessment.resolution_status);
  const notes = assessment.resolution_notes?.trim();

  return (
    <section className="rounded-2xl border border-line bg-surface px-5 py-4">
      <h2 className="text-lg font-bold text-ink">Resolution</h2>
      {statusLabel && (
        <p className="mt-2 text-base">
          <span className="font-semibold text-ink">Status: </span>
          <span className="text-brand-700">{statusLabel}</span>
        </p>
      )}
      {notes && (
        <p className="mt-3 text-base leading-relaxed text-ink whitespace-pre-wrap">
          {notes}
        </p>
      )}
    </section>
  );
}
