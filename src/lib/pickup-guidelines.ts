import type { SupabaseClient } from "@supabase/supabase-js";
import type { PickupGuidelines } from "@/lib/database.types";
import {
  DEFAULT_PICKUP_GUIDELINES_BODY,
  DEFAULT_PICKUP_GUIDELINES_TITLE,
} from "@/lib/pickup-guidelines-default";

export const PICKUP_GUIDELINES_ID = "default";

export const PICKUP_GUIDELINES_SELECT =
  "id, title, body, is_summer_schedule, updated_at";

export function defaultPickupGuidelines(): PickupGuidelines {
  return {
    id: PICKUP_GUIDELINES_ID,
    title: DEFAULT_PICKUP_GUIDELINES_TITLE,
    body: DEFAULT_PICKUP_GUIDELINES_BODY,
    is_summer_schedule: true,
    updated_at: new Date(0).toISOString(),
  };
}

export async function fetchPickupGuidelines(
  supabase: SupabaseClient,
): Promise<PickupGuidelines> {
  const { data, error } = await supabase
    .from("pickup_guidelines")
    .select(PICKUP_GUIDELINES_SELECT)
    .eq("id", PICKUP_GUIDELINES_ID)
    .maybeSingle();

  if (error || !data) {
    return defaultPickupGuidelines();
  }

  return data as PickupGuidelines;
}
