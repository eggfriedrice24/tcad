export type PatternPieceId = string;

export type Point2D = {
  x: number;
  y: number;
};

export type CurveSegment
  = { type: "Line"; end: Point2D }
    | { type: "QuadraticBezier"; control: Point2D; end: Point2D }
    | { type: "CubicBezier"; control1: Point2D; control2: Point2D; end: Point2D }
    | {
      type: "Arc";
      center: Point2D;
      radius: number;
      start_angle: number;
      end_angle: number;
    };

export type PieceMetadata = {
  fabric_type: string | null;
  cut_quantity: number;
  mirror: boolean;
  notes: string;
};

export type PatternPieceData = {
  id: PatternPieceId;
  name: string;
  origin: Point2D;
  outline: CurveSegment[];
  grain_line: [Point2D, Point2D] | null;
  seam_allowance_mm: number;
  notches: Point2D[];
  internal_lines: CurveSegment[][];
  metadata: PieceMetadata;
};
