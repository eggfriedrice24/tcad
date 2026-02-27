import type { PatternPieceData } from "@/types/pattern";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { usePatternPiece } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelection } from "@/hooks/use-selection";

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-2 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PieceProperties({ piece }: { piece: PatternPieceData }) {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <SidebarGroupLabel>General</SidebarGroupLabel>
        <PropertyRow label="Name" value={piece.name} />
        <PropertyRow label="Origin" value={`${piece.origin.x}, ${piece.origin.y}`} />
        <PropertyRow label="Segments" value={String(piece.outline.length)} />
        <PropertyRow label="Seam" value={`${piece.seam_allowance_mm}mm`} />
      </div>
      <div>
        <SidebarGroupLabel>Metadata</SidebarGroupLabel>
        <PropertyRow label="Fabric" value={piece.metadata.fabric_type ?? "—"} />
        <PropertyRow label="Cut qty" value={String(piece.metadata.cut_quantity)} />
        <PropertyRow label="Mirror" value={piece.metadata.mirror ? "Yes" : "No"} />
        {piece.metadata.notes && <PropertyRow label="Notes" value={piece.metadata.notes} />}
      </div>
      <div>
        <SidebarGroupLabel>Details</SidebarGroupLabel>
        <PropertyRow label="Notches" value={String(piece.notches.length)} />
        <PropertyRow label="Grain line" value={piece.grain_line ? "Yes" : "No"} />
        <PropertyRow label="Internal lines" value={String(piece.internal_lines.length)} />
      </div>
    </div>
  );
}

export function PropertiesSidebar() {
  const { selectedIds } = useSelection();
  const firstId = selectedIds.size > 0 ? [...selectedIds][0] : undefined;
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
            {piece
              ? <PieceProperties piece={piece} />
              : (
                  <p className="px-2 text-xs text-muted-foreground">
                    {selectedIds.size > 0 ? "Loading..." : "Nothing selected"}
                  </p>
                )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
