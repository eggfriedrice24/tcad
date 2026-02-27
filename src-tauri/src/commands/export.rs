#[tauri::command]
pub fn export_svg(_piece_ids: Vec<String>) -> Result<String, String> {
    Err("SVG export not yet implemented".to_string())
}

#[tauri::command]
pub fn export_dxf(_piece_ids: Vec<String>, _path: String) -> Result<(), String> {
    Err("DXF export not yet implemented".to_string())
}
