use serde::{Deserialize, Serialize};

pub type PatternPieceId = String;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point2D {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum CurveSegment {
    Line {
        end: Point2D,
    },
    QuadraticBezier {
        control: Point2D,
        end: Point2D,
    },
    CubicBezier {
        control1: Point2D,
        control2: Point2D,
        end: Point2D,
    },
    Arc {
        center: Point2D,
        radius: f64,
        start_angle: f64,
        end_angle: f64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PieceMetadata {
    pub fabric_type: Option<String>,
    pub cut_quantity: u32,
    pub mirror: bool,
    pub notes: String,
}

impl Default for PieceMetadata {
    fn default() -> Self {
        Self {
            fabric_type: None,
            cut_quantity: 1,
            mirror: false,
            notes: String::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternPieceData {
    pub id: PatternPieceId,
    pub name: String,
    pub origin: Point2D,
    pub outline: Vec<CurveSegment>,
    pub grain_line: Option<(Point2D, Point2D)>,
    pub seam_allowance_mm: f64,
    pub notches: Vec<Point2D>,
    pub internal_lines: Vec<Vec<CurveSegment>>,
    pub metadata: PieceMetadata,
}
