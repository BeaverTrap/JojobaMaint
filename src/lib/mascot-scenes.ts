/** Optional scene illustrations — drop PNGs in public/assets/mascot/ (see README there). */

export type MascotSceneId =
  | "default"
  | "welcome"
  | "search"
  | "tools"
  | "reading"
  | "map"
  | "calendar"
  | "sleep";

export const MASCOT_DEFAULT_SRC = "/assets/mascot.png";
export const MASCOT_FALLBACK_SRC = "/assets/maintenance_Quail_wht.png";

export type MascotSceneDef = {
  src: string;
  alt: string;
  /** Shown when the scene file is missing — usually mascot.png */
  fallback?: string;
};

export const MASCOT_SCENES: Record<MascotSceneId, MascotSceneDef> = {
  default: {
    src: MASCOT_DEFAULT_SRC,
    alt: "Jojoba quail mascot",
    fallback: MASCOT_FALLBACK_SRC,
  },
  welcome: {
    src: "/assets/mascot/welcome.png",
    alt: "Quail waving hello",
    fallback: MASCOT_DEFAULT_SRC,
  },
  search: {
    src: "/assets/mascot/search.png",
    alt: "Quail searching",
    fallback: MASCOT_DEFAULT_SRC,
  },
  tools: {
    src: "/assets/mascot/tools.png",
    alt: "Quail with maintenance tools",
    fallback: MASCOT_DEFAULT_SRC,
  },
  reading: {
    src: "/assets/mascot/reading.png",
    alt: "Quail reading a guide",
    fallback: MASCOT_DEFAULT_SRC,
  },
  map: {
    src: "/assets/mascot/map.png",
    alt: "Quail with a park map",
    fallback: MASCOT_DEFAULT_SRC,
  },
  calendar: {
    src: "/assets/mascot/calendar.png",
    alt: "Quail checking the schedule",
    fallback: MASCOT_DEFAULT_SRC,
  },
  sleep: {
    src: "/assets/mascot/sleep.png",
    alt: "Quail resting",
    fallback: MASCOT_DEFAULT_SRC,
  },
};
