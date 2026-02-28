use crate::engine::export::{self, PaperSize};
use crate::engine::pattern_piece;

fn get_pieces_by_ids(
    piece_ids: &[String],
) -> Result<Vec<crate::types::pattern::PatternPieceData>, String> {
    if piece_ids.is_empty() {
        return pattern_piece::get_all();
    }
    piece_ids.iter().map(pattern_piece::get).collect()
}

#[tauri::command]
pub fn export_svg(piece_ids: Vec<String>) -> Result<String, String> {
    let pieces = get_pieces_by_ids(&piece_ids)?;
    Ok(export::pieces_to_svg(&pieces))
}

#[tauri::command]
pub fn export_svg_to_file(piece_ids: Vec<String>, path: String) -> Result<(), String> {
    let pieces = get_pieces_by_ids(&piece_ids)?;
    export::save_svg(&pieces, &path)
}

#[tauri::command]
pub fn export_dxf(piece_ids: Vec<String>, path: String) -> Result<(), String> {
    let pieces = get_pieces_by_ids(&piece_ids)?;
    export::save_dxf(&pieces, &path)
}

#[tauri::command]
pub fn export_pdf(piece_ids: Vec<String>, path: String, paper_size: String) -> Result<(), String> {
    let pieces = get_pieces_by_ids(&piece_ids)?;
    let paper = match paper_size.as_str() {
        "letter" => PaperSize::Letter,
        _ => PaperSize::A4,
    };
    export::pieces_to_pdf(&pieces, &path, paper)
}
