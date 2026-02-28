import type { Point2D } from "@/types/pattern";

export const CLOSE_THRESHOLD = 10; // pixels (screen space)

export function isNearFirstPoint(firstPoint: Point2D, world: Point2D, zoom: number): boolean {
  const dx = world.x - firstPoint.x;
  const dy = world.y - firstPoint.y;
  const threshold = CLOSE_THRESHOLD / zoom;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
}

export function handleDrawingKeyDown(e: KeyboardEvent, finish: () => void, reset: () => void) {
  if (e.key === "Enter") {
    finish();
  }
  else if (e.key === "Escape") {
    reset();
  }
}

export function handleDrawingDoubleClick<T>(points: T[], finish: () => void) {
  if (points.length > 1) {
    points.pop();
  }
  finish();
}
