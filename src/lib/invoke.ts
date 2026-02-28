import type { MeshData } from "@/types/mesh";
import type { PatternPieceData, PatternPieceId } from "@/types/pattern";

import { invoke } from "@tauri-apps/api/core";

export function createPatternPiece(piece: PatternPieceData): Promise<PatternPieceId> {
  return invoke("create_pattern_piece", { piece });
}

export function updatePatternPiece(id: PatternPieceId, piece: PatternPieceData): Promise<void> {
  return invoke("update_pattern_piece", { id, piece });
}

export function deletePatternPiece(id: PatternPieceId): Promise<void> {
  return invoke("delete_pattern_piece", { id });
}

export function getAllPieces(): Promise<PatternPieceData[]> {
  return invoke("get_all_pieces");
}

export function getPiece(id: PatternPieceId): Promise<PatternPieceData> {
  return invoke("get_piece", { id });
}

export function computeSeamAllowance(pieceId: PatternPieceId, allowanceMm: number): Promise<PatternPieceData> {
  return invoke("compute_seam_allowance", { pieceId, allowanceMm });
}

export function validatePieceGeometry(pieceId: PatternPieceId): Promise<string[]> {
  return invoke("validate_piece_geometry", { pieceId });
}

export function computePieceArea(pieceId: PatternPieceId): Promise<number> {
  return invoke("compute_piece_area", { pieceId });
}

export function generate3dMesh(pieceIds: PatternPieceId[]): Promise<MeshData> {
  return invoke("generate_3d_mesh", { pieceIds });
}

export function exportSvg(pieceIds: PatternPieceId[]): Promise<string> {
  return invoke("export_svg", { pieceIds });
}

export function exportSvgToFile(pieceIds: PatternPieceId[], path: string): Promise<void> {
  return invoke("export_svg_to_file", { pieceIds, path });
}

export function exportDxf(pieceIds: PatternPieceId[], path: string): Promise<void> {
  return invoke("export_dxf", { pieceIds, path });
}

export function exportPdf(pieceIds: PatternPieceId[], path: string, paperSize: string = "a4"): Promise<void> {
  return invoke("export_pdf", { pieceIds, path, paperSize });
}

// Project
export function saveProject(path: string): Promise<void> {
  return invoke("save_project", { path });
}

export function loadProject(path: string): Promise<PatternPieceData[]> {
  return invoke("load_project", { path });
}

export function newProject(): Promise<void> {
  return invoke("new_project");
}

export function saveRecovery(): Promise<void> {
  return invoke("save_recovery");
}

export function checkRecovery(): Promise<PatternPieceData[] | null> {
  return invoke("check_recovery");
}

export function clearRecovery(): Promise<void> {
  return invoke("clear_recovery");
}

export function restoreRecovery(): Promise<PatternPieceData[]> {
  return invoke("restore_recovery");
}

// History (undo/redo)
export function undo(): Promise<void> {
  return invoke("undo");
}

export function redo(): Promise<void> {
  return invoke("redo");
}

export function canUndoRedo(): Promise<[boolean, boolean]> {
  return invoke("can_undo_redo");
}
