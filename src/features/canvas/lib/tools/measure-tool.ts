import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { Point2D } from "@/types/pattern";

import { beginOverlay, drawDistanceLabel, drawPoint, drawPreviewLine, endOverlay } from "./overlay-renderer";

export function createMeasureTool(_ctx: ToolContext): CanvasTool {
  let pointA: Point2D | null = null;
  let pointB: Point2D | null = null;
  let mousePos: Point2D | null = null;

  function reset() {
    pointA = null;
    pointB = null;
    mousePos = null;
  }

  function onPointerDown(state: PointerState) {
    if (state.button !== 0)
      return;

    if (!pointA) {
      pointA = { ...state.world };
    }
    else if (!pointB) {
      pointB = { ...state.world };
    }
    else {
      // Third click resets and starts new measurement
      pointA = { ...state.world };
      pointB = null;
    }
  }

  function onPointerMove(state: PointerState) {
    mousePos = { ...state.world };
  }

  function drawOverlay(ctx: CanvasRenderingContext2D, camera: Camera) {
    if (!pointA)
      return;

    beginOverlay(ctx, camera);

    const target = pointB ?? mousePos;
    if (target) {
      drawPreviewLine(ctx, pointA, target, camera.zoom);
      drawDistanceLabel(ctx, pointA, target, camera.zoom);
    }

    drawPoint(ctx, pointA, camera.zoom, true);
    if (pointB) {
      drawPoint(ctx, pointB, camera.zoom);
    }

    endOverlay(ctx);
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
