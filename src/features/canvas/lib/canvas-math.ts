import type { Point2D } from "@/types/pattern";

export type Camera = {
  x: number;
  y: number;
  zoom: number;
};

export function createCamera(): Camera {
  return { x: 0, y: 0, zoom: 1 };
}

export function screenToWorld(camera: Camera, sx: number, sy: number): Point2D {
  return {
    x: (sx - camera.x) / camera.zoom,
    y: (sy - camera.y) / camera.zoom,
  };
}

export function applyTransform(ctx: CanvasRenderingContext2D, camera: Camera) {
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, camera.x, camera.y);
}

export function getGridStep(zoom: number): { major: number; minor: number } {
  const base = 10;
  let step = base;
  while (step * zoom < 20)
    step *= 5;
  while (step * zoom > 200)
    step /= 5;
  return { major: step * 5, minor: step };
}

export type Unit = "mm" | "cm" | "m" | "in";

export function formatValue(n: number, unit?: Unit): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return unit ? `${s} ${unit}` : s;
}

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 50;
const ZOOM_FACTOR = 1.1;

export function zoomAtPoint(camera: Camera, screenX: number, screenY: number, delta: number): Camera {
  const direction = delta > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * direction));

  return {
    x: screenX - (screenX - camera.x) * (newZoom / camera.zoom),
    y: screenY - (screenY - camera.y) * (newZoom / camera.zoom),
    zoom: newZoom,
  };
}
