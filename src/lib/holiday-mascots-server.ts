import { createClient } from "@/lib/supabase/server";
import { isDateInRange } from "@/lib/holiday-mascots";

export type ServerHolidayMascot = {
  id: string;
  label: string;
  src: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  calendar_month: number | null;
  calendar_day: number | null;
  calendar_end_month: number | null;
  calendar_end_day: number | null;
  holiday_name: string | null;
  year: number | null;
};

/**
 * Server-side: fetch active holiday mascots from the DB and return one
 * that's active today (randomly picked if multiple are active).
 * Returns null if no holiday mascot is active.
 */
export async function getServerHolidayMascot(): Promise<ServerHolidayMascot | null> {
  const supabase = await createClient();
  const today = new Date();
  const currentYear = today.getFullYear();

  const { data } = await supabase
    .from("site_holiday_mascots")
    .select("id, label, src, start_month, start_day, end_month, end_day, calendar_month, calendar_day, calendar_end_month, calendar_end_day, holiday_name, year")
    .eq("active", true)
    .or(`year.is.null,year.eq.${currentYear}`)
    .order("sort_order", { ascending: true });

  if (!data || data.length === 0) return null;

  const active = data.filter((m) =>
    isDateInRange(today, m.start_month, m.start_day, m.end_month, m.end_day),
  );

  if (active.length === 0) return null;

  return active[Math.floor(Math.random() * active.length)];
}

/**
 * Server-side: fetch all active holiday mascots (for calendar rendering).
 */
export async function getAllHolidayMascots(): Promise<ServerHolidayMascot[]> {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data } = await supabase
    .from("site_holiday_mascots")
    .select("id, label, src, start_month, start_day, end_month, end_day, calendar_month, calendar_day, calendar_end_month, calendar_end_day, holiday_name, year")
    .eq("active", true)
    .or(`year.is.null,year.eq.${currentYear}`)
    .order("sort_order", { ascending: true });

  return (data ?? []) as ServerHolidayMascot[];
}
