use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};

use crate::types::pattern::PatternPieceData;

use super::{history, pattern_piece};

#[derive(Serialize, Deserialize)]
pub struct ProjectFile {
    pub version: u32,
    pub app_version: String,
    pub pieces: Vec<PatternPieceData>,
}

pub fn save_project(path: &str) -> Result<(), String> {
    let pieces = pattern_piece::get_all()?;
    let project = ProjectFile {
        version: 1,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        pieces,
    };
    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

pub fn load_project(path: &str) -> Result<Vec<PatternPieceData>, String> {
    let data = fs::read_to_string(path).map_err(|e| format!("Read error: {e}"))?;
    let project: ProjectFile =
        serde_json::from_str(&data).map_err(|e| format!("Parse error: {e}"))?;
    if project.version != 1 {
        return Err(format!("Unsupported project version: {}", project.version));
    }
    let pieces = project.pieces.clone();
    pattern_piece::replace_all(project.pieces);
    history::clear();
    Ok(pieces)
}

pub fn new_project() {
    pattern_piece::replace_all(vec![]);
    history::clear();
}

pub fn save_recovery(app_data_dir: &Path) -> Result<(), String> {
    let pieces = pattern_piece::get_all()?;
    if pieces.is_empty() {
        return Ok(());
    }
    fs::create_dir_all(app_data_dir).map_err(|e| format!("Dir error: {e}"))?;
    let path = app_data_dir.join("recovery.tcad");
    let project = ProjectFile {
        version: 1,
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        pieces,
    };
    let json = serde_json::to_string_pretty(&project)
        .map_err(|e| format!("Serialize error: {e}"))?;
    fs::write(path, json).map_err(|e| format!("Write error: {e}"))?;
    Ok(())
}

pub fn check_recovery(app_data_dir: &Path) -> Result<Option<Vec<PatternPieceData>>, String> {
    let path = app_data_dir.join("recovery.tcad");
    if !path.exists() {
        return Ok(None);
    }
    let data = fs::read_to_string(&path).map_err(|e| format!("Read error: {e}"))?;
    let project: ProjectFile = match serde_json::from_str(&data) {
        Ok(p) => p,
        Err(_) => {
            // Invalid recovery file, clean up
            let _ = fs::remove_file(&path);
            return Ok(None);
        }
    };
    if project.pieces.is_empty() {
        let _ = fs::remove_file(&path);
        return Ok(None);
    }
    Ok(Some(project.pieces))
}

pub fn clear_recovery(app_data_dir: &Path) -> Result<(), String> {
    let path = app_data_dir.join("recovery.tcad");
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("Delete error: {e}"))?;
    }
    Ok(())
}
