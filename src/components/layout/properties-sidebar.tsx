import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { PiecePropertiesForm } from "@/features/pattern/components/piece-properties-form";
import { usePatternPiece } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelection } from "@/hooks/use-selection";

export function PropertiesSidebar() {
  const { selectedIds } = useSelection();
  const selectedCount = selectedIds.size;
  const firstId = selectedCount > 0 ? [...selectedIds][0] : undefined;
  const { data: piece } = usePatternPiece(firstId);

  return (
    <Sidebar side="right" collapsible="none" className="border-l">
      <SidebarHeader>
        <span className="px-2 text-sm font-semibold">Properties</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Selection</SidebarGroupLabel>
          <SidebarGroupContent>
            {selectedCount > 1
              ? (
                  <p className="px-2 text-xs text-muted-foreground">
                    {selectedCount}
                    {" "}
                    pieces selected
                  </p>
                )
              : piece
                ? <PiecePropertiesForm piece={piece} />
                : (
                    <p className="px-2 text-xs text-muted-foreground">
                      {selectedCount > 0 ? "Loading..." : "Nothing selected"}
                    </p>
                  )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
