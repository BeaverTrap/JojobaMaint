import { PARK_MAP_ASPECT_RATIO } from "@/lib/map-constants";

/** Fit the map stage inside a container-type:size parent (cqw/cqh). */
export const MAP_STAGE_FIT_STYLE = {
  aspectRatio: PARK_MAP_ASPECT_RATIO,
  width: `min(100cqw, calc(100cqh * ${PARK_MAP_ASPECT_RATIO}))`,
  height: `min(100cqh, calc(100cqw / ${PARK_MAP_ASPECT_RATIO}))`,
} as const;

export const MAP_VIEWPORT_CLASS =
  "[container-type:size] flex w-full items-center justify-center";

export const MAP_STAGE_CLASS =
  "relative [container-type:size]";
