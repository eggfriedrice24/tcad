import type { WorkspaceContextState } from "@/contexts/workspace-context";

import { use } from "react";

import { WorkspaceContext } from "@/contexts/workspace-context";

export function useWorkspace(): WorkspaceContextState {
  const context = use(WorkspaceContext);

  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
