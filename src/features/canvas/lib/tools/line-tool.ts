import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { CurveSegment, Point2D } from "@/types/pattern";

import { constrainAngle } from "../constrain";
import { createPieceFromOutline } from "../piece-factory";
import { snapToGrid } from "../snap";
import {
  beginOverlay,
  drawCloseIndicator,
  drawPoint,
  drawPreviewLine,
  drawSnapIndicator,
  endOverlay,
} from "./overlay-renderer";

const CLOSE_THRESHOLD = 10; // pixels (screen space)

export function createLineTool(ctx: ToolContext): CanvasTool {
  let points: Point2D[] = [];
  let mousePos: Point2D | null = null;
  let lastSnap = { snapX: false, snapY: false };

  function reset() {
    points = [];
    mousePos = null;
    lastSnap = { snapX: false, snapY: false };
  }

  function process(world: Point2D, shiftKey: boolean): Point2D {
    let pt = world;
    // Constrain angle to 45° if Shift held and we have a previous point
    if (shiftKey && points.length > 0) {
      pt = constrainAngle(points[points.length - 1], pt);
    }
    // Snap to grid
    const result = snapToGrid(pt, ctx.cameraRef.current.zoom, ctx.snapEnabledRef.current);
    lastSnap = { snapX: result.snapX, snapY: result.snapY };
    return result.point;
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

    const snapped = process(state.world, state.shiftKey);

    // Check close
    if (isNearFirstPoint(snapped)) {
      finish(true);
      return;
    }

    points.push(snapped);
  }

  function onPointerMove(state: PointerState) {
    mousePos = process(state.world, state.shiftKey);
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

    // Draw snap indicator
    if (mousePos && (lastSnap.snapX || lastSnap.snapY)) {
      drawSnapIndicator(drawCtx, mousePos, camera.zoom, lastSnap.snapX, lastSnap.snapY);
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
