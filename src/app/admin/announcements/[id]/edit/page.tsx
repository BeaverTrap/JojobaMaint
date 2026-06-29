import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaffRole } from "@/lib/require-staff-role";
import { ANNOUNCEMENT_SELECT } from "@/lib/announcements";
import AnnouncementForm from "@/components/AnnouncementForm";
import EndAlertButton from "@/components/EndAlertButton";
import DeleteAnnouncementButton from "@/components/DeleteAnnouncementButton";
import { isAlertActive } from "@/lib/park-alerts";
import type { AnnouncementWithAuthor } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaffRole("manager");
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const announcement = data as unknown as AnnouncementWithAuthor;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/announcements"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Park alerts
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink">
          Edit park alert
        </h1>
        {announcement.published ? (
          <Link
            href="/"
            className="mt-1 inline-block text-sm text-brand-700 hover:underline"
          >
            View on home page →
          </Link>
        ) : null}
      </div>

      <AnnouncementForm
        mode="edit"
        announcementId={announcement.id}
        initialTitle={announcement.title}
        initialBody={announcement.body}
        initialSeverity={announcement.severity}
        initialAlertType={announcement.alert_type ?? "general"}
        initialStartsAt={announcement.starts_at}
        initialEndsAt={announcement.ends_at}
        initialPublished={announcement.published}
        initialPosition={announcement.position}
        redirectTo="/admin/announcements"
      />

      {isAlertActive(announcement) ? (
        <EndAlertButton
          announcementId={announcement.id}
          redirectTo="/admin/announcements"
        />
      ) : null}

      <div className="border-t border-line pt-4">
        <DeleteAnnouncementButton
          announcementId={announcement.id}
          redirectTo="/admin/announcements"
        />
      </div>
    </div>
  );
}
