import { createContext } from "react";

export type ViewMode = "2d" | "3d" | "split";

export type WorkspaceContextState = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

const initialState: WorkspaceContextState = {
  viewMode: "2d",
  setViewMode: () => null,
};

export const WorkspaceContext = createContext<WorkspaceContextState>(initialState);
