import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PickupGuidelinesForm from "@/components/PickupGuidelinesForm";
import { fetchPickupGuidelines } from "@/lib/pickup-guidelines";

export const dynamic = "force-dynamic";

export default async function AdminPickupGuidelinesPage() {
  const supabase = await createClient();
  const guidelines = await fetchPickupGuidelines(supabase);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Edit pickup guidelines
        </h1>
        <Link
          href="/pickup-guidelines"
          className="mt-1 inline-block text-sm text-brand-700 hover:underline"
        >
          View public page →
        </Link>
      </div>

      <PickupGuidelinesForm
        initialTitle={guidelines.title}
        initialBody={guidelines.body}
        initialSummerSchedule={guidelines.is_summer_schedule}
      />
    </div>
  );
}
