use std::collections::HashMap;
use std::sync::Mutex;

use uuid::Uuid;

use crate::types::pattern::{PatternPieceData, PatternPieceId, PieceMetadata, Point2D};

use super::history;

/// In-memory store for pattern pieces.
static PIECES: std::sync::LazyLock<Mutex<HashMap<PatternPieceId, PatternPieceData>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

/// Take a snapshot of the current store (for undo/redo).
pub fn snapshot() -> HashMap<PatternPieceId, PatternPieceData> {
    let store = PIECES.lock().unwrap();
    store.clone()
}

/// Restore the store from a snapshot.
pub fn restore(snap: HashMap<PatternPieceId, PatternPieceData>) {
    let mut store = PIECES.lock().unwrap();
    *store = snap;
}

/// Replace all pieces in the store (used by project load).
pub fn replace_all(pieces: Vec<PatternPieceData>) {
    let mut store = PIECES.lock().unwrap();
    store.clear();
    for piece in pieces {
        store.insert(piece.id.clone(), piece);
    }
}

pub fn create(mut piece: PatternPieceData) -> Result<PatternPieceId, String> {
    let id = Uuid::new_v4().to_string();
    piece.id = id.clone();

    history::push_snapshot(snapshot());

    let mut store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    store.insert(id.clone(), piece);
    Ok(id)
}

pub fn update(id: PatternPieceId, piece: PatternPieceData) -> Result<(), String> {
    history::push_snapshot(snapshot());

    let mut store = PIECES.lock().map_err(|e| format!("Lock error: {e}"))?;
    if !store.contains_key(&id) {
        return Err(format!("Piece not found: {id}"));
    }
    store.insert(id, piece);
    Ok(())
}

pub fn delete(id: &PatternPieceId) -> Result<(), String> {
    history::push_snapshot(snapshot());

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
#[allow(dead_code)]
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
