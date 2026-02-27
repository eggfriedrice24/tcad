import type { ViewMode } from "@/contexts/workspace-context";

import { useState } from "react";

import { WorkspaceContext } from "@/contexts/workspace-context";

type WorkspaceProviderProps = {
  children: React.ReactNode;
  defaultViewMode?: ViewMode;
};

export function WorkspaceProvider({
  children,
  defaultViewMode = "2d",
}: WorkspaceProviderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  return (
    <WorkspaceContext value={{ viewMode, setViewMode }}>
      {children}
    </WorkspaceContext>
  );
}
