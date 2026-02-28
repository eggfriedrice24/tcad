import type { Camera } from "./canvas-math";
import type { CurveSegment, PatternPieceData, PatternPieceId, Point2D } from "@/types/pattern";

import { applyTransform, getGridStep } from "./canvas-math";

// --- Colors ---
const COLOR_GRID_MAJOR = "rgba(128, 128, 128, 0.25)";
const COLOR_GRID_MINOR = "rgba(128, 128, 128, 0.1)";
const COLOR_ORIGIN = "rgba(200, 60, 60, 0.4)";
const COLOR_OUTLINE = "#d4d4d8";
const COLOR_OUTLINE_HOVERED = "#a1a1aa";
const COLOR_OUTLINE_SELECTED = "#ec4899";
const COLOR_GRAIN = "#71717a";
const COLOR_NOTCH = "#ec4899";
const COLOR_FILL_SELECTED = "rgba(236, 72, 153, 0.06)";

// --- Grid ---
export function drawGrid(ctx: CanvasRenderingContext2D, camera: Camera, width: number, height: number) {
  const { major, minor } = getGridStep(camera.zoom);

  // Visible world bounds
  const left = -camera.x / camera.zoom;
  const top = -camera.y / camera.zoom;
  const right = (width - camera.x) / camera.zoom;
  const bottom = (height - camera.y) / camera.zoom;

  ctx.save();
  applyTransform(ctx, camera);

  // Minor grid
  ctx.strokeStyle = COLOR_GRID_MINOR;
  ctx.lineWidth = 1 / camera.zoom;
  ctx.beginPath();
  const startX = Math.floor(left / minor) * minor;
  const startY = Math.floor(top / minor) * minor;
  for (let x = startX; x <= right; x += minor) {
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
  }
  for (let y = startY; y <= bottom; y += minor) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
  }
  ctx.stroke();

  // Major grid
  ctx.strokeStyle = COLOR_GRID_MAJOR;
  ctx.lineWidth = 1 / camera.zoom;
  ctx.beginPath();
  const startMX = Math.floor(left / major) * major;
  const startMY = Math.floor(top / major) * major;
  for (let x = startMX; x <= right; x += major) {
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
  }
  for (let y = startMY; y <= bottom; y += major) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
  }
  ctx.stroke();

  // Origin crosshair
  ctx.strokeStyle = COLOR_ORIGIN;
  ctx.lineWidth = 2 / camera.zoom;
  ctx.beginPath();
  ctx.moveTo(left, 0);
  ctx.lineTo(right, 0);
  ctx.moveTo(0, top);
  ctx.lineTo(0, bottom);
  ctx.stroke();

  ctx.restore();
}

// --- Path tracing ---
function traceOutline(ctx: CanvasRenderingContext2D, origin: Point2D, outline: CurveSegment[]) {
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);

  for (const seg of outline) {
    switch (seg.type) {
      case "Line":
        ctx.lineTo(seg.end.x, seg.end.y);
        break;
      case "QuadraticBezier":
        ctx.quadraticCurveTo(seg.control.x, seg.control.y, seg.end.x, seg.end.y);
        break;
      case "CubicBezier":
        ctx.bezierCurveTo(seg.control1.x, seg.control1.y, seg.control2.x, seg.control2.y, seg.end.x, seg.end.y);
        break;
      case "Arc":
        ctx.arc(seg.center.x, seg.center.y, seg.radius, seg.start_angle, seg.end_angle);
        break;
    }
  }
}

// --- Piece rendering ---
function drawPieceOutline(ctx: CanvasRenderingContext2D, piece: PatternPieceData, color: string, lineWidth: number) {
  traceOutline(ctx, piece.origin, piece.outline);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawPieceFill(ctx: CanvasRenderingContext2D, piece: PatternPieceData, color: string) {
  traceOutline(ctx, piece.origin, piece.outline);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawGrainLine(ctx: CanvasRenderingContext2D, piece: PatternPieceData, zoom: number) {
  if (!piece.grain_line)
    return;
  const [start, end] = piece.grain_line;
  const lw = 1 / zoom;

  ctx.strokeStyle = COLOR_GRAIN;
  ctx.lineWidth = lw;
  ctx.setLineDash([4 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrow head
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1)
    return;
  const ux = dx / len;
  const uy = dy / len;
  const arrowSize = 6 / zoom;

  ctx.beginPath();
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - ux * arrowSize + uy * arrowSize * 0.5, end.y - uy * arrowSize - ux * arrowSize * 0.5);
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(end.x - ux * arrowSize - uy * arrowSize * 0.5, end.y - uy * arrowSize + ux * arrowSize * 0.5);
  ctx.stroke();
}

function drawNotches(ctx: CanvasRenderingContext2D, piece: PatternPieceData, zoom: number) {
  const size = 4 / zoom;
  ctx.fillStyle = COLOR_NOTCH;
  for (const n of piece.notches) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPieceName(ctx: CanvasRenderingContext2D, piece: PatternPieceData, zoom: number) {
  // Find center of bounding box
  let cx = piece.origin.x;
  let cy = piece.origin.y;
  let count = 1;
  for (const seg of piece.outline) {
    if ("end" in seg) {
      cx += seg.end.x;
      cy += seg.end.y;
      count++;
    }
  }
  cx /= count;
  cy /= count;

  const fontSize = Math.max(10, 12 / zoom);
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(piece.name, cx, cy);
}

export function drawPieces(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  pieces: PatternPieceData[],
  selectedIds: Set<PatternPieceId>,
  hoveredId: PatternPieceId | null,
) {
  ctx.save();
  applyTransform(ctx, camera);

  for (const piece of pieces) {
    const isSelected = selectedIds.has(piece.id);
    const isHovered = piece.id === hoveredId;

    if (isSelected) {
      drawPieceFill(ctx, piece, COLOR_FILL_SELECTED);
    }

    const color = isSelected
      ? COLOR_OUTLINE_SELECTED
      : isHovered
        ? COLOR_OUTLINE_HOVERED
        : COLOR_OUTLINE;
    const lineWidth = (isSelected ? 2 : 1) / camera.zoom;

    drawPieceOutline(ctx, piece, color, lineWidth);
    drawGrainLine(ctx, piece, camera.zoom);
    drawNotches(ctx, piece, camera.zoom);
    drawPieceName(ctx, piece, camera.zoom);
  }

  ctx.restore();
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
}
