use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};

use crate::types::pattern::{PatternPieceData, PatternPieceId};

const MAX_UNDO: usize = 100;

type Snapshot = HashMap<PatternPieceId, PatternPieceData>;

static HISTORY: LazyLock<Mutex<History>> = LazyLock::new(|| Mutex::new(History::new()));

struct History {
    undo_stack: Vec<Snapshot>,
    redo_stack: Vec<Snapshot>,
}

impl History {
    fn new() -> Self {
        Self {
            undo_stack: Vec::new(),
            redo_stack: Vec::new(),
        }
    }
}

pub fn push_snapshot(snapshot: Snapshot) {
    let mut h = HISTORY.lock().unwrap();
    if h.undo_stack.len() >= MAX_UNDO {
        h.undo_stack.remove(0);
    }
    h.undo_stack.push(snapshot);
    h.redo_stack.clear();
}

/// Push to undo stack without clearing redo (used during redo operations).
pub fn push_undo_only(snapshot: Snapshot) {
    let mut h = HISTORY.lock().unwrap();
    if h.undo_stack.len() >= MAX_UNDO {
        h.undo_stack.remove(0);
    }
    h.undo_stack.push(snapshot);
}

pub fn pop_undo() -> Option<Snapshot> {
    let mut h = HISTORY.lock().unwrap();
    h.undo_stack.pop()
}

pub fn push_redo(snapshot: Snapshot) {
    let mut h = HISTORY.lock().unwrap();
    h.redo_stack.push(snapshot);
}

pub fn pop_redo() -> Option<Snapshot> {
    let mut h = HISTORY.lock().unwrap();
    h.redo_stack.pop()
}

pub fn clear() {
    let mut h = HISTORY.lock().unwrap();
    h.undo_stack.clear();
    h.redo_stack.clear();
}

pub fn can_undo() -> bool {
    let h = HISTORY.lock().unwrap();
    !h.undo_stack.is_empty()
}

pub fn can_redo() -> bool {
    let h = HISTORY.lock().unwrap();
    !h.redo_stack.is_empty()
}
