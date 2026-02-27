import { Canvas2D } from "@/features/canvas/components/canvas-2d";
import { useWorkspace } from "@/hooks/use-workspace";

export function CenterWorkspace() {
  const { viewMode } = useWorkspace();

  return (
    <div className="relative flex flex-1 items-center justify-center bg-muted/30">
      {viewMode === "2d" && <Canvas2D />}
      {viewMode === "3d" && (
        <p className="text-sm text-muted-foreground">3D Viewport</p>
      )}
      {viewMode === "split" && (
        <p className="text-sm text-muted-foreground">Split View</p>
      )}
    </div>
  );
}
