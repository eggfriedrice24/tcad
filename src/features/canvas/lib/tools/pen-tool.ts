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
const DRAG_THRESHOLD = 2;

type PenPoint = {
  position: Point2D;
  handleIn: Point2D | null;
  handleOut: Point2D | null;
};

export function createPenTool(ctx: ToolContext): CanvasTool {
  let penPoints: PenPoint[] = [];
  let mousePos: Point2D | null = null;
  let isDown = false;
  let downPos: Point2D | null = null;
  let isDragging = false;
  let currentHandle: Point2D | null = null;

  function reset() {
    penPoints = [];
    mousePos = null;
    isDown = false;
    downPos = null;
    isDragging = false;
    currentHandle = null;
  }

  function isNearFirstPoint(world: Point2D): boolean {
    if (penPoints.length < 3)
      return false;
    const first = penPoints[0].position;
    const dx = world.x - first.x;
    const dy = world.y - first.y;
    const threshold = CLOSE_THRESHOLD / ctx.cameraRef.current.zoom;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }

  function buildSegments(close: boolean): { origin: Point2D; segments: CurveSegment[] } {
    const origin = penPoints[0].position;
    const segments: CurveSegment[] = [];
    const count = close ? penPoints.length : penPoints.length - 1;

    for (let i = 0; i < count; i++) {
      const from = penPoints[i];
      const to = penPoints[(i + 1) % penPoints.length];
      const hasHandleOut = from.handleOut !== null;
      const hasHandleIn = to.handleIn !== null;

      if (hasHandleOut || hasHandleIn) {
        segments.push({
          type: "CubicBezier",
          control1: from.handleOut ?? { ...from.position },
          control2: to.handleIn ?? { ...to.position },
          end: i + 1 === penPoints.length && close ? { ...origin } : to.position,
        });
      }
      else {
        segments.push({
          type: "Line",
          end: i + 1 === penPoints.length && close ? { ...origin } : to.position,
        });
      }
    }

    // Auto-close if not closing explicitly
    if (!close && penPoints.length >= 3) {
      segments.push({ type: "Line", end: { ...origin } });
    }

    return { origin, segments };
  }

  function finish(close: boolean) {
    if (penPoints.length < 2)
      return;

    const { origin, segments } = buildSegments(close);
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
    isDragging = false;
    downPos = { ...state.world };
    currentHandle = null;
  }

  function onPointerMove(state: PointerState) {
    mousePos = { ...state.world };

    if (isDown && downPos) {
      const dx = state.world.x - downPos.x;
      const dy = state.world.y - downPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > DRAG_THRESHOLD / ctx.cameraRef.current.zoom) {
        isDragging = true;
        currentHandle = { ...state.world };
      }
    }
  }

  function onPointerUp(_state: PointerState) {
    if (!isDown || !downPos)
      return;

    const position = { ...downPos };

    if (isDragging && currentHandle) {
      // Curve point: symmetric handles
      const handleOut = { ...currentHandle };
      const handleIn = {
        x: 2 * position.x - currentHandle.x,
        y: 2 * position.y - currentHandle.y,
      };
      penPoints.push({ position, handleIn, handleOut });
    }
    else {
      // Corner point: no handles
      penPoints.push({ position, handleIn: null, handleOut: null });
    }

    isDown = false;
    downPos = null;
    isDragging = false;
    currentHandle = null;
  }

  function onDoubleClick(_state: PointerState) {
    if (penPoints.length > 1) {
      penPoints.pop();
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
    if (penPoints.length === 0 && !isDown)
      return;

    beginOverlay(drawCtx, camera);

    // Draw committed segments
    for (let i = 0; i < penPoints.length - 1; i++) {
      const from = penPoints[i];
      const to = penPoints[i + 1];
      const cp1 = from.handleOut ?? from.position;
      const cp2 = to.handleIn ?? to.position;

      if (from.handleOut || to.handleIn) {
        drawPreviewBezier(drawCtx, from.position, cp1, cp2, to.position, camera.zoom);
      }
      else {
        drawPreviewLine(drawCtx, from.position, to.position, camera.zoom);
      }
    }

    // Preview segment from last committed point to current mouse / drag point
    if (penPoints.length > 0) {
      const last = penPoints[penPoints.length - 1];
      const target = isDown && downPos ? downPos : mousePos;

      if (target) {
        if (isDown && isDragging && currentHandle && downPos) {
          // Preview a bezier to the point being dragged
          const cp1 = last.handleOut ?? last.position;
          const cp2 = { x: 2 * downPos.x - currentHandle.x, y: 2 * downPos.y - currentHandle.y };
          drawPreviewBezier(drawCtx, last.position, cp1, cp2, downPos, camera.zoom);
        }
        else if (last.handleOut) {
          drawPreviewBezier(drawCtx, last.position, last.handleOut, target, target, camera.zoom);
        }
        else {
          drawPreviewLine(drawCtx, last.position, target, camera.zoom);
        }
      }
    }

    // Close indicator
    if (mousePos && !isDown && isNearFirstPoint(mousePos)) {
      drawCloseIndicator(drawCtx, penPoints[0].position, camera.zoom);
    }

    // Draw points and handles
    for (let i = 0; i < penPoints.length; i++) {
      const pp = penPoints[i];
      drawPoint(drawCtx, pp.position, camera.zoom, i === 0);
      if (pp.handleOut) {
        drawControlHandle(drawCtx, pp.position, pp.handleOut, camera.zoom);
      }
      if (pp.handleIn) {
        drawControlHandle(drawCtx, pp.position, pp.handleIn, camera.zoom);
      }
    }

    // Draw active drag handles
    if (isDown && isDragging && downPos && currentHandle) {
      drawPoint(drawCtx, downPos, camera.zoom);
      drawControlHandle(drawCtx, downPos, currentHandle, camera.zoom);
      const mirror = { x: 2 * downPos.x - currentHandle.x, y: 2 * downPos.y - currentHandle.y };
      drawControlHandle(drawCtx, downPos, mirror, camera.zoom);
    }
    else if (isDown && downPos) {
      drawPoint(drawCtx, downPos, camera.zoom);
    }

    endOverlay(drawCtx);
  }

  return {
    name: "pen",
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
