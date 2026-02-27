use super::vec2::Vec2;

#[derive(Debug, Clone, Copy)]
pub struct BBox2D {
    pub min: Vec2,
    pub max: Vec2,
}

impl BBox2D {
    pub fn empty() -> Self {
        Self {
            min: Vec2::new(f64::INFINITY, f64::INFINITY),
            max: Vec2::new(f64::NEG_INFINITY, f64::NEG_INFINITY),
        }
    }

    pub fn from_points(points: &[Vec2]) -> Self {
        let mut bbox = Self::empty();
        for p in points {
            bbox.expand_point(p);
        }
        bbox
    }

    pub fn expand_point(&mut self, p: &Vec2) {
        self.min.x = self.min.x.min(p.x);
        self.min.y = self.min.y.min(p.y);
        self.max.x = self.max.x.max(p.x);
        self.max.y = self.max.y.max(p.y);
    }

    pub fn expand_by(&self, margin: f64) -> Self {
        Self {
            min: Vec2::new(self.min.x - margin, self.min.y - margin),
            max: Vec2::new(self.max.x + margin, self.max.y + margin),
        }
    }

    pub fn contains(&self, p: &Vec2) -> bool {
        p.x >= self.min.x && p.x <= self.max.x && p.y >= self.min.y && p.y <= self.max.y
    }

    pub fn width(&self) -> f64 {
        self.max.x - self.min.x
    }

    pub fn height(&self) -> f64 {
        self.max.y - self.min.y
    }

    pub fn center(&self) -> Vec2 {
        Vec2::new(
            (self.min.x + self.max.x) * 0.5,
            (self.min.y + self.max.y) * 0.5,
        )
    }

    pub fn union(&self, other: &Self) -> Self {
        Self {
            min: Vec2::new(self.min.x.min(other.min.x), self.min.y.min(other.min.y)),
            max: Vec2::new(self.max.x.max(other.max.x), self.max.y.max(other.max.y)),
        }
    }

    pub fn intersects(&self, other: &Self) -> bool {
        self.min.x <= other.max.x
            && self.max.x >= other.min.x
            && self.min.y <= other.max.y
            && self.max.y >= other.min.y
    }
}
