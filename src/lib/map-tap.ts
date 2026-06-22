import { useRef, type PointerEvent as ReactPointerEvent } from "react";

const TAP_MOVE_THRESHOLD_PX = 10;

/** Distinguish tap/click from pan drag so map markers don't steal pan gestures. */
export function useTapHandler(onTap: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  return {
    onPointerDown(e: ReactPointerEvent) {
      e.stopPropagation();
      start.current = { x: e.clientX, y: e.clientY };
      moved.current = false;
    },
    onPointerMove(e: ReactPointerEvent) {
      if (!start.current) return;
      const dx = Math.abs(e.clientX - start.current.x);
      const dy = Math.abs(e.clientY - start.current.y);
      if (dx > TAP_MOVE_THRESHOLD_PX || dy > TAP_MOVE_THRESHOLD_PX) {
        moved.current = true;
      }
    },
    onPointerUp() {
      if (!moved.current) onTap();
      start.current = null;
      moved.current = false;
    },
    onPointerCancel() {
      start.current = null;
      moved.current = false;
    },
  };
}
