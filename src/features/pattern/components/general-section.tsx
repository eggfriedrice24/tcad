import type { PatternPieceData } from "@/types/pattern";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarGroupLabel } from "@/components/ui/sidebar";
import { displayY } from "@/features/canvas/lib/canvas-math";
import { ReadOnlyRow } from "./read-only-row";

type GeneralSectionProps = {
  piece: PatternPieceData;
  name: string;
  seamAllowance: number;
  onNameChange: (value: string) => void;
  onSeamChange: (value: number) => void;
  onBlur: () => void;
  nameError?: string;
  seamError?: string;
};

export function GeneralSection({ piece, name, seamAllowance, onNameChange, onSeamChange, onBlur, nameError, seamError }: GeneralSectionProps) {
  return (
    <div>
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <div className="space-y-2 px-2">
        <div className="space-y-1">
          <Label htmlFor="piece-name" className="text-muted-foreground">Name</Label>
          <Input
            id="piece-name"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            onBlur={onBlur}
            className="h-7 text-xs"
          />
          {nameError && <p className="text-[10px] text-destructive">{nameError}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="piece-seam" className="text-muted-foreground">Seam allowance (mm)</Label>
          <Input
            id="piece-seam"
            type="number"
            min={0}
            step={0.5}
            value={seamAllowance}
            onChange={e => onSeamChange(e.target.valueAsNumber || 0)}
            onBlur={onBlur}
            className="h-7 text-xs"
          />
          {seamError && <p className="text-[10px] text-destructive">{seamError}</p>}
        </div>
      </div>
      <div className="mt-1 text-xs">
        <ReadOnlyRow label="Origin" value={`${piece.origin.x.toFixed(1)}, ${displayY(piece.origin.y).toFixed(1)}`} />
        <ReadOnlyRow label="Segments" value={String(piece.outline.length)} />
      </div>
    </div>
  );
}
