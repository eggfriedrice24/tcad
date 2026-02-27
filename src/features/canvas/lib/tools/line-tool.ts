import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { CurveSegment, Point2D } from "@/types/pattern";

import { createPieceFromOutline } from "../piece-factory";
import {
  beginOverlay,
  drawCloseIndicator,
  drawPoint,
  drawPreviewLine,
  endOverlay,
} from "./overlay-renderer";

const CLOSE_THRESHOLD = 10; // pixels (screen space)

export function createLineTool(ctx: ToolContext): CanvasTool {
  let points: Point2D[] = [];
  let mousePos: Point2D | null = null;

  function reset() {
    points = [];
    mousePos = null;
  }

  function isNearFirstPoint(world: Point2D): boolean {
    if (points.length < 3)
      return false;
    const first = points[0];
    const dx = world.x - first.x;
    const dy = world.y - first.y;
    const threshold = CLOSE_THRESHOLD / ctx.cameraRef.current.zoom;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  function finish(close: boolean) {
    if (points.length < 2)
      return;

    const origin = points[0];
    const segments: CurveSegment[] = [];

    for (let i = 1; i < points.length; i++) {
      segments.push({ type: "Line", end: points[i] });
    }

    // Close the path back to origin
    if (close || (points.length >= 3)) {
      segments.push({ type: "Line", end: { ...origin } });
    }

    const piece = createPieceFromOutline(origin, segments);
    ctx.createPiece(piece);
    ctx.selectPiece(piece.id);
    reset();
  }

  function onPointerDown(state: PointerState) {
    if (state.button !== 0)
      return;

    // Check close
    if (isNearFirstPoint(state.world)) {
      finish(true);
      return;
    }

    points.push({ ...state.world });
  }

  function onPointerMove(state: PointerState) {
    mousePos = { ...state.world };
  }

  function onDoubleClick(_state: PointerState) {
    // Double-click finishes (the second click from dblclick already added a point)
    // Remove the duplicate last point from the second click
    if (points.length > 1) {
      points.pop();
    }
    finish(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      finish(false);
    }
    else if (e.key === "Escape") {
      reset();
    }
  }

  function drawOverlay(drawCtx: CanvasRenderingContext2D, camera: Camera) {
    if (points.length === 0 && !mousePos)
      return;

    beginOverlay(drawCtx, camera);

    // Draw existing segments
    for (let i = 0; i < points.length - 1; i++) {
      drawPreviewLine(drawCtx, points[i], points[i + 1], camera.zoom);
    }

    // Draw preview line to mouse
    if (points.length > 0 && mousePos) {
      drawPreviewLine(drawCtx, points[points.length - 1], mousePos, camera.zoom);
    }

    // Draw close indicator
    if (mousePos && isNearFirstPoint(mousePos)) {
      drawCloseIndicator(drawCtx, points[0], camera.zoom);
    }

    // Draw points
    for (let i = 0; i < points.length; i++) {
      drawPoint(drawCtx, points[i], camera.zoom, i === 0);
    }

    endOverlay(drawCtx);
  }

  return {
    name: "line",
    onPointerDown,
    onPointerMove,
    onPointerUp: () => {},
    onDoubleClick,
    onKeyDown,
    drawOverlay,
    getCursor: () => "crosshair",
    cleanup: reset,
  };
}
