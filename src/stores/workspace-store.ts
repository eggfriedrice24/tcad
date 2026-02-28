import type { Point2D } from "@/types/pattern";

import { create } from "zustand";

export type ViewMode = "2d" | "3d" | "split";

type WorkspaceStore = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  cursorWorld: Point2D;
  setCursorWorld: (pt: Point2D) => void;
  zoomPercent: number;
  setZoomPercent: (pct: number) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
  rulersVisible: boolean;
  toggleRulers: () => void;
};

export const useWorkspaceStore = create<WorkspaceStore>(set => ({
  viewMode: "2d",
  setViewMode: mode => set({ viewMode: mode }),
  cursorWorld: { x: 0, y: 0 },
  setCursorWorld: pt => set({ cursorWorld: pt }),
  zoomPercent: 100,
  setZoomPercent: pct => set({ zoomPercent: pct }),
  snapEnabled: false,
  toggleSnap: () => set(s => ({ snapEnabled: !s.snapEnabled })),
  rulersVisible: true,
  toggleRulers: () => set(s => ({ rulersVisible: !s.rulersVisible })),
}));
