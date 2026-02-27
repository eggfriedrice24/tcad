import { usePatternPieces } from "@/features/pattern/hooks/use-pattern-queries";
import { useTool } from "@/hooks/use-tool";
import { useWorkspace } from "@/hooks/use-workspace";

export function StatusBar() {
  const { activeTool } = useTool();
  const { viewMode, cursorWorld, zoomPercent } = useWorkspace();
  const { data: pieces } = usePatternPieces();

  const show2dInfo = viewMode !== "3d";
  const pieceCount = pieces?.length ?? 0;

  return (
    <footer className="flex h-7 shrink-0 items-center border-t bg-muted/50 px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        {show2dInfo
          ? (
              <>
                <span>
                  X:
                  {" "}
                  {cursorWorld.x.toFixed(1)}
                  {" "}
                  Y:
                  {" "}
                  {cursorWorld.y.toFixed(1)}
                </span>
                <span>
                  {zoomPercent}
                  %
                </span>
              </>
            )
          : (
              <span>
                {pieceCount}
                {" "}
                {pieceCount === 1 ? "piece" : "pieces"}
              </span>
            )}
      </div>
      <div className="ml-auto flex items-center gap-3">
        {show2dInfo && <span className="capitalize">{activeTool}</span>}
        <span className="uppercase">{viewMode}</span>
      </div>
    </footer>
  );
}
