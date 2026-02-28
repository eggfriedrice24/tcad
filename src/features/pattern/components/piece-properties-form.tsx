import type { PatternPieceData } from "@/types/pattern";

import { useCallback, useState } from "react";

import { useUpdatePiece } from "@/features/pattern/hooks/use-pattern-queries";

import { extractProperties, piecePropertiesSchema } from "../lib/piece-schema";
import { DetailsSection } from "./details-section";
import { GeneralSection } from "./general-section";
import { MetadataSection } from "./metadata-section";

function PiecePropertiesFormInner({ piece }: { piece: PatternPieceData }) {
  const updatePiece = useUpdatePiece();
  const [values, setValues] = useState(() => extractProperties(piece));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useCallback(() => {
    const result = piecePropertiesSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    const updated: PatternPieceData = {
      ...piece,
      name: result.data.name,
      seam_allowance_mm: result.data.seam_allowance_mm,
      metadata: {
        ...piece.metadata,
        fabric_type: result.data.fabric_type,
        cut_quantity: result.data.cut_quantity,
        mirror: result.data.mirror,
        notes: result.data.notes,
      },
    };
    updatePiece.mutate({ id: piece.id, piece: updated });
  }, [values, piece, updatePiece]);

  const handleMirrorChange = useCallback((mirror: boolean) => {
    setValues(prev => ({ ...prev, mirror }));
    // Save immediately for toggles
    const updated: PatternPieceData = {
      ...piece,
      metadata: { ...piece.metadata, mirror },
    };
    updatePiece.mutate({ id: piece.id, piece: updated });
  }, [piece, updatePiece]);

  return (
    <div className="space-y-3 text-xs">
      <GeneralSection
        piece={piece}
        name={values.name}
        seamAllowance={values.seam_allowance_mm}
        onNameChange={name => setValues(prev => ({ ...prev, name }))}
        onSeamChange={seam_allowance_mm => setValues(prev => ({ ...prev, seam_allowance_mm }))}
        onBlur={save}
        nameError={errors.name}
        seamError={errors.seam_allowance_mm}
      />
      <MetadataSection
        fabricType={values.fabric_type}
        cutQuantity={values.cut_quantity}
        mirror={values.mirror}
        notes={values.notes}
        onFabricChange={fabric_type => setValues(prev => ({ ...prev, fabric_type }))}
        onCutQtyChange={cut_quantity => setValues(prev => ({ ...prev, cut_quantity }))}
        onMirrorChange={handleMirrorChange}
        onNotesChange={notes => setValues(prev => ({ ...prev, notes }))}
        onBlur={save}
        cutQtyError={errors.cut_quantity}
      />
      <DetailsSection piece={piece} />
    </div>
  );
}

// Key on piece.id to reset form state when selection changes
export function PiecePropertiesForm({ piece }: { piece: PatternPieceData }) {
  return <PiecePropertiesFormInner key={piece.id} piece={piece} />;
}
