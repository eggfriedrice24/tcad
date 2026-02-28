import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarGroupLabel } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type MetadataSectionProps = {
  fabricType: string | null;
  cutQuantity: number;
  mirror: boolean;
  notes: string;
  onFabricChange: (value: string | null) => void;
  onCutQtyChange: (value: number) => void;
  onMirrorChange: (value: boolean) => void;
  onNotesChange: (value: string) => void;
  onBlur: () => void;
  cutQtyError?: string;
};

export function MetadataSection({ fabricType, cutQuantity, mirror, notes, onFabricChange, onCutQtyChange, onMirrorChange, onNotesChange, onBlur, cutQtyError }: MetadataSectionProps) {
  return (
    <div>
      <SidebarGroupLabel>Metadata</SidebarGroupLabel>
      <div className="space-y-2 px-2">
        <div className="space-y-1">
          <Label htmlFor="piece-fabric" className="text-muted-foreground">Fabric type</Label>
          <Input
            id="piece-fabric"
            value={fabricType ?? ""}
            onChange={e => onFabricChange(e.target.value || null)}
            onBlur={onBlur}
            placeholder="e.g. Cotton"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="piece-cut-qty" className="text-muted-foreground">Cut quantity</Label>
          <Input
            id="piece-cut-qty"
            type="number"
            min={1}
            step={1}
            value={cutQuantity}
            onChange={e => onCutQtyChange(Math.max(1, Math.round(e.target.valueAsNumber || 1)))}
            onBlur={onBlur}
            className="h-7 text-xs"
          />
          {cutQtyError && <p className="text-[10px] text-destructive">{cutQtyError}</p>}
        </div>
        <div className="flex items-center justify-between py-0.5">
          <Label htmlFor="piece-mirror" className="text-muted-foreground">Mirror</Label>
          <Switch
            id="piece-mirror"
            checked={mirror}
            onCheckedChange={onMirrorChange}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="piece-notes" className="text-muted-foreground">Notes</Label>
          <Textarea
            id="piece-notes"
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            onBlur={onBlur}
            rows={2}
            className="min-h-0 resize-none text-xs"
          />
        </div>
      </div>
    </div>
  );
}
