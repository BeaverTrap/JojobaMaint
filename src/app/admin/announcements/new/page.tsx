import Link from "next/link";
import { requireStaffRole } from "@/lib/require-staff-role";
import AnnouncementForm from "@/components/AnnouncementForm";

export const dynamic = "force-dynamic";

export default async function NewAnnouncementPage() {
  await requireStaffRole("manager");

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
          New park alert
        </h1>
      </div>

      <AnnouncementForm mode="create" redirectTo="/admin/announcements" />
    </div>
  );
}
