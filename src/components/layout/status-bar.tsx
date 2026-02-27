import { useTool } from "@/hooks/use-tool";
import { useWorkspace } from "@/hooks/use-workspace";

export function StatusBar() {
  const { activeTool } = useTool();
  const { viewMode } = useWorkspace();

  return (
    <footer className="flex h-7 shrink-0 items-center border-t bg-muted/50 px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>X: 0 Y: 0</span>
        <span>100%</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="capitalize">{activeTool}</span>
        <span className="uppercase">{viewMode}</span>
      </div>
    </footer>
  );
}
