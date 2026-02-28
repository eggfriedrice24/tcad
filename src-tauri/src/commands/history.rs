use crate::engine::{history, pattern_piece};

#[tauri::command]
pub fn undo() -> Result<(), String> {
    let previous = history::pop_undo().ok_or("Nothing to undo")?;
    let current = pattern_piece::snapshot();
    history::push_redo(current);
    pattern_piece::restore(previous);
    Ok(())
}

#[tauri::command]
pub fn redo() -> Result<(), String> {
    let next = history::pop_redo().ok_or("Nothing to redo")?;
    let current = pattern_piece::snapshot();
    history::push_undo_only(current);
    pattern_piece::restore(next);
    Ok(())
}

#[tauri::command]
pub fn can_undo_redo() -> Result<(bool, bool), String> {
    Ok((history::can_undo(), history::can_redo()))
}
