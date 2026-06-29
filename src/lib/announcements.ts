import type { SupabaseClient } from "@supabase/supabase-js";
import type { AnnouncementWithAuthor } from "@/lib/database.types";

export const ANNOUNCEMENT_SELECT =
  "id, title, body, severity, alert_type, starts_at, ends_at, published, position, author_id, created_at, updated_at, " +
  "author:profiles(id, display_name, avatar_url)";

export async function fetchActiveAnnouncements(
  supabase: SupabaseClient,
): Promise<AnnouncementWithAuthor[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("position", { ascending: true })
    .order("starts_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AnnouncementWithAuthor[];
}

export async function fetchAllAnnouncementsForAdmin(
  supabase: SupabaseClient,
): Promise<AnnouncementWithAuthor[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as AnnouncementWithAuthor[];
}

export function announcementSeverityLabel(
  severity: AnnouncementWithAuthor["severity"],
): string {
  switch (severity) {
    case "urgent":
      return "Urgent";
    case "notice":
      return "Notice";
    case "info":
      return "Info";
    default: {
      const _exhaustive: never = severity;
      return _exhaustive;
    }
  }
}

export function announcementStatusLabel(
  row: Pick<
    AnnouncementWithAuthor,
    "published" | "starts_at" | "ends_at"
  >,
): string {
  if (!row.published) return "Draft";
  const now = Date.now();
  const starts = new Date(row.starts_at).getTime();
  const ends = row.ends_at ? new Date(row.ends_at).getTime() : null;
  if (starts > now) return "Scheduled";
  if (ends !== null && ends <= now) return "Expired";
  return "Active";
}

export function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
