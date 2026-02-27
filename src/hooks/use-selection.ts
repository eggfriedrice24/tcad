import { useSelectionStore } from "@/stores/selection-store";

export function useSelection() {
  return useSelectionStore();
}
