import type { Point2D } from "@/types/pattern";

import { getGridStep } from "./canvas-math";

export type SnapResult = {
  point: Point2D;
  snapped: boolean;
  snapX: boolean;
  snapY: boolean;
};

const SNAP_TOLERANCE_PX = 8;

export function snapToGrid(world: Point2D, zoom: number, enabled: boolean): SnapResult {
  if (!enabled) {
    return { point: world, snapped: false, snapX: false, snapY: false };
  }

  const { minor } = getGridStep(zoom);
  const tolerance = SNAP_TOLERANCE_PX / zoom;

  const nearestX = Math.round(world.x / minor) * minor;
  const nearestY = Math.round(world.y / minor) * minor;

  const snapX = Math.abs(world.x - nearestX) < tolerance;
  const snapY = Math.abs(world.y - nearestY) < tolerance;

  return {
    point: {
      x: snapX ? nearestX : world.x,
      y: snapY ? nearestY : world.y,
    },
    snapped: snapX || snapY,
    snapX,
    snapY,
  };
}
