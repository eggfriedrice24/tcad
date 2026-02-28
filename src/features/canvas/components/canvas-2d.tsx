import type { Camera } from "../lib/canvas-math";
import type { CanvasTool, PointerState, ToolContext } from "../lib/tools/tool-types";
import type { Tool } from "@/stores/tool-store";

import { open, save } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useRef } from "react";
import { useCreatePiece, useDeletePiece, useLoadProject, useNewProject, usePatternPieces, useRedo, useSaveProject, useUndo, useUpdatePiece } from "@/features/pattern/hooks/use-pattern-queries";
import { useProjectStore } from "@/stores/project-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useToolStore } from "@/stores/tool-store";

import { useWorkspaceStore } from "@/stores/workspace-store";

import { createCamera, screenToWorld, zoomAtPoint } from "../lib/canvas-math";
import { clearCanvas, drawGrid, drawPieces } from "../lib/canvas-renderer";
import { createTool } from "../lib/tools/create-tool";

const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: "select",
  a: "node-edit",
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
  const snapEnabledRef = useRef(useWorkspaceStore.getState().snapEnabled);
  useEffect(() => {
    return useWorkspaceStore.subscribe((state) => {
      snapEnabledRef.current = state.snapEnabled;
    });
  }, []);

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

  // Mutations — single ref object synced each render
  const mutations = {
    createPiece: useCreatePiece(),
    updatePiece: useUpdatePiece(),
    deletePiece: useDeletePiece(),
    undo: useUndo(),
    redo: useRedo(),
    save: useSaveProject(),
    load: useLoadProject(),
    new: useNewProject(),
  };
  const mutRef = useRef(mutations);
  useEffect(() => {
    mutRef.current = mutations;
  });

  // Sync settled zoom to workspace store (debounced)
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
      createPiece: piece => mutRef.current.createPiece.mutate(piece),
      updatePiece: (id, piece) => mutRef.current.updatePiece.mutate({ id, piece }),
      deletePiece: id => mutRef.current.deletePiece.mutate(id),
      selectPiece: id => useSelectionStore.getState().select(id),
      togglePiece: id => useSelectionStore.getState().toggle(id),
      clearSelection: () => useSelectionStore.getState().clear(),
      setHovered: id => useSelectionStore.getState().setHovered(id),
      setActiveTool: tool => useToolStore.getState().setActiveTool(tool as Tool),
      screenToWorld: (sx, sy) => screenToWorld(cameraRef.current, sx, sy),
      getCanvasRect: () => canvasRef.current?.getBoundingClientRect() ?? null,
      snapEnabledRef,
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

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          mutRef.current.redo.mutate();
        }
        else {
          mutRef.current.undo.mutate();
        }
        return;
      }

      // Save (Ctrl+S / Ctrl+Shift+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const projectStore = useProjectStore.getState();
        if (!e.shiftKey && projectStore.path) {
          mutRef.current.save.mutate(projectStore.path, {
            onSuccess: () => projectStore.setDirty(false),
          });
        }
        else {
          save({ filters: [{ name: "TCAD", extensions: ["tcad"] }] }).then((filePath) => {
            if (!filePath)
              return;
            const finalPath = filePath.endsWith(".tcad") ? filePath : `${filePath}.tcad`;
            const fileName = finalPath.split("/").pop()?.replace(".tcad", "") ?? "Untitled";
            mutRef.current.save.mutate(finalPath, {
              onSuccess: () => projectStore.setProject(fileName, finalPath),
            });
          });
        }
        return;
      }

      // Open (Ctrl+O)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        open({ filters: [{ name: "TCAD", extensions: ["tcad"] }], multiple: false }).then((path) => {
          if (path) {
            const name = path.split("/").pop()?.replace(".tcad", "") ?? "Untitled";
            mutRef.current.load.mutate(path, {
              onSuccess: () => {
                useProjectStore.getState().setProject(name, path);
                useSelectionStore.getState().clear();
              },
            });
          }
        });
        return;
      }

      // New (Ctrl+N)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        mutRef.current.new.mutate(undefined, {
          onSuccess: () => {
            useProjectStore.getState().reset();
            useSelectionStore.getState().clear();
          },
        });
        return;
      }

      // Snap toggle
      if (e.key === ".") {
        e.preventDefault();
        useWorkspaceStore.getState().toggleSnap();
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
      altKey: e.altKey,
      ctrlKey: e.ctrlKey || e.metaKey,
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
