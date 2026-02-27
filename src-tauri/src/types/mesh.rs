use serde::{Deserialize, Serialize};

/// Flat buffer mesh data suitable for Three.js BufferGeometry.
/// All arrays are flat: positions = [x,y,z, x,y,z, ...], etc.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeshData {
    pub positions: Vec<f32>,
    pub normals: Vec<f32>,
    pub indices: Vec<u32>,
    pub uvs: Vec<f32>,
}
