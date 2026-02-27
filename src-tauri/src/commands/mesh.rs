use crate::engine;
use crate::mesh::generator;
use crate::types::mesh::MeshData;

#[tauri::command]
pub fn generate_3d_mesh(piece_ids: Vec<String>) -> Result<MeshData, String> {
    let mut pieces = Vec::new();
    for id in &piece_ids {
        pieces.push(engine::pattern_piece::get(id)?);
    }
    generator::generate_mesh(&pieces)
}
