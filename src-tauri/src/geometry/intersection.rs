use super::vec2::Vec2;

/// Line-line intersection between segment (p1,p2) and segment (p3,p4).
/// Returns the intersection point if the segments intersect.
pub fn segment_segment(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2) -> Option<Vec2> {
    let d1 = p2 - p1;
    let d2 = p4 - p3;
    let cross = d1.cross(&d2);

    if cross.abs() < f64::EPSILON {
        return None; // Parallel
    }

    let d3 = p3 - p1;
    let t = d3.cross(&d2) / cross;
    let u = d3.cross(&d1) / cross;

    if (0.0..=1.0).contains(&t) && (0.0..=1.0).contains(&u) {
        Some(p1 + d1 * t)
    } else {
        None
    }
}

/// Ray-segment intersection. Ray starts at `origin` in `direction`.
/// Returns parameter t along the ray if intersection exists (t >= 0).
pub fn ray_segment(origin: Vec2, direction: Vec2, p1: Vec2, p2: Vec2) -> Option<f64> {
    let d = p2 - p1;
    let cross = direction.cross(&d);

    if cross.abs() < f64::EPSILON {
        return None;
    }

    let d2 = p1 - origin;
    let t = d2.cross(&d) / cross;
    let u = d2.cross(&direction) / cross;

    if t >= 0.0 && (0.0..=1.0).contains(&u) {
        Some(t)
    } else {
        None
    }
}
