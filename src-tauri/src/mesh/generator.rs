use crate::geometry::tessellation;
use crate::types::mesh::MeshData;
use crate::types::pattern::PatternPieceData;

/// Generate a flat 3D mesh from 2D pattern pieces.
/// Each piece is tessellated into triangles lying on the XY plane (z=0).
pub fn generate_mesh(pieces: &[PatternPieceData]) -> Result<MeshData, String> {
    let mut all_positions: Vec<f32> = Vec::new();
    let mut all_normals: Vec<f32> = Vec::new();
    let mut all_indices: Vec<u32> = Vec::new();
    let mut all_uvs: Vec<f32> = Vec::new();

    let mut vertex_offset: u32 = 0;

    for piece in pieces {
        if piece.outline.is_empty() {
            continue;
        }

        let (positions, indices) = tessellation::tessellate_outline(&piece.origin, &piece.outline)?;

        let vertex_count = positions.len() / 3;

        // All normals point up (0, 0, 1) for flat pattern pieces
        for _ in 0..vertex_count {
            all_normals.extend_from_slice(&[0.0, 0.0, 1.0]);
        }

        // Simple UV mapping: normalize positions to 0..1 range
        // TODO: proper UV unwrapping
        for i in 0..vertex_count {
            all_uvs.push(positions[i * 3]);
            all_uvs.push(positions[i * 3 + 1]);
        }

        // Offset indices for this piece
        for idx in &indices {
            all_indices.push(idx + vertex_offset);
        }

        all_positions.extend_from_slice(&positions);
        vertex_offset += vertex_count as u32;
    }

    Ok(MeshData {
        positions: all_positions,
        normals: all_normals,
        indices: all_indices,
        uvs: all_uvs,
    })
}
