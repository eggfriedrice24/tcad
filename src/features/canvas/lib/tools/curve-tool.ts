import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { CurveSegment, Point2D } from "@/types/pattern";

import { createPieceFromOutline } from "../piece-factory";
import {
  beginOverlay,
  drawCloseIndicator,
  drawControlHandle,
  drawPoint,
  drawPreviewBezier,
  drawPreviewLine,
  endOverlay,
} from "./overlay-renderer";

const CLOSE_THRESHOLD = 10;

type CurvePoint = {
  position: Point2D;
  handleOut: Point2D | null; // control handle going forward
};

export function createCurveTool(ctx: ToolContext): CanvasTool {
  let curvePoints: CurvePoint[] = [];
  let mousePos: Point2D | null = null;
  let isDown = false;
  let downPos: Point2D | null = null;
  let currentHandle: Point2D | null = null;

  function reset() {
    curvePoints = [];
    mousePos = null;
    isDown = false;
    downPos = null;
    currentHandle = null;
  }

  function isNearFirstPoint(world: Point2D): boolean {
    if (curvePoints.length < 3)
      return false;
    const first = curvePoints[0].position;
    const dx = world.x - first.x;
    const dy = world.y - first.y;
    const threshold = CLOSE_THRESHOLD / ctx.cameraRef.current.zoom;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  function finish(close: boolean) {
    if (curvePoints.length < 2)
      return;

    const origin = curvePoints[0].position;
    const segments: CurveSegment[] = [];

    for (let i = 0; i < curvePoints.length - 1; i++) {
      const from = curvePoints[i];
      const to = curvePoints[i + 1];

      if (from.handleOut) {
        // Mirror the incoming handle for the "to" control point
        const handleIn = to.handleOut
          ? { x: 2 * to.position.x - to.handleOut.x, y: 2 * to.position.y - to.handleOut.y }
          : { ...to.position };

        segments.push({
          type: "CubicBezier",
          control1: from.handleOut,
          control2: handleIn,
          end: to.position,
        });
      }
      else {
        segments.push({ type: "Line", end: to.position });
      }
    }

    // Close path
    if (close && curvePoints.length >= 3) {
      const last = curvePoints[curvePoints.length - 1];
      const first = curvePoints[0];
      if (last.handleOut) {
        const handleIn = first.handleOut
          ? { x: 2 * first.position.x - first.handleOut.x, y: 2 * first.position.y - first.handleOut.y }
          : { ...first.position };
        segments.push({
          type: "CubicBezier",
          control1: last.handleOut,
          control2: handleIn,
          end: { ...origin },
        });
      }
      else {
        segments.push({ type: "Line", end: { ...origin } });
      }
    }
    else if (curvePoints.length >= 3) {
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

    if (isNearFirstPoint(state.world)) {
      finish(true);
      return;
    }

    isDown = true;
    downPos = { ...state.world };
    currentHandle = null;
  }

  function onPointerMove(state: PointerState) {
    mousePos = { ...state.world };

    if (isDown && downPos) {
      // Dragging: set control handle
      currentHandle = { ...state.world };
    }
  }

  function onPointerUp(_state: PointerState) {
    if (!isDown || !downPos)
      return;

    const position = { ...downPos };
    let handleOut: Point2D | null = null;

    if (currentHandle) {
      const dx = currentHandle.x - position.x;
      const dy = currentHandle.y - position.y;
      if (Math.sqrt(dx * dx + dy * dy) > 2 / ctx.cameraRef.current.zoom) {
        handleOut = { ...currentHandle };
      }
    }

    curvePoints.push({ position, handleOut });
    isDown = false;
    downPos = null;
    currentHandle = null;
  }

  function onDoubleClick() {
    if (curvePoints.length > 1) {
      curvePoints.pop();
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
    if (curvePoints.length === 0 && !isDown)
      return;

    beginOverlay(drawCtx, camera);

    // Draw existing segments
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const from = curvePoints[i];
      const to = curvePoints[i + 1];

      if (from.handleOut) {
        const handleIn = to.handleOut
          ? { x: 2 * to.position.x - to.handleOut.x, y: 2 * to.position.y - to.handleOut.y }
          : { ...to.position };

        drawPreviewBezier(drawCtx, from.position, from.handleOut, handleIn, to.position, camera.zoom);
      }
      else {
        drawPreviewLine(drawCtx, from.position, to.position, camera.zoom);
      }
    }

    // Preview segment to mouse/current drag
    if (curvePoints.length > 0) {
      const last = curvePoints[curvePoints.length - 1];

      if (isDown && downPos) {
        // Currently placing a new point with drag
        if (last.handleOut) {
          const cp2 = currentHandle ? { x: 2 * downPos.x - currentHandle.x, y: 2 * downPos.y - currentHandle.y } : { ...downPos };
          drawPreviewBezier(drawCtx, last.position, last.handleOut, cp2, downPos, camera.zoom);
        }
        else {
          drawPreviewLine(drawCtx, last.position, downPos, camera.zoom);
        }

        // Draw current drag handle
        if (currentHandle) {
          drawControlHandle(drawCtx, downPos, currentHandle, camera.zoom);
          // Mirror handle
          const mirror = { x: 2 * downPos.x - currentHandle.x, y: 2 * downPos.y - currentHandle.y };
          drawControlHandle(drawCtx, downPos, mirror, camera.zoom);
        }
      }
      else if (mousePos) {
        if (last.handleOut) {
          drawPreviewBezier(drawCtx, last.position, last.handleOut, mousePos, mousePos, camera.zoom);
        }
        else {
          drawPreviewLine(drawCtx, last.position, mousePos, camera.zoom);
        }
      }
    }

    // Close indicator
    if (mousePos && !isDown && isNearFirstPoint(mousePos)) {
      drawCloseIndicator(drawCtx, curvePoints[0].position, camera.zoom);
    }

    // Draw points and handles
    for (let i = 0; i < curvePoints.length; i++) {
      const cp = curvePoints[i];
      drawPoint(drawCtx, cp.position, camera.zoom, i === 0);
      if (cp.handleOut) {
        drawControlHandle(drawCtx, cp.position, cp.handleOut, camera.zoom);
        const mirror = { x: 2 * cp.position.x - cp.handleOut.x, y: 2 * cp.position.y - cp.handleOut.y };
        drawControlHandle(drawCtx, cp.position, mirror, camera.zoom);
      }
    }

    // Draw active placement point
    if (isDown && downPos) {
      drawPoint(drawCtx, downPos, camera.zoom);
    }

    endOverlay(drawCtx);
  }

  return {
    name: "curve",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick,
    onKeyDown,
    drawOverlay,
    getCursor: () => "crosshair",
    cleanup: reset,
  };
}
