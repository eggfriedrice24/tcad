import type { PatternPieceData } from "@/types/pattern";

import { SidebarGroupLabel } from "@/components/ui/sidebar";
import { ReadOnlyRow } from "./read-only-row";

export function DetailsSection({ piece }: { piece: PatternPieceData }) {
  return (
    <div>
      <SidebarGroupLabel>Details</SidebarGroupLabel>
      <div className="text-xs">
        <ReadOnlyRow label="Notches" value={String(piece.notches.length)} />
        <ReadOnlyRow label="Grain line" value={piece.grain_line ? "Yes" : "No"} />
        <ReadOnlyRow label="Internal lines" value={String(piece.internal_lines.length)} />
      </div>
    </div>
  );
}
