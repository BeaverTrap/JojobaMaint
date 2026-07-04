import type { MascotAvatarSettings } from "@/app/api/mascot-settings/route";

type SettingsMap = Record<string, MascotAvatarSettings>;

let cached: SettingsMap | null = null;
let fetchPromise: Promise<SettingsMap> | null = null;

const DEFAULTS: MascotAvatarSettings = {
  scene_id: "",
  overhang_pct: 20,
  scale_pct: 100,
  offset_y: 0,
};

async function load(): Promise<SettingsMap> {
  try {
    const res = await fetch("/api/mascot-settings");
    if (!res.ok) return {};
    const rows: MascotAvatarSettings[] = await res.json();
    const map: SettingsMap = {};
    for (const r of rows) map[r.scene_id] = r;
    return map;
  } catch {
    return {};
  }
}

/**
 * Returns cached settings synchronously if available, otherwise triggers a
 * background fetch and returns defaults. The component should re-render
 * once the fetch completes via the provided `onReady` callback.
 */
export function getMascotSettings(
  sceneId: string,
  onReady?: () => void,
): MascotAvatarSettings {
  if (cached) {
    return cached[sceneId] ?? { ...DEFAULTS, scene_id: sceneId };
  }

  if (!fetchPromise) {
    fetchPromise = load().then((map) => {
      cached = map;
      return map;
    });
  }

  fetchPromise.then(() => onReady?.());

  return { ...DEFAULTS, scene_id: sceneId };
}

/** Force a refetch (e.g. after saving new settings). */
export function invalidateMascotSettings() {
  cached = null;
  fetchPromise = null;
}
