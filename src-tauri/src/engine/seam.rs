use crate::types::pattern::PatternPieceData;

/// Compute seam allowance by offsetting the piece outline.
/// This is a placeholder — proper polygon offsetting is nontrivial
/// and will use Clipper or a custom implementation.
pub fn compute_seam_allowance(
    _piece: &PatternPieceData,
    _allowance_mm: f64,
) -> Result<PatternPieceData, String> {
    Err("Seam allowance computation not yet implemented".to_string())
}
