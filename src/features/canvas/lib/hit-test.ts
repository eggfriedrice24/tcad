import type { CurveSegment, PatternPieceData, Point2D } from "@/types/pattern";

const HIT_TOLERANCE = 6; // pixels (screen space)

function distSq(a: Point2D, b: Point2D): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function distToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0)
    return Math.sqrt(distSq(p, a));
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.sqrt(distSq(p, { x: a.x + t * dx, y: a.y + t * dy }));
}

function sampleBezier2(start: Point2D, cp: Point2D, end: Point2D, steps: number): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * start.x + 2 * u * t * cp.x + t * t * end.x,
      y: u * u * start.y + 2 * u * t * cp.y + t * t * end.y,
    });
  }
  return pts;
}

function sampleBezier3(start: Point2D, cp1: Point2D, cp2: Point2D, end: Point2D, steps: number): Point2D[] {
  const pts: Point2D[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push({
      x: u * u * u * start.x + 3 * u * u * t * cp1.x + 3 * u * t * t * cp2.x + t * t * t * end.x,
      y: u * u * u * start.y + 3 * u * u * t * cp1.y + 3 * u * t * t * cp2.y + t * t * t * end.y,
    });
  }
  return pts;
}

function sampleArc(seg: Extract<CurveSegment, { type: "Arc" }>, steps: number): Point2D[] {
  const pts: Point2D[] = [];
  const span = seg.end_angle - seg.start_angle;
  for (let i = 0; i <= steps; i++) {
    const a = seg.start_angle + (i / steps) * span;
    pts.push({
      x: seg.center.x + seg.radius * Math.cos(a),
      y: seg.center.y + seg.radius * Math.sin(a),
    });
  }
  return pts;
}

function distToPath(p: Point2D, origin: Point2D, outline: CurveSegment[]): number {
  let minDist = Infinity;
  let cursor: Point2D = { x: origin.x, y: origin.y };

  for (const seg of outline) {
    let pts: Point2D[];
    switch (seg.type) {
      case "Line":
        minDist = Math.min(minDist, distToSegment(p, cursor, seg.end));
        cursor = seg.end;
        continue;
      case "QuadraticBezier":
        pts = sampleBezier2(cursor, seg.control, seg.end, 16);
        break;
      case "CubicBezier":
        pts = sampleBezier3(cursor, seg.control1, seg.control2, seg.end, 20);
        break;
      case "Arc":
        pts = sampleArc(seg, 20);
        break;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      minDist = Math.min(minDist, distToSegment(p, pts[i], pts[i + 1]));
    }
    cursor = pts[pts.length - 1];
  }

  return minDist;
}

export function getBounds(piece: PatternPieceData): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = piece.origin.x;
  let minY = piece.origin.y;
  let maxX = piece.origin.x;
  let maxY = piece.origin.y;

  const expand = (p: Point2D) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  };

  for (const seg of piece.outline) {
    switch (seg.type) {
      case "Line":
        expand(seg.end);
        break;
      case "QuadraticBezier":
        expand(seg.control);
        expand(seg.end);
        break;
      case "CubicBezier":
        expand(seg.control1);
        expand(seg.control2);
        expand(seg.end);
        break;
      case "Arc": {
        const pts = sampleArc(seg, 20);
        pts.forEach(expand);
        break;
      }
    }
  }

  return { minX, minY, maxX, maxY };
}

function flattenOutline(origin: Point2D, outline: CurveSegment[]): Point2D[] {
  const pts: Point2D[] = [{ ...origin }];
  let cursor: Point2D = { x: origin.x, y: origin.y };

  for (const seg of outline) {
    let sampled: Point2D[];
    switch (seg.type) {
      case "Line":
        pts.push({ ...seg.end });
        cursor = seg.end;
        continue;
      case "QuadraticBezier":
        sampled = sampleBezier2(cursor, seg.control, seg.end, 16);
        break;
      case "CubicBezier":
        sampled = sampleBezier3(cursor, seg.control1, seg.control2, seg.end, 20);
        break;
      case "Arc":
        sampled = sampleArc(seg, 20);
        break;
    }
    // Skip first point (same as cursor)
    for (let i = 1; i < sampled.length; i++) {
      pts.push(sampled[i]);
    }
    cursor = sampled[sampled.length - 1];
  }

  return pts;
}

function pointInPolygon(p: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function hitTestPiece(worldPt: Point2D, piece: PatternPieceData, screenTolerance: number, zoom: number): boolean {
  const tolerance = screenTolerance / zoom;

  // Quick bounding box check
  const b = getBounds(piece);
  if (worldPt.x < b.minX - tolerance || worldPt.x > b.maxX + tolerance
    || worldPt.y < b.minY - tolerance || worldPt.y > b.maxY + tolerance) {
    return false;
  }

  // Check if point is inside the filled polygon
  const polygon = flattenOutline(piece.origin, piece.outline);
  if (pointInPolygon(worldPt, polygon))
    return true;

  // Fall back to distance-to-path for edge hits
  return distToPath(worldPt, piece.origin, piece.outline) < tolerance;
}

export function hitTestPieces(worldPt: Point2D, pieces: PatternPieceData[], zoom: number): PatternPieceData | null {
  // Check in reverse order (top pieces first)
  for (let i = pieces.length - 1; i >= 0; i--) {
    if (hitTestPiece(worldPt, pieces[i], HIT_TOLERANCE, zoom))
      return pieces[i];
  }
  return null;
}
