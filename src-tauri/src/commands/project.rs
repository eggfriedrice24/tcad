use tauri::Manager;

use crate::engine::project;
use crate::types::pattern::PatternPieceData;

#[tauri::command]
pub fn save_project(path: String) -> Result<(), String> {
    project::save_project(&path)
}

#[tauri::command]
pub fn load_project(path: String) -> Result<Vec<PatternPieceData>, String> {
    project::load_project(&path)
}

#[tauri::command]
pub fn new_project() -> Result<(), String> {
    project::new_project();
    Ok(())
}

#[tauri::command]
pub fn save_recovery(app_handle: tauri::AppHandle) -> Result<(), String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Path error: {e}"))?;
    project::save_recovery(&dir)
}

#[tauri::command]
pub fn check_recovery(
    app_handle: tauri::AppHandle,
) -> Result<Option<Vec<PatternPieceData>>, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Path error: {e}"))?;
    project::check_recovery(&dir)
}

#[tauri::command]
pub fn clear_recovery(app_handle: tauri::AppHandle) -> Result<(), String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Path error: {e}"))?;
    project::clear_recovery(&dir)
}

#[tauri::command]
pub fn restore_recovery(app_handle: tauri::AppHandle) -> Result<Vec<PatternPieceData>, String> {
    let dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Path error: {e}"))?;
    let pieces = project::check_recovery(&dir)?.ok_or("No recovery data found")?;
    crate::engine::pattern_piece::replace_all(pieces.clone());
    crate::engine::history::clear();
    project::clear_recovery(&dir)?;
    Ok(pieces)
}
