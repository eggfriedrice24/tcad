import type { Camera } from "../canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "./tool-types";
import type { CurveSegment, PatternPieceData, Point2D } from "@/types/pattern";

import { applyTransform } from "../canvas-math";
import { snapToGrid } from "../snap";

// --- Node model ---

type AnchorRef = { kind: "anchor"; index: number };
type HandleRef = { kind: "handle"; segIndex: number; handleKey: "control" | "control1" | "control2" };
type NodeRef = AnchorRef | HandleRef;

type NodeInfo = {
  ref: NodeRef;
  position: Point2D;
};

const ANCHOR_HIT_RADIUS = 6; // screen pixels
const HANDLE_HIT_RADIUS = 5;

// --- Node extraction ---

function extractNodes(piece: PatternPieceData): NodeInfo[] {
  const nodes: NodeInfo[] = [];

  // Origin = anchor index 0
  nodes.push({ ref: { kind: "anchor", index: 0 }, position: { ...piece.origin } });

  // Segment endpoints = anchor indices 1..N
  for (let i = 0; i < piece.outline.length; i++) {
    const seg = piece.outline[i];

    // Handles first (so anchors draw on top)
    switch (seg.type) {
      case "QuadraticBezier":
        nodes.push({ ref: { kind: "handle", segIndex: i, handleKey: "control" }, position: { ...seg.control } });
        break;
      case "CubicBezier":
        nodes.push({ ref: { kind: "handle", segIndex: i, handleKey: "control1" }, position: { ...seg.control1 } });
        nodes.push({ ref: { kind: "handle", segIndex: i, handleKey: "control2" }, position: { ...seg.control2 } });
        break;
    }

    // Anchor at segment endpoint
    if ("end" in seg) {
      nodes.push({ ref: { kind: "anchor", index: i + 1 }, position: { ...seg.end } });
    }
  }

  return nodes;
}

// --- Hit testing ---

function hitTestNodes(world: Point2D, nodes: NodeInfo[], zoom: number): NodeInfo | null {
  // Test handles first (smaller targets, usually on top in terms of priority)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const dx = world.x - node.position.x;
    const dy = world.y - node.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const threshold = (node.ref.kind === "handle" ? HANDLE_HIT_RADIUS : ANCHOR_HIT_RADIUS) / zoom;
    if (dist < threshold)
      return node;
  }
  return null;
}

// --- Apply node move ---

function refKey(ref: NodeRef): string {
  if (ref.kind === "anchor")
    return `a:${ref.index}`;
  return `h:${ref.segIndex}:${ref.handleKey}`;
}

function applyNodeMove(piece: PatternPieceData, movedRefs: Set<string>, dx: number, dy: number): PatternPieceData {
  const origin = movedRefs.has("a:0")
    ? { x: piece.origin.x + dx, y: piece.origin.y + dy }
    : { ...piece.origin };

  const outline: CurveSegment[] = piece.outline.map((seg, i) => {
    const anchorKey = `a:${i + 1}`;
    switch (seg.type) {
      case "Line": {
        const endMoved = movedRefs.has(anchorKey);
        return {
          ...seg,
          end: endMoved ? { x: seg.end.x + dx, y: seg.end.y + dy } : { ...seg.end },
        };
      }
      case "QuadraticBezier": {
        const endMoved = movedRefs.has(anchorKey);
        const ctrlMoved = movedRefs.has(`h:${i}:control`);
        return {
          ...seg,
          control: ctrlMoved ? { x: seg.control.x + dx, y: seg.control.y + dy } : { ...seg.control },
          end: endMoved ? { x: seg.end.x + dx, y: seg.end.y + dy } : { ...seg.end },
        };
      }
      case "CubicBezier": {
        const endMoved = movedRefs.has(anchorKey);
        const c1Moved = movedRefs.has(`h:${i}:control1`);
        const c2Moved = movedRefs.has(`h:${i}:control2`);
        return {
          ...seg,
          control1: c1Moved ? { x: seg.control1.x + dx, y: seg.control1.y + dy } : { ...seg.control1 },
          control2: c2Moved ? { x: seg.control2.x + dx, y: seg.control2.y + dy } : { ...seg.control2 },
          end: endMoved ? { x: seg.end.x + dx, y: seg.end.y + dy } : { ...seg.end },
        };
      }
      case "Arc": {
        const centerMoved = movedRefs.has(anchorKey);
        return {
          ...seg,
          center: centerMoved ? { x: seg.center.x + dx, y: seg.center.y + dy } : { ...seg.center },
        };
      }
      default:
        return seg;
    }
  });

  return { ...piece, origin, outline };
}

// --- Colors ---
const COLOR_ANCHOR_SELECTED = "#db2777";
const COLOR_ANCHOR_BORDER = "#ffffff";
const COLOR_HANDLE = "#ec4899";
const COLOR_HANDLE_LINE = "rgba(236, 72, 153, 0.3)";
const COLOR_ANCHOR_UNSELECTED = "rgba(236, 72, 153, 0.4)";
const COLOR_HANDLE_UNSELECTED = "rgba(236, 72, 153, 0.35)";

// --- Tool ---

export function createNodeEditTool(ctx: ToolContext): CanvasTool {
  let selectedRefs: Set<string> = new Set();
  let isDragging = false;
  let dragStart: Point2D | null = null;
  let dragOffset: Point2D = { x: 0, y: 0 };
  let hasMoved = false;

  function getTargetPiece(): PatternPieceData | null {
    const ids = ctx.selectedIdsRef.current;
    if (ids.size !== 1)
      return null;
    const id = [...ids][0];
    return ctx.piecesRef.current.find(p => p.id === id) ?? null;
  }

  function onPointerDown(state: PointerState) {
    if (state.button !== 0)
      return;

    const piece = getTargetPiece();
    if (!piece)
      return;

    const nodes = extractNodes(piece);
    const hit = hitTestNodes(state.world, nodes, ctx.cameraRef.current.zoom);

    if (hit) {
      const key = refKey(hit.ref);

      if (state.shiftKey) {
        // Toggle selection
        const next = new Set(selectedRefs);
        if (next.has(key)) {
          next.delete(key);
        }
        else {
          next.add(key);
        }
        selectedRefs = next;
      }
      else if (!selectedRefs.has(key)) {
        selectedRefs = new Set([key]);
      }

      // Start drag
      isDragging = true;
      dragStart = { ...state.world };
      dragOffset = { x: 0, y: 0 };
      hasMoved = false;
    }
    else {
      // Clicked empty
      selectedRefs = new Set();
    }
  }

  function onPointerMove(state: PointerState) {
    if (!isDragging || !dragStart)
      return;

    const dx = state.world.x - dragStart.x;
    const dy = state.world.y - dragStart.y;

    if (!hasMoved && Math.abs(dx) + Math.abs(dy) < 2 / ctx.cameraRef.current.zoom) {
      return;
    }

    hasMoved = true;

    // Apply snap to the offset destination
    const piece = getTargetPiece();
    if (!piece)
      return;

    // Find first selected node position for snap reference
    const nodes = extractNodes(piece);
    const firstSelected = nodes.find(n => selectedRefs.has(refKey(n.ref)));
    if (firstSelected) {
      const rawTarget = { x: firstSelected.position.x + dx, y: firstSelected.position.y + dy };
      const snapResult = snapToGrid(rawTarget, ctx.cameraRef.current.zoom, ctx.snapEnabledRef.current);
      dragOffset = {
        x: snapResult.point.x - firstSelected.position.x,
        y: snapResult.point.y - firstSelected.position.y,
      };
    }
    else {
      dragOffset = { x: dx, y: dy };
    }
  }

  function onPointerUp(_state: PointerState) {
    if (isDragging && hasMoved && selectedRefs.size > 0) {
      const piece = getTargetPiece();
      if (piece) {
        const updated = applyNodeMove(piece, selectedRefs, dragOffset.x, dragOffset.y);
        ctx.updatePiece(piece.id, updated);
      }
    }

    isDragging = false;
    dragStart = null;
    dragOffset = { x: 0, y: 0 };
    hasMoved = false;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      selectedRefs = new Set();
    }
  }

  function drawOverlay(drawCtx: CanvasRenderingContext2D, camera: Camera) {
    const piece = getTargetPiece();
    if (!piece)
      return;

    // Re-read piece from piecesRef for freshness
    const freshPiece = ctx.piecesRef.current.find(p => p.id === piece.id);
    if (!freshPiece)
      return;

    const nodes = extractNodes(freshPiece);
    const dx = hasMoved ? dragOffset.x : 0;
    const dy = hasMoved ? dragOffset.y : 0;

    drawCtx.save();
    applyTransform(drawCtx, camera);

    // Draw handle-to-anchor lines
    for (const node of nodes) {
      if (node.ref.kind !== "handle")
        continue;

      const isSelected = selectedRefs.has(refKey(node.ref));
      const hx = node.position.x + (isSelected ? dx : 0);
      const hy = node.position.y + (isSelected ? dy : 0);

      // Find the parent anchor for this handle
      const seg = freshPiece.outline[node.ref.segIndex];
      let anchorPos: Point2D;

      if (node.ref.handleKey === "control1") {
        // control1 connects to the start anchor of this segment
        const anchorIdx = node.ref.segIndex; // anchor before this segment
        if (anchorIdx === 0) {
          anchorPos = freshPiece.origin;
        }
        else {
          const prevSeg = freshPiece.outline[anchorIdx - 1];
          anchorPos = "end" in prevSeg ? prevSeg.end : freshPiece.origin;
        }
      }
      else if (node.ref.handleKey === "control2") {
        // control2 connects to the end anchor
        anchorPos = "end" in seg ? seg.end : freshPiece.origin;
      }
      else {
        // QuadraticBezier "control" - connect to start anchor
        const anchorIdx = node.ref.segIndex;
        if (anchorIdx === 0) {
          anchorPos = freshPiece.origin;
        }
        else {
          const prevSeg = freshPiece.outline[anchorIdx - 1];
          anchorPos = "end" in prevSeg ? prevSeg.end : freshPiece.origin;
        }
      }

      const anchorKey = node.ref.handleKey === "control2" ? `a:${node.ref.segIndex + 1}` : `a:${node.ref.segIndex}`;
      const anchorSelected = selectedRefs.has(anchorKey);
      const ax = anchorPos.x + (anchorSelected ? dx : 0);
      const ay = anchorPos.y + (anchorSelected ? dy : 0);

      drawCtx.strokeStyle = COLOR_HANDLE_LINE;
      drawCtx.lineWidth = 1 / camera.zoom;
      drawCtx.setLineDash([3 / camera.zoom, 2 / camera.zoom]);
      drawCtx.beginPath();
      drawCtx.moveTo(ax, ay);
      drawCtx.lineTo(hx, hy);
      drawCtx.stroke();
      drawCtx.setLineDash([]);
    }

    // Draw nodes
    for (const node of nodes) {
      const key = refKey(node.ref);
      const isSelected = selectedRefs.has(key);
      const nx = node.position.x + (isSelected ? dx : 0);
      const ny = node.position.y + (isSelected ? dy : 0);

      if (node.ref.kind === "anchor") {
        // Filled square
        const size = 5 / camera.zoom;
        const half = size / 2;

        // Border
        drawCtx.fillStyle = COLOR_ANCHOR_BORDER;
        drawCtx.fillRect(nx - half - 1 / camera.zoom, ny - half - 1 / camera.zoom, size + 2 / camera.zoom, size + 2 / camera.zoom);

        // Fill
        drawCtx.fillStyle = isSelected ? COLOR_ANCHOR_SELECTED : COLOR_ANCHOR_UNSELECTED;
        drawCtx.fillRect(nx - half, ny - half, size, size);
      }
      else {
        // Handle: filled circle
        const r = 3 / camera.zoom;
        drawCtx.fillStyle = isSelected ? COLOR_HANDLE : COLOR_HANDLE_UNSELECTED;
        drawCtx.beginPath();
        drawCtx.arc(nx, ny, r, 0, Math.PI * 2);
        drawCtx.fill();
      }
    }

    drawCtx.restore();
  }

  function getCursor(): string {
    if (isDragging && hasMoved)
      return "grabbing";

    const piece = getTargetPiece();
    if (!piece)
      return "default";

    return "default";
  }

  function cleanup() {
    selectedRefs = new Set();
    isDragging = false;
    dragStart = null;
    dragOffset = { x: 0, y: 0 };
    hasMoved = false;
  }

  return {
    name: "node-edit",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick: () => {},
    onKeyDown,
    drawOverlay,
    getCursor,
    cleanup,
  };
}
