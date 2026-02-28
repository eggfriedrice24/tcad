import type { CurveSegment, PatternPieceData, Point2D } from "@/types/pattern";

let pieceCounter = 0;

export function resetPieceCounter(count = 0) {
  pieceCounter = count;
}

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

export function duplicatePiece(piece: PatternPieceData): PatternPieceData {
  pieceCounter++;
  return {
    ...piece,
    id: crypto.randomUUID(),
    name: `Piece ${pieceCounter}`,
    outline: piece.outline.map(seg => ({ ...seg })),
    grain_line: piece.grain_line
      ? [{ ...piece.grain_line[0] }, { ...piece.grain_line[1] }]
      : null,
    notches: piece.notches.map(n => ({ ...n })),
    internal_lines: piece.internal_lines.map(line => line.map(seg => ({ ...seg }))),
    metadata: { ...piece.metadata },
  };
}

function mirrorSegmentX(seg: CurveSegment, cx: number): CurveSegment {
  switch (seg.type) {
    case "Line":
      return { ...seg, end: { x: 2 * cx - seg.end.x, y: seg.end.y } };
    case "QuadraticBezier":
      return {
        ...seg,
        control: { x: 2 * cx - seg.control.x, y: seg.control.y },
        end: { x: 2 * cx - seg.end.x, y: seg.end.y },
      };
    case "CubicBezier":
      return {
        ...seg,
        control1: { x: 2 * cx - seg.control1.x, y: seg.control1.y },
        control2: { x: 2 * cx - seg.control2.x, y: seg.control2.y },
        end: { x: 2 * cx - seg.end.x, y: seg.end.y },
      };
    case "Arc":
      return {
        ...seg,
        center: { x: 2 * cx - seg.center.x, y: seg.center.y },
        start_angle: Math.PI - seg.end_angle,
        end_angle: Math.PI - seg.start_angle,
      };
  }
}

export function mirrorPieceX(piece: PatternPieceData): PatternPieceData {
  // Compute bounding box centerX from origin + all segment endpoints
  let minX = piece.origin.x;
  let maxX = piece.origin.x;
  for (const seg of piece.outline) {
    if (seg.type === "Arc") {
      const lo = seg.center.x - seg.radius;
      const hi = seg.center.x + seg.radius;
      if (hi > maxX)
        maxX = hi;
      if (lo < minX)
        minX = lo;
    }
    else {
      if (seg.end.x > maxX)
        maxX = seg.end.x;
      if (seg.end.x < minX)
        minX = seg.end.x;
    }
  }
  const cx = (minX + maxX) / 2;

  // Mirror outline and reverse so path traces correctly after X flip
  const mirroredOutline = piece.outline.map(seg => mirrorSegmentX(seg, cx));
  // Reverse segment order and swap start/end to maintain path direction
  const reversed: CurveSegment[] = [];
  for (let i = mirroredOutline.length - 1; i >= 0; i--) {
    const seg = mirroredOutline[i];
    const prevEnd = i > 0
      ? mirroredOutline[i - 1]
      : mirroredOutline[mirroredOutline.length - 1];
    // The "end" of this reversed segment is the previous segment's end (or origin for first)
    const newEnd = i > 0
      ? (prevEnd.type === "Arc"
          ? { x: prevEnd.center.x + prevEnd.radius * Math.cos(prevEnd.end_angle), y: prevEnd.center.y + prevEnd.radius * Math.sin(prevEnd.end_angle) }
          : { ...prevEnd.end })
      : { x: 2 * cx - piece.origin.x, y: piece.origin.y };

    switch (seg.type) {
      case "Line":
        reversed.push({ type: "Line", end: newEnd });
        break;
      case "QuadraticBezier":
        reversed.push({ type: "QuadraticBezier", control: { ...seg.control }, end: newEnd });
        break;
      case "CubicBezier":
        reversed.push({ type: "CubicBezier", control1: { ...seg.control2 }, control2: { ...seg.control1 }, end: newEnd });
        break;
      case "Arc":
        reversed.push({ ...seg, start_angle: seg.end_angle, end_angle: seg.start_angle });
        break;
    }
  }

  // New origin is the mirrored origin
  const mirroredOrigin = { x: 2 * cx - piece.origin.x, y: piece.origin.y };

  return {
    ...piece,
    origin: mirroredOrigin,
    outline: reversed,
    grain_line: piece.grain_line
      ? [
          { x: 2 * cx - piece.grain_line[0].x, y: piece.grain_line[0].y },
          { x: 2 * cx - piece.grain_line[1].x, y: piece.grain_line[1].y },
        ]
      : null,
    notches: piece.notches.map(n => ({ x: 2 * cx - n.x, y: n.y })),
    internal_lines: piece.internal_lines.map(line =>
      line.map(seg => mirrorSegmentX(seg, cx)),
    ),
    metadata: { ...piece.metadata },
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
