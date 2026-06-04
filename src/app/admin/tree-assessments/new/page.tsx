import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchTreeAssessmentConcerns } from "@/lib/tree-assessments";
import TreeAssessmentForm from "@/components/TreeAssessmentForm";

export const dynamic = "force-dynamic";

export default async function NewTreeAssessmentPage() {
  const supabase = await createClient();
  const concerns = await fetchTreeAssessmentConcerns(supabase);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/tree-assessments"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Tree assessments
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          New tree assessment
        </h1>
        <p className="text-sm text-muted">
          Record what was found on a specific lot. Publish when ready so
          residents can read it.
        </p>
      </div>

      <TreeAssessmentForm
        mode="create"
        concerns={concerns}
        redirectTo="/admin/tree-assessments"
      />
    </div>
  );
}
