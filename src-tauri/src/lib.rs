mod commands;
mod engine;
mod geometry;
mod mesh;
pub mod types;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Pattern CRUD
            commands::pattern::create_pattern_piece,
            commands::pattern::update_pattern_piece,
            commands::pattern::delete_pattern_piece,
            commands::pattern::get_all_pieces,
            commands::pattern::get_piece,
            // Geometry operations
            commands::geometry::compute_seam_allowance,
            commands::geometry::validate_piece_geometry,
            commands::geometry::compute_piece_area,
            // 3D mesh generation
            commands::mesh::generate_3d_mesh,
            // Export
            commands::export::export_svg,
            commands::export::export_dxf,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
