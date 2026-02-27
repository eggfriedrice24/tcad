use std::collections::HashMap;
use std::sync::Mutex;

use uuid::Uuid;

use crate::types::pattern::{PatternPieceData, PatternPieceId, PieceMetadata, Point2D};

/// In-memory store for pattern pieces.
/// Will be replaced with proper persistence (SQLite) later.
static PIECES: std::sync::LazyLock<Mutex<HashMap<PatternPieceId, PatternPieceData>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

pub fn create(mut piece: PatternPieceData) -> Result<PatternPieceId, String> {
    let id = Uuid::new_v4().to_string();
    piece.id = id.clone();

    let mut store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    store.insert(id.clone(), piece);
    Ok(id)
}

pub fn update(id: PatternPieceId, piece: PatternPieceData) -> Result<(), String> {
    let mut store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    if !store.contains_key(&id) {
        return Err(format!("Piece not found: {id}"));
    }
    store.insert(id, piece);
    Ok(())
}

pub fn delete(id: &PatternPieceId) -> Result<(), String> {
    let mut store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    store
        .remove(id)
        .ok_or_else(|| format!("Piece not found: {id}"))?;
    Ok(())
}

pub fn get(id: &PatternPieceId) -> Result<PatternPieceData, String> {
    let store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    store
        .get(id)
        .cloned()
        .ok_or_else(|| format!("Piece not found: {id}"))
}

pub fn get_all() -> Result<Vec<PatternPieceData>, String> {
    let store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    Ok(store.values().cloned().collect())
}

/// Create a default empty pattern piece with a given name.
pub fn create_default(name: &str) -> PatternPieceData {
    PatternPieceData {
        id: String::new(),
        name: name.to_string(),
        origin: Point2D { x: 0.0, y: 0.0 },
        outline: Vec::new(),
        grain_line: None,
        seam_allowance_mm: 10.0,
        notches: Vec::new(),
        internal_lines: Vec::new(),
        metadata: PieceMetadata::default(),
    }
}
