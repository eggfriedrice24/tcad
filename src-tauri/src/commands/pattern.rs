use crate::engine;
use crate::types::pattern::{PatternPieceData, PatternPieceId};

#[tauri::command]
pub fn create_pattern_piece(piece: PatternPieceData) -> Result<PatternPieceId, String> {
    engine::pattern_piece::create(piece)
}

#[tauri::command]
pub fn update_pattern_piece(id: PatternPieceId, piece: PatternPieceData) -> Result<(), String> {
    engine::pattern_piece::update(id, piece)
}

#[tauri::command]
pub fn delete_pattern_piece(id: PatternPieceId) -> Result<(), String> {
    engine::pattern_piece::delete(&id)
}

#[tauri::command]
pub fn get_all_pieces() -> Result<Vec<PatternPieceData>, String> {
    engine::pattern_piece::get_all()
}

#[tauri::command]
pub fn get_piece(id: PatternPieceId) -> Result<PatternPieceData, String> {
    engine::pattern_piece::get(&id)
}
