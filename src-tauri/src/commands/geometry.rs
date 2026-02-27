use crate::engine;
use crate::types::pattern::{PatternPieceData, PatternPieceId};

#[tauri::command]
pub fn compute_seam_allowance(
    piece_id: PatternPieceId,
    allowance_mm: f64,
) -> Result<PatternPieceData, String> {
    let piece = engine::pattern_piece::get(&piece_id)?;
    engine::seam::compute_seam_allowance(&piece, allowance_mm)
}

#[tauri::command]
pub fn validate_piece_geometry(piece_id: PatternPieceId) -> Result<Vec<String>, String> {
    let piece = engine::pattern_piece::get(&piece_id)?;
    Ok(engine::validation::validate(&piece))
}

#[tauri::command]
pub fn compute_piece_area(piece_id: PatternPieceId) -> Result<f64, String> {
    let piece = engine::pattern_piece::get(&piece_id)?;
    engine::validation::compute_area(&piece)
}
