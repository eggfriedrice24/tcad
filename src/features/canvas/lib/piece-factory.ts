import type { CurveSegment, PatternPieceData, Point2D } from "@/types/pattern";

let pieceCounter = 0;

export function createPieceFromOutline(origin: Point2D, segments: CurveSegment[]): PatternPieceData {
  pieceCounter++;
  return {
    id: crypto.randomUUID(),
    name: `Piece ${pieceCounter}`,
    origin,
    outline: segments,
    grain_line: null,
    seam_allowance_mm: 10,
    notches: [],
    internal_lines: [],
    metadata: {
      fabric_type: null,
      cut_quantity: 2,
      mirror: false,
      notes: "",
    },
  };
}

export function createDefaultRectangle(): PatternPieceData {
  pieceCounter++;
  const w = 200;
  const h = 300;
  const ox = (pieceCounter - 1) * (w + 50);

  return {
    id: crypto.randomUUID(),
    name: `Piece ${pieceCounter}`,
    origin: { x: ox, y: 0 },
    outline: [
      { type: "Line", end: { x: ox + w, y: 0 } },
      { type: "Line", end: { x: ox + w, y: h } },
      { type: "Line", end: { x: ox, y: h } },
      { type: "Line", end: { x: ox, y: 0 } },
    ],
    grain_line: [
      { x: ox + w / 2, y: 20 },
      { x: ox + w / 2, y: h - 20 },
    ],
    seam_allowance_mm: 10,
    notches: [
      { x: ox + w / 2, y: 0 },
      { x: ox + w, y: h / 2 },
    ],
    internal_lines: [],
    metadata: {
      fabric_type: null,
      cut_quantity: 2,
      mirror: false,
      notes: "",
    },
  };
}
