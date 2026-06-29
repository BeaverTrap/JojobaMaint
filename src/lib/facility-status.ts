import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ParkFacilityBuilding,
  ParkFacilityLocationId,
  ParkFacilityStatus,
  ParkRestroomStatus,
} from "@/lib/database.types";

export const FACILITY_LOCATION_ORDER: ParkFacilityLocationId[] = [
  "west",
  "east",
  "boondocks",
  "friendship_hall",
  "office_ranch",
];

export const FACILITY_STATUS_SELECT =
  "id, label, sort_order, washer_count, dryer_count, pet_washer_count, water_heater_count, kitchen_sink_count, oven_count, washers_out_of_order, dryers_out_of_order, pet_washers_out_of_order, water_heaters_out_of_order, kitchen_sinks_out_of_order, ovens_out_of_order, laundry_note, pet_washer_note, water_heater_note, kitchen_note, note, updated_by, updated_at";

export const RESTROOM_STATUS_SELECT =
  "id, building_id, label, sort_order, shower_count, stall_count, urinal_count, sink_count, showers_out_of_order, stalls_out_of_order, urinals_out_of_order, sinks_out_of_order, note, updated_by, updated_at";

function epoch(): string {
  return new Date(0).toISOString();
}

function building(
  id: ParkFacilityLocationId,
  label: string,
  sort_order: number,
  washer_count: number,
  dryer_count: number,
  pet_washer_count = 0,
  water_heater_count = 1,
  kitchen_sink_count = 0,
  oven_count = 0,
): ParkFacilityStatus {
  return {
    id,
    label,
    sort_order,
    washer_count,
    dryer_count,
    pet_washer_count,
    water_heater_count,
    kitchen_sink_count,
    oven_count,
    washers_out_of_order: 0,
    dryers_out_of_order: 0,
    pet_washers_out_of_order: 0,
    water_heaters_out_of_order: 0,
    kitchen_sinks_out_of_order: 0,
    ovens_out_of_order: 0,
    laundry_note: null,
    pet_washer_note: null,
    water_heater_note: null,
    kitchen_note: null,
    note: null,
    updated_by: null,
    updated_at: epoch(),
  };
}

function restroom(
  id: string,
  building_id: ParkFacilityLocationId,
  label: string,
  sort_order: number,
  shower_count: number,
  stall_count: number,
  urinal_count: number,
  sink_count: number,
): ParkRestroomStatus {
  return {
    id,
    building_id,
    label,
    sort_order,
    shower_count,
    stall_count,
    urinal_count,
    sink_count,
    showers_out_of_order: 0,
    stalls_out_of_order: 0,
    urinals_out_of_order: 0,
    sinks_out_of_order: 0,
    note: null,
    updated_by: null,
    updated_at: epoch(),
  };
}

const DEFAULT_BUILDINGS: ParkFacilityStatus[] = [
  building("west", "West Laundry", 1, 6, 6, 1),
  building("east", "East Laundry", 2, 6, 6, 1),
  building("boondocks", "Boondocks", 3, 4, 4),
  building("friendship_hall", "Friendship Hall", 4, 6, 6),
  building("office_ranch", "Office & Ranch House", 5, 0, 0, 0, 1, 1, 1),
];

const DEFAULT_RESTROOMS: ParkRestroomStatus[] = [
  restroom("west_mens", "west", "Men's", 1, 2, 2, 0, 2),
  restroom("west_womens", "west", "Women's", 2, 2, 2, 0, 2),
  restroom("east_mens", "east", "Men's", 1, 2, 2, 0, 2),
  restroom("east_womens", "east", "Women's", 2, 2, 2, 0, 2),
  restroom("boondocks_mens", "boondocks", "Men's", 1, 1, 1, 0, 1),
  restroom("boondocks_womens", "boondocks", "Women's", 2, 1, 1, 0, 1),
  restroom("fh_mens_1", "friendship_hall", "Men's — Room 1", 1, 0, 1, 1, 2),
  restroom("fh_mens_2", "friendship_hall", "Men's — Room 2", 2, 3, 1, 1, 2),
  restroom("fh_womens_1", "friendship_hall", "Women's — Room 1", 3, 0, 2, 0, 2),
  restroom("fh_womens_2", "friendship_hall", "Women's — Room 2", 4, 3, 2, 0, 2),
  restroom("office_restroom", "office_ranch", "Office bathroom", 1, 0, 1, 0, 1),
  restroom("ranch_house_restroom", "office_ranch", "Ranch House bathroom", 2, 0, 1, 0, 1),
];

function assemble(
  buildings: ParkFacilityStatus[],
  restrooms: ParkRestroomStatus[],
): ParkFacilityBuilding[] {
  const byBuilding = new Map<string, ParkRestroomStatus[]>();
  for (const room of restrooms) {
    const list = byBuilding.get(room.building_id) ?? [];
    list.push(room);
    byBuilding.set(room.building_id, list);
  }

  return FACILITY_LOCATION_ORDER.map((id) => {
    const base =
      buildings.find((row) => row.id === id) ??
      DEFAULT_BUILDINGS.find((row) => row.id === id)!;
    const rooms = (byBuilding.get(id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return { ...base, restrooms: rooms };
  });
}

export function defaultFacilities(): ParkFacilityBuilding[] {
  return assemble(
    DEFAULT_BUILDINGS.map((row) => ({ ...row })),
    DEFAULT_RESTROOMS.map((row) => ({ ...row })),
  );
}

export async function fetchFacilities(
  supabase: SupabaseClient,
): Promise<ParkFacilityBuilding[]> {
  const [buildingsRes, restroomsRes] = await Promise.all([
    supabase.from("park_facility_status").select(FACILITY_STATUS_SELECT),
    supabase.from("park_restroom_status").select(RESTROOM_STATUS_SELECT),
  ]);

  if (
    buildingsRes.error ||
    restroomsRes.error ||
    !buildingsRes.data?.length
  ) {
    return defaultFacilities();
  }

  return assemble(
    buildingsRes.data as ParkFacilityStatus[],
    (restroomsRes.data ?? []) as ParkRestroomStatus[],
  );
}

function restroomUnitsOut(room: ParkRestroomStatus): number {
  return (
    room.showers_out_of_order +
    room.stalls_out_of_order +
    room.urinals_out_of_order +
    room.sinks_out_of_order
  );
}

function restroomUnitsTotal(room: ParkRestroomStatus): number {
  return (
    room.shower_count +
    room.stall_count +
    room.urinal_count +
    room.sink_count
  );
}

function buildingUnitsOut(location: ParkFacilityBuilding): number {
  return (
    location.washers_out_of_order +
    location.dryers_out_of_order +
    location.pet_washers_out_of_order +
    location.water_heaters_out_of_order +
    location.kitchen_sinks_out_of_order +
    location.ovens_out_of_order +
    location.restrooms.reduce((sum, room) => sum + restroomUnitsOut(room), 0)
  );
}

function buildingUnitsTotal(location: ParkFacilityBuilding): number {
  return (
    location.washer_count +
    location.dryer_count +
    location.pet_washer_count +
    location.water_heater_count +
    location.kitchen_sink_count +
    location.oven_count +
    location.restrooms.reduce((sum, room) => sum + restroomUnitsTotal(room), 0)
  );
}

export function restroomTone(
  room: ParkRestroomStatus,
): "ok" | "warn" | "alert" {
  const out = restroomUnitsOut(room);
  if (out === 0) return "ok";
  if (out >= restroomUnitsTotal(room)) return "alert";
  return "warn";
}

/** Tone for just the laundry portion of a building. */
export function laundryTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  const total =
    location.washer_count + location.dryer_count + location.pet_washer_count;
  const out =
    location.washers_out_of_order +
    location.dryers_out_of_order +
    location.pet_washers_out_of_order;
  if (out === 0) return "ok";
  if (out >= total) return "alert";
  return "warn";
}

export function waterHeaterTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  const total = location.water_heater_count;
  const out = location.water_heaters_out_of_order;
  if (total === 0 || out === 0) return "ok";
  if (out >= total) return "alert";
  return "warn";
}

export function kitchenTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  const total = location.kitchen_sink_count + location.oven_count;
  const out =
    location.kitchen_sinks_out_of_order + location.ovens_out_of_order;
  if (total === 0 || out === 0) return "ok";
  if (out >= total) return "alert";
  return "warn";
}

/** Tone across all restrooms in a building (worst wins). */
export function restroomsTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  let tone: "ok" | "warn" | "alert" = "ok";
  for (const room of location.restrooms) {
    const roomTone = restroomTone(room);
    if (roomTone === "alert") return "alert";
    if (roomTone === "warn") tone = "warn";
  }
  return tone;
}

export function facilityLocationTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  const out = buildingUnitsOut(location);
  if (out === 0) return "ok";
  if (out >= buildingUnitsTotal(location)) return "alert";
  return "warn";
}

/** Short label for the building header when something is out of order. */
export function facilityIssueSummary(location: ParkFacilityBuilding): string {
  const parts: string[] = [];
  if (laundryTone(location) !== "ok") parts.push("Laundry");
  if (waterHeaterTone(location) !== "ok") parts.push("Hot water");
  if (kitchenTone(location) !== "ok") parts.push("Kitchen");
  if (restroomsTone(location) !== "ok") parts.push("Restrooms");
  if (parts.length === 0) return "All open";
  if (parts.length === 1) return `${parts[0]} issue`;
  return `${parts.join(" · ")} issues`;
}

export function facilitiesOverallTone(
  locations: ParkFacilityBuilding[],
): "ok" | "warn" | "alert" {
  let tone: "ok" | "warn" | "alert" = "ok";
  for (const location of locations) {
    const locationTone = facilityLocationTone(location);
    if (locationTone === "alert") return "alert";
    if (locationTone === "warn") tone = "warn";
  }
  return tone;
}

export function facilitiesOverallSummary(
  locations: ParkFacilityBuilding[],
): string {
  const unitsDown = locations.reduce(
    (sum, location) => sum + buildingUnitsOut(location),
    0,
  );
  if (unitsDown === 0) return "All facilities open";

  const buildingsAffected = locations.filter(
    (location) => buildingUnitsOut(location) > 0,
  ).length;

  return `${unitsDown} out of order across ${buildingsAffected} building${buildingsAffected === 1 ? "" : "s"}`;
}
