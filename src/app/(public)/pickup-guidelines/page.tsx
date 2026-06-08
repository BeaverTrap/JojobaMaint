import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import ArticleBody from "@/components/ArticleBody";
import { pickupScheduleLabel } from "@/lib/pickup-schedule";
import { fetchPickupGuidelines } from "@/lib/pickup-guidelines";

export const dynamic = "force-dynamic";

export default async function PickupGuidelinesPage() {
  const supabase = await createClient();
  const { isAuthorized } = await getCurrentUser();
  const guidelines = await fetchPickupGuidelines(supabase);

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to feed
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {guidelines.title}
        </h1>
        <p className="mt-2 text-xs text-muted">
          Updated {format(new Date(guidelines.updated_at), "MMM d, yyyy")} ·{" "}
          {pickupScheduleLabel(
            guidelines.is_summer_schedule ? "summer" : "regular",
          )}
        </p>
        {isAuthorized && (
          <Link
            href="/admin/pickup-guidelines"
            className="mt-3 inline-flex rounded-xl border border-line px-4 py-2 text-sm font-medium text-ink transition hover:bg-hover"
          >
            Edit guidelines
          </Link>
        )}
      </div>

      <ArticleBody body={guidelines.body} />
    </article>
  );
}
