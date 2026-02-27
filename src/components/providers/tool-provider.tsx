import type { Tool } from "@/contexts/tool-context";

import { useState } from "react";

import { ToolContext } from "@/contexts/tool-context";

type ToolProviderProps = {
  children: React.ReactNode;
  defaultTool?: Tool;
};

export function ToolProvider({
  children,
  defaultTool = "select",
}: ToolProviderProps) {
  const [activeTool, setActiveTool] = useState<Tool>(defaultTool);

  return (
    <ToolContext value={{ activeTool, setActiveTool }}>
      {children}
    </ToolContext>
  );
}
