import type { PatternPieceId } from "@/types/pattern";

import { create } from "zustand";

type SelectionStore = {
  selectedIds: Set<PatternPieceId>;
  hoveredId: PatternPieceId | null;
  select: (id: PatternPieceId) => void;
  toggle: (id: PatternPieceId) => void;
  clear: () => void;
  setHovered: (id: PatternPieceId | null) => void;
};

export const useSelectionStore = create<SelectionStore>(set => ({
  selectedIds: new Set(),
  hoveredId: null,
  select: id => set({ selectedIds: new Set([id]) }),
  toggle: id =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id))
        next.delete(id);
      else
        next.add(id);
      return { selectedIds: next };
    }),
  clear: () => set({ selectedIds: new Set() }),
  setHovered: id => set({ hoveredId: id }),
}));
