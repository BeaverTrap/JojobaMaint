import type { WaterCompareWindow } from "@/lib/water-monthly-report";

export const WATER_CHART_SECTION_IDS = [
  "mix",
  "compare",
  "snapshot",
  "pump",
  "pond",
  "irrigation",
  "rigs",
  "categories",
  "trend",
] as const;

export type WaterChartSectionId = (typeof WATER_CHART_SECTION_IDS)[number];

export type WaterChartWindowKey =
  | "mix"
  | "compare"
  | "pump"
  | "pond"
  | "irrigation"
  | "rigs"
  | "categories"
  | "trend";

export type WaterChartPreferences = {
  collapsed: WaterChartSectionId[];
  windows: Record<WaterChartWindowKey, WaterCompareWindow>;
  order: WaterChartSectionId[];
};

const STORAGE_KEY = "jojobaworks-water-chart-preferences";

export const DEFAULT_WATER_CHART_PREFERENCES: WaterChartPreferences = {
  collapsed: [],
  windows: {
    mix: 12,
    compare: 6,
    pump: 6,
    pond: 6,
    irrigation: 6,
    rigs: 6,
    categories: 12,
    trend: 12,
  },
  order: [
    "mix",
    "compare",
    "snapshot",
    "pump",
    "categories",
    "trend",
    "pond",
    "irrigation",
    "rigs",
  ],
};

/** Previous default before pond / irrigation / rigs moved to the bottom. */
const LEGACY_DEFAULT_CHART_ORDER: WaterChartSectionId[] = [
  "mix",
  "compare",
  "snapshot",
  "pump",
  "pond",
  "irrigation",
  "rigs",
  "categories",
  "trend",
];

function chartOrdersEqual(
  a: readonly WaterChartSectionId[],
  b: readonly WaterChartSectionId[],
): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function migrateLegacyDefaultOrder(
  order: WaterChartSectionId[],
): WaterChartSectionId[] {
  if (chartOrdersEqual(order, LEGACY_DEFAULT_CHART_ORDER)) {
    return [...DEFAULT_WATER_CHART_PREFERENCES.order];
  }
  return order;
}

const SECTION_ID_SET = new Set<string>(WATER_CHART_SECTION_IDS);
const WINDOW_KEYS = Object.keys(
  DEFAULT_WATER_CHART_PREFERENCES.windows,
) as WaterChartWindowKey[];

function parseWindowValue(value: unknown): WaterCompareWindow | null {
  if (value === 6 || value === 12) return value;
  return null;
}

export function normalizeChartOrder(
  order: readonly string[],
): WaterChartSectionId[] {
  const seen = new Set<WaterChartSectionId>();
  const normalized: WaterChartSectionId[] = [];

  for (const id of order) {
    if (SECTION_ID_SET.has(id) && !seen.has(id as WaterChartSectionId)) {
      const sectionId = id as WaterChartSectionId;
      seen.add(sectionId);
      normalized.push(sectionId);
    }
  }

  for (const id of WATER_CHART_SECTION_IDS) {
    if (!seen.has(id)) normalized.push(id);
  }

  return normalized;
}

export function parseChartOrder(raw: string | null): WaterChartSectionId[] {
  if (!raw) return [...DEFAULT_WATER_CHART_PREFERENCES.order];
  return migrateLegacyDefaultOrder(
    normalizeChartOrder(raw.split(",").map((id) => id.trim())),
  );
}

export function parseCollapsedChartSections(
  raw: string | null,
): Set<WaterChartSectionId> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter((id): id is WaterChartSectionId => SECTION_ID_SET.has(id)),
  );
}

export function loadWaterChartPreferences(): WaterChartPreferences {
  if (typeof window === "undefined") return DEFAULT_WATER_CHART_PREFERENCES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WATER_CHART_PREFERENCES;

    const parsed = JSON.parse(raw) as Partial<WaterChartPreferences>;
    const collapsed = Array.isArray(parsed.collapsed)
      ? parsed.collapsed.filter((id): id is WaterChartSectionId =>
          SECTION_ID_SET.has(id),
        )
      : DEFAULT_WATER_CHART_PREFERENCES.collapsed;

    const windows = { ...DEFAULT_WATER_CHART_PREFERENCES.windows };
    if (parsed.windows && typeof parsed.windows === "object") {
      for (const key of WINDOW_KEYS) {
        const value = parseWindowValue(parsed.windows[key]);
        if (value != null) windows[key] = value;
      }
    }

    const order = migrateLegacyDefaultOrder(
      normalizeChartOrder(Array.isArray(parsed.order) ? parsed.order : []),
    );

    return { collapsed, windows, order };
  } catch {
    return DEFAULT_WATER_CHART_PREFERENCES;
  }
}

export function saveWaterChartPreferences(prefs: WaterChartPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Private browsing or quota — ignore.
  }
}

export function waterChartWindowKeys(): WaterChartWindowKey[] {
  return WINDOW_KEYS;
}

export function isWaterChartWindowKey(
  key: string,
): key is WaterChartWindowKey {
  return WINDOW_KEYS.includes(key as WaterChartWindowKey);
}

export function readStoredChartWindow(
  key: WaterChartWindowKey,
  legacyWindow: string | null,
  urlValue: string | null,
  defaultWindow: WaterCompareWindow,
): WaterCompareWindow {
  if (urlValue === "12") return 12;
  if (urlValue === "6") return 6;
  if (legacyWindow === "12") return 12;
  if (legacyWindow === "6") return 6;
  if (typeof window === "undefined") return defaultWindow;
  return loadWaterChartPreferences().windows[key] ?? defaultWindow;
}
