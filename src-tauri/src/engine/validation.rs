use crate::types::pattern::PatternPieceData;

/// Validate geometry of a pattern piece.
/// Returns a list of warnings/errors (empty = valid).
pub fn validate(piece: &PatternPieceData) -> Vec<String> {
    let mut warnings = Vec::new();

    if piece.outline.is_empty() {
        warnings.push("Piece has no outline segments".to_string());
    }

    if piece.name.is_empty() {
        warnings.push("Piece has no name".to_string());
    }

    if piece.seam_allowance_mm < 0.0 {
        warnings.push("Seam allowance cannot be negative".to_string());
    }

    // TODO: check for self-intersections
    // TODO: check that outline forms a closed path
    // TODO: check for degenerate segments (zero-length)

    warnings
}

/// Compute the area of a pattern piece outline using the shoelace formula.
/// Only considers line segments for now — curves need to be sampled first.
pub fn compute_area(_piece: &PatternPieceData) -> Result<f64, String> {
    Err("Area computation not yet implemented".to_string())
}
