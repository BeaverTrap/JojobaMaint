/** Base and highlight Tailwind classes per zone color. */
export const ZONE_COLOR_PALETTE: { base: string; highlight: string }[] = [
  { base: "bg-blue-500 text-white", highlight: "bg-blue-700 text-white ring-2 ring-white" },
  { base: "bg-green-500 text-white", highlight: "bg-green-700 text-white ring-2 ring-white" },
  { base: "bg-amber-500 text-white", highlight: "bg-amber-700 text-white ring-2 ring-white" },
  { base: "bg-red-500 text-white", highlight: "bg-red-700 text-white ring-2 ring-white" },
  { base: "bg-purple-500 text-white", highlight: "bg-purple-700 text-white ring-2 ring-white" },
  { base: "bg-cyan-500 text-white", highlight: "bg-cyan-700 text-white ring-2 ring-white" },
  { base: "bg-orange-500 text-white", highlight: "bg-orange-700 text-white ring-2 ring-white" },
  { base: "bg-pink-500 text-white", highlight: "bg-pink-700 text-white ring-2 ring-white" },
  { base: "bg-teal-500 text-white", highlight: "bg-teal-700 text-white ring-2 ring-white" },
  { base: "bg-indigo-500 text-white", highlight: "bg-indigo-700 text-white ring-2 ring-white" },
  { base: "bg-emerald-500 text-white", highlight: "bg-emerald-700 text-white ring-2 ring-white" },
  { base: "bg-rose-500 text-white", highlight: "bg-rose-700 text-white ring-2 ring-white" },
];

export const ZONE_FILL_RGBA: string[] = [
  "rgba(59, 130, 246, 0.28)",
  "rgba(34, 197, 94, 0.28)",
  "rgba(245, 158, 11, 0.28)",
  "rgba(239, 68, 68, 0.28)",
  "rgba(168, 85, 247, 0.28)",
  "rgba(6, 182, 212, 0.28)",
  "rgba(249, 115, 22, 0.28)",
  "rgba(236, 72, 153, 0.28)",
  "rgba(20, 184, 166, 0.28)",
  "rgba(99, 102, 241, 0.28)",
  "rgba(16, 185, 129, 0.28)",
  "rgba(244, 63, 94, 0.28)",
];

export type ZoneColorMap = Record<string, { base: string; highlight: string }>;

export function buildZoneColorMap(zoneNames: string[]): ZoneColorMap {
  const sorted = [...zoneNames].sort((a, b) => a.localeCompare(b));
  const map: ZoneColorMap = {};
  sorted.forEach((zone, i) => {
    map[zone] = ZONE_COLOR_PALETTE[i % ZONE_COLOR_PALETTE.length];
  });
  return map;
}

export function getZoneFillColor(zoneName: string, zoneNames: string[]): string {
  const sorted = [...zoneNames].sort((a, b) => a.localeCompare(b));
  const i = sorted.indexOf(zoneName);
  if (i === -1) return "rgba(245, 158, 11, 0.25)";
  return ZONE_FILL_RGBA[i % ZONE_FILL_RGBA.length];
}
