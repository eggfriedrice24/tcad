import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Canvas2D } from "@/features/canvas/components/canvas-2d";
import { useWorkspace } from "@/hooks/use-workspace";

export function CenterWorkspace() {
  const { viewMode } = useWorkspace();

  return (
    <div className="relative flex flex-1 bg-muted/30">
      {viewMode === "2d" && <Canvas2D />}
      {viewMode === "3d" && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">3D Viewport</p>
        </div>
      )}
      {viewMode === "split" && (
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="relative size-full">
              <Canvas2D />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="flex size-full items-center justify-center">
              <p className="text-sm text-muted-foreground">3D Viewport</p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
