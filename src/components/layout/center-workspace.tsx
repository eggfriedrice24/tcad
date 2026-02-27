import { useWorkspace } from "@/hooks/use-workspace";

export function CenterWorkspace() {
  const { viewMode } = useWorkspace();

  return (
    <div className="relative flex flex-1 items-center justify-center bg-muted/30">
      <p className="text-sm text-muted-foreground">
        {viewMode === "2d" && "2D Canvas"}
        {viewMode === "3d" && "3D Viewport"}
        {viewMode === "split" && "Split View"}
      </p>
    </div>
  );
}
