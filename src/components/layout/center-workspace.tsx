import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Canvas2D } from "@/features/canvas/components/canvas-2d";
import { Viewport3D } from "@/features/viewport3d/components/viewport-3d";
import { useWorkspace } from "@/hooks/use-workspace";

export function CenterWorkspace() {
  const { viewMode } = useWorkspace();

  return (
    <div className="relative flex flex-1 bg-muted/30">
      {viewMode === "2d" && <Canvas2D />}
      {viewMode === "3d" && <Viewport3D />}
      {viewMode === "split" && (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="relative size-full">
              <Canvas2D />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <Viewport3D />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
