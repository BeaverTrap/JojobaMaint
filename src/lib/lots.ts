import type { SupabaseClient } from "@supabase/supabase-js";
import type { Lot } from "@/lib/database.types";

export async function fetchLots(supabase: SupabaseClient): Promise<Lot[]> {
  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .order("lot_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Lot[];
}

export async function fetchLotBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<Lot | null> {
  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Lot | null) ?? null;
}

export function formatCrossConnection(
  value: boolean | null | undefined,
): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}
