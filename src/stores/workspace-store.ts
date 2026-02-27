import { create } from "zustand";

export type ViewMode = "2d" | "3d" | "split";

type WorkspaceStore = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>(set => ({
  viewMode: "2d",
  setViewMode: mode => set({ viewMode: mode }),
}));
