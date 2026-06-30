import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FacilityUnitState,
  ParkFacilityBuilding,
  ParkFacilityLocationId,
  ParkFacilityStatus,
  ParkRestroomStatus,
} from "@/lib/database.types";
import {
  countOut,
  defaultStatuses,
  normalizeStatuses,
  statesTone,
} from "@/lib/facility-unit-states";

export const FACILITY_LOCATION_ORDER: ParkFacilityLocationId[] = [
  "west",
  "east",
  "boondocks",
  "friendship_hall",
  "office_ranch",
];

export const FACILITY_STATUS_SELECT =
  "id, label, sort_order, washer_count, dryer_count, pet_washer_count, water_heater_count, kitchen_sink_count, oven_count, washer_statuses, dryer_statuses, pet_washer_statuses, water_heater_statuses, kitchen_sink_statuses, oven_statuses, laundry_note, pet_washer_note, water_heater_note, kitchen_note, note, updated_by, updated_at";

export const RESTROOM_STATUS_SELECT =
  "id, building_id, label, sort_order, shower_count, stall_count, urinal_count, sink_count, shower_statuses, stall_statuses, urinal_statuses, sink_statuses, closed, note, updated_by, updated_at";

function epoch(): string {
  return new Date(0).toISOString();
}

function parseStatuses(raw: unknown): FacilityUnitState[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((value) => (value === "out" ? "out" : "ok"));
}

function normalizeBuilding(row: ParkFacilityStatus): ParkFacilityStatus {
  return {
    ...row,
    washer_statuses: normalizeStatuses(
      row.washer_count,
      parseStatuses(row.washer_statuses),
    ),
    dryer_statuses: normalizeStatuses(
      row.dryer_count,
      parseStatuses(row.dryer_statuses),
    ),
    pet_washer_statuses: normalizeStatuses(
      row.pet_washer_count,
      parseStatuses(row.pet_washer_statuses),
    ),
    water_heater_statuses: normalizeStatuses(
      row.water_heater_count,
      parseStatuses(row.water_heater_statuses),
    ),
    kitchen_sink_statuses: normalizeStatuses(
      row.kitchen_sink_count,
      parseStatuses(row.kitchen_sink_statuses),
    ),
    oven_statuses: normalizeStatuses(
      row.oven_count,
      parseStatuses(row.oven_statuses),
    ),
  };
}

function normalizeRestroom(row: ParkRestroomStatus): ParkRestroomStatus {
  return {
    ...row,
    closed: row.closed ?? false,
    shower_statuses: normalizeStatuses(
      row.shower_count,
      parseStatuses(row.shower_statuses),
    ),
    stall_statuses: normalizeStatuses(
      row.stall_count,
      parseStatuses(row.stall_statuses),
    ),
    urinal_statuses: normalizeStatuses(
      row.urinal_count,
      parseStatuses(row.urinal_statuses),
    ),
    sink_statuses: normalizeStatuses(
      row.sink_count,
      parseStatuses(row.sink_statuses),
    ),
  };
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
    washer_statuses: defaultStatuses(washer_count),
    dryer_statuses: defaultStatuses(dryer_count),
    pet_washer_statuses: defaultStatuses(pet_washer_count),
    water_heater_statuses: defaultStatuses(water_heater_count),
    kitchen_sink_statuses: defaultStatuses(kitchen_sink_count),
    oven_statuses: defaultStatuses(oven_count),
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
    shower_statuses: defaultStatuses(shower_count),
    stall_statuses: defaultStatuses(stall_count),
    urinal_statuses: defaultStatuses(urinal_count),
    sink_statuses: defaultStatuses(sink_count),
    closed: false,
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
    list.push(normalizeRestroom(room));
    byBuilding.set(room.building_id, list);
  }

  return FACILITY_LOCATION_ORDER.map((id) => {
    const base =
      buildings.find((row) => row.id === id) ??
      DEFAULT_BUILDINGS.find((row) => row.id === id)!;
    const rooms = (byBuilding.get(id) ?? []).sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return { ...normalizeBuilding(base), restrooms: rooms };
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
  if (room.closed) {
    return (
      room.shower_count +
      room.stall_count +
      room.urinal_count +
      room.sink_count
    );
  }
  return (
    countOut(room.shower_statuses) +
    countOut(room.stall_statuses) +
    countOut(room.urinal_statuses) +
    countOut(room.sink_statuses)
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
    countOut(location.washer_statuses) +
    countOut(location.dryer_statuses) +
    countOut(location.pet_washer_statuses) +
    countOut(location.water_heater_statuses) +
    countOut(location.kitchen_sink_statuses) +
    countOut(location.oven_statuses) +
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
  if (room.closed) return "alert";
  const all = [
    ...room.shower_statuses,
    ...room.stall_statuses,
    ...room.urinal_statuses,
    ...room.sink_statuses,
  ];
  return statesTone(all);
}

/** Tone for just the laundry portion of a building. */
export function laundryTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  const all = [
    ...location.washer_statuses,
    ...location.dryer_statuses,
    ...location.pet_washer_statuses,
  ];
  return statesTone(all);
}

export function waterHeaterTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  return statesTone(location.water_heater_statuses);
}

export function kitchenTone(
  location: ParkFacilityBuilding,
): "ok" | "warn" | "alert" {
  const all = [
    ...location.kitchen_sink_statuses,
    ...location.oven_statuses,
  ];
  return statesTone(all);
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
