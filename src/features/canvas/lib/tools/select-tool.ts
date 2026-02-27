import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { CurveSegment, PatternPieceData, Point2D } from "@/types/pattern";

import { applyTransform } from "../canvas-math";
import { hitTestPieces } from "../hit-test";

function offsetSegment(seg: CurveSegment, dx: number, dy: number): CurveSegment {
  switch (seg.type) {
    case "Line":
      return { ...seg, end: { x: seg.end.x + dx, y: seg.end.y + dy } };
    case "QuadraticBezier":
      return {
        ...seg,
        control: { x: seg.control.x + dx, y: seg.control.y + dy },
        end: { x: seg.end.x + dx, y: seg.end.y + dy },
      };
    case "CubicBezier":
      return {
        ...seg,
        control1: { x: seg.control1.x + dx, y: seg.control1.y + dy },
        control2: { x: seg.control2.x + dx, y: seg.control2.y + dy },
        end: { x: seg.end.x + dx, y: seg.end.y + dy },
      };
    case "Arc":
      return {
        ...seg,
        center: { x: seg.center.x + dx, y: seg.center.y + dy },
      };
  }
}

function offsetPiece(piece: PatternPieceData, dx: number, dy: number): PatternPieceData {
  return {
    ...piece,
    origin: { x: piece.origin.x + dx, y: piece.origin.y + dy },
    outline: piece.outline.map(seg => offsetSegment(seg, dx, dy)),
    grain_line: piece.grain_line
      ? [
          { x: piece.grain_line[0].x + dx, y: piece.grain_line[0].y + dy },
          { x: piece.grain_line[1].x + dx, y: piece.grain_line[1].y + dy },
        ]
      : null,
    notches: piece.notches.map(n => ({ x: n.x + dx, y: n.y + dy })),
    internal_lines: piece.internal_lines.map(line =>
      line.map(seg => offsetSegment(seg, dx, dy)),
    ),
  };
}

export function createSelectTool(ctx: ToolContext): CanvasTool {
  let isDragging = false;
  let dragIds: Set<string> = new Set();
  let dragStart: Point2D | null = null;
  let dragOffset: Point2D = { x: 0, y: 0 };
  let hasMoved = false;

  function onPointerDown(state: PointerState) {
    if (state.button !== 0)
      return;

    const hit = hitTestPieces(state.world, ctx.piecesRef.current, ctx.cameraRef.current.zoom);

    if (hit) {
      const alreadySelected = ctx.selectedIdsRef.current.has(hit.id);

      if (state.shiftKey) {
        ctx.togglePiece(hit.id);
      }
      else if (!alreadySelected) {
        ctx.selectPiece(hit.id);
      }
      // If already selected without shift, keep current selection (allows multi-drag)

      // Start drag with all currently selected pieces
      isDragging = true;
      // Read selection after the above select/toggle calls
      dragIds = new Set(ctx.selectedIdsRef.current);
      // Ensure the hit piece is included
      dragIds.add(hit.id);
      dragStart = { ...state.world };
      dragOffset = { x: 0, y: 0 };
      hasMoved = false;
    }
    else {
      ctx.clearSelection();
    }
  }

  function onPointerMove(state: PointerState) {
    if (isDragging && dragStart) {
      const dx = state.world.x - dragStart.x;
      const dy = state.world.y - dragStart.y;

      if (!hasMoved && Math.abs(dx) + Math.abs(dy) < 2 / ctx.cameraRef.current.zoom) {
        return;
      }
      hasMoved = true;
      dragOffset = { x: dx, y: dy };
      return;
    }

    // Hover detection
    const hit = hitTestPieces(state.world, ctx.piecesRef.current, ctx.cameraRef.current.zoom);
    const newHoveredId = hit?.id ?? null;
    if (newHoveredId !== ctx.hoveredIdRef.current) {
      ctx.setHovered(newHoveredId);
    }
  }

  function onPointerUp(_state: PointerState) {
    if (isDragging && hasMoved) {
      const dx = dragOffset.x;
      const dy = dragOffset.y;

      for (const id of dragIds) {
        const piece = ctx.piecesRef.current.find(p => p.id === id);
        if (piece) {
          ctx.updatePiece(piece.id, offsetPiece(piece, dx, dy));
        }
      }
    }

    isDragging = false;
    dragIds = new Set();
    dragStart = null;
    dragOffset = { x: 0, y: 0 };
    hasMoved = false;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Delete" || e.key === "Backspace") {
      const ids = ctx.selectedIdsRef.current;
      if (ids.size === 0)
        return;
      e.preventDefault();
      for (const id of ids) {
        ctx.deletePiece(id);
      }
      ctx.clearSelection();
    }
  }

  function drawOverlay(drawCtx: CanvasRenderingContext2D, camera: Camera) {
    if (!isDragging || !hasMoved || dragIds.size === 0)
      return;

    const { x: dx, y: dy } = dragOffset;

    drawCtx.save();
    applyTransform(drawCtx, camera);
    drawCtx.globalAlpha = 0.5;
    drawCtx.strokeStyle = "#ec4899";
    drawCtx.lineWidth = 1.5 / camera.zoom;
    drawCtx.setLineDash([4 / camera.zoom, 4 / camera.zoom]);

    for (const id of dragIds) {
      const piece = ctx.piecesRef.current.find(p => p.id === id);
      if (!piece)
        continue;

      drawCtx.beginPath();
      drawCtx.moveTo(piece.origin.x + dx, piece.origin.y + dy);

      for (const seg of piece.outline) {
        switch (seg.type) {
          case "Line":
            drawCtx.lineTo(seg.end.x + dx, seg.end.y + dy);
            break;
          case "QuadraticBezier":
            drawCtx.quadraticCurveTo(
              seg.control.x + dx,
              seg.control.y + dy,
              seg.end.x + dx,
              seg.end.y + dy,
            );
            break;
          case "CubicBezier":
            drawCtx.bezierCurveTo(
              seg.control1.x + dx,
              seg.control1.y + dy,
              seg.control2.x + dx,
              seg.control2.y + dy,
              seg.end.x + dx,
              seg.end.y + dy,
            );
            break;
          case "Arc":
            drawCtx.arc(seg.center.x + dx, seg.center.y + dy, seg.radius, seg.start_angle, seg.end_angle);
            break;
        }
      }
      drawCtx.stroke();
    }

    drawCtx.setLineDash([]);
    drawCtx.restore();
  }

  function getCursor(): string {
    if (isDragging && hasMoved)
      return "grabbing";
    const hit = ctx.hoveredIdRef.current;
    return hit ? "pointer" : "default";
  }

  return {
    name: "select",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick: () => {},
    onKeyDown,
    drawOverlay,
    getCursor,
    cleanup: () => {
      isDragging = false;
      dragIds = new Set();
      dragStart = null;
    },
  };
}
