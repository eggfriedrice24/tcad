import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { Point2D } from "@/types/pattern";

import { snapToGrid } from "../snap";
import { beginOverlay, drawDistanceLabel, drawPoint, drawPreviewLine, drawSnapIndicator, endOverlay } from "./overlay-renderer";

export function createMeasureTool(ctx: ToolContext): CanvasTool {
  let pointA: Point2D | null = null;
  let pointB: Point2D | null = null;
  let mousePos: Point2D | null = null;
  let lastSnap = { snapX: false, snapY: false };

  function reset() {
    pointA = null;
    pointB = null;
    mousePos = null;
    lastSnap = { snapX: false, snapY: false };
  }

  function snap(world: Point2D): Point2D {
    const result = snapToGrid(world, ctx.cameraRef.current.zoom, ctx.snapEnabledRef.current);
    lastSnap = { snapX: result.snapX, snapY: result.snapY };
    return result.point;
  }

  function onPointerDown(state: PointerState) {
    if (state.button !== 0)
      return;

    const snapped = snap(state.world);

    if (!pointA) {
      pointA = snapped;
    }
    else if (!pointB) {
      pointB = snapped;
    }
    else {
      // Third click resets and starts new measurement
      pointA = snapped;
      pointB = null;
    }
  }

  function onPointerMove(state: PointerState) {
    mousePos = snap(state.world);
  }

  function drawOverlay(drawCtx: CanvasRenderingContext2D, camera: Camera) {
    if (!pointA)
      return;

    beginOverlay(drawCtx, camera);

    const target = pointB ?? mousePos;
    if (target) {
      drawPreviewLine(drawCtx, pointA, target, camera.zoom);
      drawDistanceLabel(drawCtx, pointA, target, camera.zoom);
    }

    // Snap indicator
    if (mousePos && !pointB && (lastSnap.snapX || lastSnap.snapY)) {
      drawSnapIndicator(drawCtx, mousePos, camera.zoom, lastSnap.snapX, lastSnap.snapY);
    }

    drawPoint(drawCtx, pointA, camera.zoom, true);
    if (pointB) {
      drawPoint(drawCtx, pointB, camera.zoom);
    }

    endOverlay(drawCtx);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      reset();
    }
  }

  return {
    name: "measure",
    onPointerDown,
    onPointerMove,
    onPointerUp: () => {},
    onDoubleClick: () => {},
    onKeyDown,
    drawOverlay,
    getCursor: () => "crosshair",
    cleanup: reset,
  };
}
