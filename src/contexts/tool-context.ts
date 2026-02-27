import { createContext } from "react";

export type Tool = "select" | "pen" | "line" | "curve" | "measure";

export type ToolContextState = {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
};

const initialState: ToolContextState = {
  activeTool: "select",
  setActiveTool: () => null,
};

export const ToolContext = createContext<ToolContextState>(initialState);
