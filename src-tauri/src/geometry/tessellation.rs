use lyon_path::math::point;
use lyon_path::Path;
use lyon_tessellation::{BuffersBuilder, FillOptions, FillTessellator, FillVertex, VertexBuffers};

use crate::types::pattern::{CurveSegment, Point2D};

/// Tessellate a closed 2D path into triangle mesh data.
/// Returns (positions, indices) where positions are [x, y, z] with z=0.
pub fn tessellate_outline(
    origin: &Point2D,
    segments: &[CurveSegment],
) -> Result<(Vec<f32>, Vec<u32>), String> {
    if segments.is_empty() {
        return Err("Cannot tessellate empty outline".to_string());
    }

    let mut builder = Path::builder();
    builder.begin(point(origin.x as f32, origin.y as f32));

    for seg in segments {
        match seg {
            CurveSegment::Line { end } => {
                builder.line_to(point(end.x as f32, end.y as f32));
            }
            CurveSegment::QuadraticBezier { control, end } => {
                builder.quadratic_bezier_to(
                    point(control.x as f32, control.y as f32),
                    point(end.x as f32, end.y as f32),
                );
            }
            CurveSegment::CubicBezier {
                control1,
                control2,
                end,
            } => {
                builder.cubic_bezier_to(
                    point(control1.x as f32, control1.y as f32),
                    point(control2.x as f32, control2.y as f32),
                    point(end.x as f32, end.y as f32),
                );
            }
            CurveSegment::Arc {
                center,
                radius,
                start_angle,
                end_angle,
            } => {
                // Approximate arc with line segments
                let steps = 32;
                let angle_range = end_angle - start_angle;
                for i in 1..=steps {
                    let t = *start_angle + angle_range * (i as f64 / steps as f64);
                    let x = center.x + radius * t.cos();
                    let y = center.y + radius * t.sin();
                    builder.line_to(point(x as f32, y as f32));
                }
            }
        }
    }

    builder.close();
    let path = builder.build();

    let mut buffers: VertexBuffers<[f32; 3], u32> = VertexBuffers::new();
    let mut tessellator = FillTessellator::new();

    tessellator
        .tessellate_path(
            &path,
            &FillOptions::default(),
            &mut BuffersBuilder::new(&mut buffers, |vertex: FillVertex| {
                let p = vertex.position();
                [p.x, p.y, 0.0]
            }),
        )
        .map_err(|e| format!("Tessellation failed: {e:?}"))?;

    let positions: Vec<f32> = buffers
        .vertices
        .iter()
        .flat_map(|v| v.iter().copied())
        .collect();
    let indices = buffers.indices;

    Ok((positions, indices))
}
