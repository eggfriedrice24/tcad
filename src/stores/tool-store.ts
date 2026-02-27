import { create } from "zustand";

export type Tool = "select" | "pen" | "line" | "curve" | "measure";

type ToolStore = {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
};

export const useToolStore = create<ToolStore>(set => ({
  activeTool: "select",
  setActiveTool: tool => set({ activeTool: tool }),
}));
