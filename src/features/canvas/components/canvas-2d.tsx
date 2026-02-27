import type { Camera } from "../lib/canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "../lib/tools/tool-types";
import type { Tool } from "@/stores/tool-store";

import { useCallback, useEffect, useRef } from "react";
import { useCreatePiece, useDeletePiece, usePatternPieces, useUpdatePiece } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelectionStore } from "@/stores/selection-store";
import { useToolStore } from "@/stores/tool-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

import { createCamera, screenToWorld, zoomAtPoint } from "../lib/canvas-math";
import { clearCanvas, drawGrid, drawPieces } from "../lib/canvas-renderer";
import { createTool } from "../lib/tools/create-tool";

const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: "select",
  l: "line",
  c: "curve",
  p: "pen",
  m: "measure",
};

function isTextInput(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement))
    return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<Camera>(createCamera());
  const rafRef = useRef<number>(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  const toolRef = useRef<CanvasTool | null>(null);

  const { data: pieces } = usePatternPieces();
  const piecesRef = useRef(pieces ?? []);
  useEffect(() => {
    piecesRef.current = pieces ?? [];
  }, [pieces]);

  // Keep refs for selection state to avoid re-renders in rAF
  const selectedIdsRef = useRef(useSelectionStore.getState().selectedIds);
  const hoveredIdRef = useRef(useSelectionStore.getState().hoveredId);
  useEffect(() => {
    return useSelectionStore.subscribe((state) => {
      selectedIdsRef.current = state.selectedIds;
      hoveredIdRef.current = state.hoveredId;
    });
  }, []);

  // Mutations
  const createPieceMut = useCreatePiece();
  const updatePieceMut = useUpdatePiece();
  const deletePieceMut = useDeletePiece();
  const createPieceMutRef = useRef(createPieceMut);
  const updatePieceMutRef = useRef(updatePieceMut);
  const deletePieceMutRef = useRef(deletePieceMut);
  useEffect(() => {
    createPieceMutRef.current = createPieceMut;
  }, [createPieceMut]);
  useEffect(() => {
    updatePieceMutRef.current = updatePieceMut;
  }, [updatePieceMut]);
  useEffect(() => {
    deletePieceMutRef.current = deletePieceMut;
  }, [deletePieceMut]);

  // Sync settled zoom to workspace store (debounced)
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const syncZoom = useCallback((zoom: number) => {
    clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => {
      useWorkspaceStore.getState().setZoomPercent(Math.round(zoom * 100));
    }, 50);
  }, []);

  // Track container size in a ref so resize + redraw happen in the same frame
  const sizeRef = useRef({ w: 0, h: 0 });
  useEffect(() => {
    const container = containerRef.current;
    if (!container)
      return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      sizeRef.current = { w: width, h: height };
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Build tool context (stable ref, callbacks use refs internally)
  const toolCtxRef = useRef<ToolContext | null>(null);
  if (!toolCtxRef.current) {
    toolCtxRef.current = {
      cameraRef,
      piecesRef,
      selectedIdsRef,
      hoveredIdRef,
      canvasRef,
      createPiece: piece => createPieceMutRef.current.mutate(piece),
      updatePiece: (id, piece) => updatePieceMutRef.current.mutate({ id, piece }),
      deletePiece: id => deletePieceMutRef.current.mutate(id),
      selectPiece: id => useSelectionStore.getState().select(id),
      togglePiece: id => useSelectionStore.getState().toggle(id),
      clearSelection: () => useSelectionStore.getState().clear(),
      setHovered: id => useSelectionStore.getState().setHovered(id),
      setActiveTool: tool => useToolStore.getState().setActiveTool(tool as Tool),
      screenToWorld: (sx, sy) => screenToWorld(cameraRef.current, sx, sy),
      getCanvasRect: () => canvasRef.current?.getBoundingClientRect() ?? null,
    };
  }

  // Create/recreate tool when active tool changes
  useEffect(() => {
    const createNewTool = (toolName: Tool) => {
      toolRef.current?.cleanup();
      toolRef.current = createTool(toolName, toolCtxRef.current!);
    };

    // Initialize with current tool
    createNewTool(useToolStore.getState().activeTool);

    return useToolStore.subscribe((state) => {
      createNewTool(state.activeTool);
    });
  }, []);

  // --- rAF render loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      return;

    function render() {
      const dpr = window.devicePixelRatio || 1;
      const { w: cssW, h: cssH } = sizeRef.current;
      const bufW = Math.round(cssW * dpr);
      const bufH = Math.round(cssH * dpr);

      // Resize canvas buffer only when needed (same frame as draw — no blink)
      if (canvas!.width !== bufW || canvas!.height !== bufH) {
        canvas!.width = bufW;
        canvas!.height = bufH;
        canvas!.style.width = `${cssW}px`;
        canvas!.style.height = `${cssH}px`;
      }

      const cam = cameraRef.current;
      const dprCam = { x: cam.x * dpr, y: cam.y * dpr, zoom: cam.zoom * dpr };

      clearCanvas(ctx!, bufW, bufH);
      drawGrid(ctx!, dprCam, bufW, bufH);
      drawPieces(ctx!, dprCam, piecesRef.current, selectedIdsRef.current, hoveredIdRef.current);

      // Draw tool overlay
      toolRef.current?.drawOverlay(ctx!, dprCam);

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // --- Keyboard (space for pan + tool shortcuts + tool key events) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in text inputs
      if (isTextInput(e.target))
        return;

      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
        return;
      }

      // Tool shortcuts (single key, no modifiers)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolName = TOOL_SHORTCUTS[e.key.toLowerCase()];
        if (toolName) {
          e.preventDefault();
          useToolStore.getState().setActiveTool(toolName);
          return;
        }
      }

      // Forward to active tool
      toolRef.current?.onKeyDown(e);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // --- Helper to build PointerState from React event ---
  const getPointerState = useCallback((e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>): PointerState | null => {
    const canvas = canvasRef.current;
    if (!canvas)
      return null;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(cameraRef.current, sx, sy);
    return {
      world,
      screen: { x: sx, y: sy },
      shiftKey: e.shiftKey,
      button: e.button,
    };
  }, []);

  // --- Pointer events ---
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    // Middle mouse button OR space+left-click → pan
    if (e.button === 1 || (e.button === 0 && spaceHeldRef.current)) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
      return;
    }

    const state = getPointerState(e);
    if (state) {
      toolRef.current?.onPointerDown(state);
    }
  }, [getPointerState]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;

    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      cameraRef.current = {
        ...cameraRef.current,
        x: cameraRef.current.x + dx,
        y: cameraRef.current.y + dy,
      };
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Update cursor coords in workspace store
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(cameraRef.current, sx, sy);
    useWorkspaceStore.getState().setCursorWorld({ x: Math.round(world.x * 10) / 10, y: Math.round(world.y * 10) / 10 });

    const state = getPointerState(e);
    if (state) {
      toolRef.current?.onPointerMove(state);
    }

    // Cursor style
    if (spaceHeldRef.current) {
      canvas.style.cursor = "grab";
    }
    else {
      canvas.style.cursor = toolRef.current?.getCursor() ?? "default";
    }
  }, [getPointerState]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      canvasRef.current?.releasePointerCapture(e.pointerId);
      return;
    }

    const state = getPointerState(e);
    if (state) {
      toolRef.current?.onPointerUp(state);
    }
  }, [getPointerState]);

  const onDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current)
      return;
    const state = getPointerState(e);
    if (state) {
      toolRef.current?.onDoubleClick(state);
    }
  }, [getPointerState]);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    cameraRef.current = zoomAtPoint(cameraRef.current, sx, sy, e.deltaY);
    syncZoom(cameraRef.current.zoom);
  }, [syncZoom]);

  // Prevent default on wheel to allow zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas)
      return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener("wheel", prevent, { passive: false });
    return () => canvas.removeEventListener("wheel", prevent);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block size-full"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}
