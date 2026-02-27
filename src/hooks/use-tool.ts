import type { ToolContextState } from "@/contexts/tool-context";

import { use } from "react";

import { ToolContext } from "@/contexts/tool-context";

export function useTool(): ToolContextState {
  const context = use(ToolContext);

  if (context === undefined) {
    throw new Error("useTool must be used within a ToolProvider");
  }

  return context;
}
