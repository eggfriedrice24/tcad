import { create } from "zustand";

type ProjectStore = {
  name: string;
  path: string | null;
  dirty: boolean;
  setProject: (name: string, path: string) => void;
  setDirty: (dirty: boolean) => void;
  reset: () => void;
};

export const useProjectStore = create<ProjectStore>(set => ({
  name: "Untitled",
  path: null,
  dirty: false,
  setProject: (name, path) => set({ name, path, dirty: false }),
  setDirty: dirty => set({ dirty }),
  reset: () => set({ name: "Untitled", path: null, dirty: false }),
}));
