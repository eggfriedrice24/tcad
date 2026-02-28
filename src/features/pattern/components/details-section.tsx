import type { PatternPieceData } from "@/types/pattern";

import { SidebarGroupLabel } from "@/components/ui/sidebar";

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

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
