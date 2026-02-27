import type { Camera } from "../lib/canvas-math";

import { useCallback, useEffect, useRef } from "react";
import { usePatternPieces } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelectionStore } from "@/stores/selection-store";

import { useWorkspaceStore } from "@/stores/workspace-store";

import { createCamera, screenToWorld, zoomAtPoint } from "../lib/canvas-math";
import { clearCanvas, drawGrid, drawPieces } from "../lib/canvas-renderer";
import { hitTestPieces } from "../lib/hit-test";

export function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<Camera>(createCamera());
  const rafRef = useRef<number>(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);

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

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // --- Keyboard (space for pan) ---
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        spaceHeldRef.current = true;
      }
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

    // Left click → select
    if (e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(cameraRef.current, sx, sy);
      const hit = hitTestPieces(world, piecesRef.current, cameraRef.current.zoom);

      if (hit) {
        if (e.shiftKey) {
          useSelectionStore.getState().toggle(hit.id);
        }
        else {
          useSelectionStore.getState().select(hit.id);
        }
      }
      else {
        useSelectionStore.getState().clear();
      }
    }
  }, []);

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

    // Hover detection
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(cameraRef.current, sx, sy);

    // Update cursor coords in workspace store
    useWorkspaceStore.getState().setCursorWorld({ x: Math.round(world.x * 10) / 10, y: Math.round(world.y * 10) / 10 });

    const hit = hitTestPieces(world, piecesRef.current, cameraRef.current.zoom);
    const newHoveredId = hit?.id ?? null;
    if (newHoveredId !== hoveredIdRef.current) {
      useSelectionStore.getState().setHovered(newHoveredId);
    }

    // Cursor style
    canvas.style.cursor = hit
      ? "pointer"
      : spaceHeldRef.current
        ? "grab"
        : "default";
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      canvasRef.current?.releasePointerCapture(e.pointerId);
    }
  }, []);

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
        onWheel={onWheel}
        onContextMenu={e => e.preventDefault()}
      />
    </div>
  );
}
