import Link from "next/link";
import { formatPostedEditedLines } from "@/lib/content-dates";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import {
  announcementStatusLabel,
  fetchAllAnnouncementsForAdmin,
} from "@/lib/announcements";
import { parkAlertTypeLabel } from "@/lib/park-alerts";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireStaffRole("manager");
  const supabase = await createClient();
  const announcements = await fetchAllAnnouncementsForAdmin(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
            Park alerts
          </h1>
        </div>
        <Link
          href="/admin/announcements/new"
          className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          + New alert
        </Link>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <p className="text-sm text-muted">No alerts yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {announcements.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/announcements/${item.id}/edit`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-hover"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-muted">
                    {parkAlertTypeLabel(item.alert_type ?? "general")} ·{" "}
                    {announcementStatusLabel(item)} ·{" "}
                    {formatPostedEditedLines(item.created_at, item.updated_at).join(
                      " · ",
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-brand-700">Edit →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
