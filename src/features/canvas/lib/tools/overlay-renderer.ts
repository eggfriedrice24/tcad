import type { Camera } from "../canvas-math";
import type { Point2D } from "@/types/pattern";

import { applyTransform } from "../canvas-math";

const COLOR_POINT = "#ec4899";
const COLOR_POINT_FIRST = "#f472b6";
const COLOR_PREVIEW_LINE = "rgba(236, 72, 153, 0.6)";
const COLOR_HANDLE_LINE = "rgba(236, 72, 153, 0.3)";
const COLOR_HANDLE_DOT = "#ec4899";
const COLOR_DISTANCE_BG = "rgba(0, 0, 0, 0.75)";
const COLOR_DISTANCE_TEXT = "#ffffff";
const COLOR_CLOSE_INDICATOR = "rgba(236, 72, 153, 0.3)";

export function drawPoint(ctx: CanvasRenderingContext2D, p: Point2D, zoom: number, isFirst = false) {
  const r = (isFirst ? 5 : 4) / zoom;
  ctx.fillStyle = isFirst ? COLOR_POINT_FIRST : COLOR_POINT;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();

  if (isFirst) {
    ctx.strokeStyle = COLOR_POINT_FIRST;
    ctx.lineWidth = 1.5 / zoom;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 3 / zoom, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawPreviewLine(ctx: CanvasRenderingContext2D, from: Point2D, to: Point2D, zoom: number) {
  ctx.strokeStyle = COLOR_PREVIEW_LINE;
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([6 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawPreviewBezier(
  ctx: CanvasRenderingContext2D,
  from: Point2D,
  cp1: Point2D,
  cp2: Point2D,
  to: Point2D,
  zoom: number,
) {
  ctx.strokeStyle = COLOR_PREVIEW_LINE;
  ctx.lineWidth = 1.5 / zoom;
  ctx.setLineDash([6 / zoom, 4 / zoom]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawControlHandle(ctx: CanvasRenderingContext2D, anchor: Point2D, handle: Point2D, zoom: number) {
  // Handle line
  ctx.strokeStyle = COLOR_HANDLE_LINE;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.moveTo(anchor.x, anchor.y);
  ctx.lineTo(handle.x, handle.y);
  ctx.stroke();

  // Handle dot
  const r = 3 / zoom;
  ctx.fillStyle = COLOR_HANDLE_DOT;
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawDistanceLabel(ctx: CanvasRenderingContext2D, from: Point2D, to: Point2D, zoom: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const label = `${dist.toFixed(1)} mm`;

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const fontSize = Math.max(10, 12 / zoom);
  ctx.font = `${fontSize}px sans-serif`;
  const metrics = ctx.measureText(label);
  const padX = 6 / zoom;
  const padY = 4 / zoom;
  const bgW = metrics.width + padX * 2;
  const bgH = fontSize + padY * 2;

  // Background pill
  const bgX = midX - bgW / 2;
  const bgY = midY - bgH / 2 - 10 / zoom;
  const radius = 4 / zoom;
  ctx.fillStyle = COLOR_DISTANCE_BG;
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgW, bgH, radius);
  ctx.fill();

  // Text
  ctx.fillStyle = COLOR_DISTANCE_TEXT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, midX, bgY + bgH / 2);
}

export function drawCloseIndicator(ctx: CanvasRenderingContext2D, p: Point2D, zoom: number) {
  const r = 8 / zoom;
  ctx.fillStyle = COLOR_CLOSE_INDICATOR;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}

const COLOR_SNAP = "rgba(59, 130, 246, 0.6)";
const SNAP_LINE_EXTENT = 30; // pixels in screen space

export function drawSnapIndicator(ctx: CanvasRenderingContext2D, p: Point2D, zoom: number, snapX: boolean, snapY: boolean) {
  const extent = SNAP_LINE_EXTENT / zoom;
  ctx.strokeStyle = COLOR_SNAP;
  ctx.lineWidth = 1 / zoom;
  ctx.setLineDash([3 / zoom, 3 / zoom]);

  if (snapX) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - extent);
    ctx.lineTo(p.x, p.y + extent);
    ctx.stroke();
  }
  if (snapY) {
    ctx.beginPath();
    ctx.moveTo(p.x - extent, p.y);
    ctx.lineTo(p.x + extent, p.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

export function beginOverlay(ctx: CanvasRenderingContext2D, camera: Camera) {
  ctx.save();
  applyTransform(ctx, camera);
}

export function endOverlay(ctx: CanvasRenderingContext2D) {
  ctx.restore();
}
