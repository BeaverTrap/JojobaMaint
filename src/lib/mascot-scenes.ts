/** Optional scene illustrations — drop PNGs in public/assets/mascot/ (see README there). */

export type MascotSceneId =
  | "default"
  | "welcome"
  | "search"
  | "tools"
  | "reading"
  | "map"
  | "calendar"
  | "sleep"
  | "weather"
  | "water"
  | "pickup"
  | "astronaut"
  | "telescope"
  | "hardhat"
  | "sunhat"
  | "alert";

export const MASCOT_DEFAULT_SRC = "/assets/Mascot_Hardhat.png";
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
  weather: {
    src: "/assets/mascot/weather.png",
    alt: "Quail checking the weather",
    fallback: MASCOT_DEFAULT_SRC,
  },
  water: {
    src: "/assets/mascot/water.png",
    alt: "Quail with water usage",
    fallback: MASCOT_DEFAULT_SRC,
  },
  pickup: {
    src: "/assets/mascot/pickup.png",
    alt: "Quail clearing green waste with a pitchfork",
    fallback: MASCOT_DEFAULT_SRC,
  },
  astronaut: {
    src: "/images/Astronaught_003.png",
    alt: "Astronaut quail exploring the sky",
    fallback: MASCOT_DEFAULT_SRC,
  },
  telescope: {
    src: "/assets/mascot/telescope.png",
    alt: "Quail stargazing with a telescope",
    fallback: MASCOT_DEFAULT_SRC,
  },
  hardhat: {
    src: "/assets/Mascot_Hardhat.png",
    alt: "Quail in a hard hat with a tool belt",
    fallback: MASCOT_DEFAULT_SRC,
  },
  sunhat: {
    src: "/assets/Mascot_Sunhat.png",
    alt: "Quail in a sun hat with safety glasses",
    fallback: MASCOT_DEFAULT_SRC,
  },
  alert: {
    src: "/assets/status/alert.png",
    alt: "Alarmed quail with a warning cone",
    fallback: MASCOT_DEFAULT_SRC,
  },
};

/** Rotating "crew" mascots used on the home hero + navbar logo. */
export const HERO_MASCOT_SCENES: MascotSceneId[] = [
  "hardhat",
  "sunhat",
];

export function randomHeroScene(): MascotSceneId {
  return HERO_MASCOT_SCENES[
    Math.floor(Math.random() * HERO_MASCOT_SCENES.length)
  ];
}
