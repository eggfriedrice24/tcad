import type { ViewMode } from "@/contexts/workspace-context";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useWorkspace } from "@/hooks/use-workspace";

const viewModes: { id: ViewMode; label: string }[] = [
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
  { id: "split", label: "Split" },
];

export function Toolbar() {
  const { viewMode, setViewMode } = useWorkspace();

  return (
    <header className="flex h-10 shrink-0 items-center border-b px-2">
      <SidebarTrigger />
      <div className="flex flex-1 items-center justify-center gap-1">
        {viewModes.map(mode => (
          <Button
            key={mode.id}
            variant={viewMode === mode.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode(mode.id)}
          >
            {mode.label}
          </Button>
        ))}
      </div>
      <ThemeToggle />
    </header>
  );
}
