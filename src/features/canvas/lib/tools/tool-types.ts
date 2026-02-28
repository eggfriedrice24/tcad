import type { Camera } from "../canvas-math";
import type { CurveSegment, PatternPieceData, PatternPieceId, Point2D } from "@/types/pattern";

export type ToolContext = {
  cameraRef: { current: Camera };
  piecesRef: { current: PatternPieceData[] };
  selectedIdsRef: { current: Set<PatternPieceId> };
  hoveredIdRef: { current: PatternPieceId | null };
  canvasRef: { current: HTMLCanvasElement | null };

  // Callbacks
  createPiece: (piece: PatternPieceData) => void;
  updatePiece: (id: PatternPieceId, piece: PatternPieceData) => void;
  deletePiece: (id: PatternPieceId) => void;
  selectPiece: (id: PatternPieceId) => void;
  togglePiece: (id: PatternPieceId) => void;
  clearSelection: () => void;
  setHovered: (id: PatternPieceId | null) => void;
  setActiveTool: (tool: string) => void;

  // Screen-to-world conversion
  screenToWorld: (sx: number, sy: number) => Point2D;
  getCanvasRect: () => DOMRect | null;

  // Snap
  snapEnabledRef: { current: boolean };
};

export type PointerState = {
  world: Point2D;
  screen: Point2D;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  button: number;
};

export type CanvasTool = {
  name: string;
  onPointerDown: (state: PointerState) => void;
  onPointerMove: (state: PointerState) => void;
  onPointerUp: (state: PointerState) => void;
  onDoubleClick: (state: PointerState) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  drawOverlay: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
  getCursor: () => string;
  cleanup: () => void;
};

export type DrawingPoint = {
  position: Point2D;
  handleIn: Point2D | null;
  handleOut: Point2D | null;
};

export type DrawingState = {
  points: Point2D[];
  segments: CurveSegment[];
  mousePosition: Point2D | null;
};
