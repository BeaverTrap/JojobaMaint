import type { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

const FOCUS_ANIMATION_MS = 320;

/** Pan/zoom the map so a percentage point (0–100) sits centered in the viewport. */
export function centerMapOnPercent(
  ref: ReactZoomPanPinchRef,
  xPercent: number,
  yPercent: number,
  scale: number,
  animationMs = FOCUS_ANIMATION_MS,
): void {
  const wrapper = ref.instance.wrapperComponent;
  const content = ref.instance.contentComponent;
  if (!wrapper || !content) return;

  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;
  const contentWidth = content.offsetWidth;
  const contentHeight = content.offsetHeight;
  if (!wrapperWidth || !contentWidth) return;

  const x = (xPercent / 100) * contentWidth;
  const y = (yPercent / 100) * contentHeight;
  const posX = wrapperWidth / 2 - x * scale;
  const posY = wrapperHeight / 2 - y * scale;

  ref.setTransform(posX, posY, scale, animationMs, "easeOut");
}

export function focusMapMarker(
  ref: ReactZoomPanPinchRef,
  elementId: string,
  scale: number,
  animationMs = FOCUS_ANIMATION_MS,
): boolean {
  const el = document.getElementById(elementId);
  if (!el) return false;
  ref.zoomToElement(el, scale, animationMs, "easeOut", 0, 0);
  return true;
}

export const MAP_WHEEL_STEP = 0.012;
export const MAP_PINCH_STEP = 4;
export const MAP_FOCUS_SCALE_DETAIL = 3.25;
export const MAP_FOCUS_SCALE_SELECTION = 2.75;
