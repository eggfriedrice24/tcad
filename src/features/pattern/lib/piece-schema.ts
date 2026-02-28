import { z } from "zod/v4";

export const piecePropertiesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  seam_allowance_mm: z.number().min(0, "Must be >= 0"),
  fabric_type: z.string().nullable(),
  cut_quantity: z.int().min(1, "Must be >= 1"),
  mirror: z.boolean(),
  notes: z.string(),
});

export type PiecePropertiesValues = z.infer<typeof piecePropertiesSchema>;

export function extractProperties(piece: { name: string; seam_allowance_mm: number; metadata: { fabric_type: string | null; cut_quantity: number; mirror: boolean; notes: string } }): PiecePropertiesValues {
  return {
    name: piece.name,
    seam_allowance_mm: piece.seam_allowance_mm,
    fabric_type: piece.metadata.fabric_type,
    cut_quantity: piece.metadata.cut_quantity,
    mirror: piece.metadata.mirror,
    notes: piece.metadata.notes,
  };
}
