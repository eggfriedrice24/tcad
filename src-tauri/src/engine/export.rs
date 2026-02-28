use std::fmt::Write;
use std::fs;

use crate::geometry::bbox::BBox2D;
use crate::geometry::vec2::Vec2;
use crate::types::pattern::{CurveSegment, PatternPieceData, Point2D};

const SVG_MARGIN: f64 = 10.0;

// --- SVG Export ---

pub fn pieces_to_svg(pieces: &[PatternPieceData]) -> String {
    if pieces.is_empty() {
        return r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>"#.to_string();
    }

    let bbox = compute_pieces_bbox(pieces).expand_by(SVG_MARGIN);
    let w = bbox.width();
    let h = bbox.height();

    let mut svg = String::new();
    writeln!(
        svg,
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="{} {} {} {}" width="{w}mm" height="{h}mm">"#,
        bbox.min.x, bbox.min.y, w, h
    )
    .unwrap();

    for piece in pieces {
        writeln!(svg, r#"  <g id="{}">"#, piece.id).unwrap();

        // Main outline
        if !piece.outline.is_empty() {
            let path = outline_to_svg_path(&piece.origin, &piece.outline);
            writeln!(
                svg,
                r#"    <path d="{path}" fill="none" stroke="black" stroke-width="0.5"/>"#
            )
            .unwrap();
        }

        // Internal lines
        for line in &piece.internal_lines {
            if !line.is_empty() {
                let path = outline_to_svg_path(&piece.origin, line);
                writeln!(
                    svg,
                    r#"    <path d="{path}" fill="none" stroke="black" stroke-width="0.3" stroke-dasharray="2,2"/>"#
                )
                .unwrap();
            }
        }

        // Grain line
        if let Some((start, end)) = &piece.grain_line {
            let sx = piece.origin.x + start.x;
            let sy = piece.origin.y + start.y;
            let ex = piece.origin.x + end.x;
            let ey = piece.origin.y + end.y;
            writeln!(
                svg,
                r#"    <line x1="{sx}" y1="{sy}" x2="{ex}" y2="{ey}" stroke="gray" stroke-width="0.3" marker-end="url(#arrow)"/>"#
            )
            .unwrap();
        }

        // Notches
        for notch in &piece.notches {
            let nx = piece.origin.x + notch.x;
            let ny = piece.origin.y + notch.y;
            writeln!(
                svg,
                r#"    <line x1="{}" y1="{}" x2="{}" y2="{}" stroke="black" stroke-width="0.5"/>"#,
                nx, ny - 3.0, nx, ny + 3.0
            )
            .unwrap();
        }

        // Label
        writeln!(
            svg,
            r#"    <text x="{}" y="{}" font-size="4" text-anchor="middle" fill="gray">{}</text>"#,
            piece.origin.x,
            piece.origin.y,
            piece.name
        )
        .unwrap();

        writeln!(svg, "  </g>").unwrap();
    }

    writeln!(svg, "</svg>").unwrap();
    svg
}

pub fn save_svg(pieces: &[PatternPieceData], path: &str) -> Result<(), String> {
    let svg = pieces_to_svg(pieces);
    fs::write(path, svg).map_err(|e| format!("Write error: {e}"))
}

fn outline_to_svg_path(origin: &Point2D, segments: &[CurveSegment]) -> String {
    let mut d = String::new();
    // Start at origin (outlines are relative to piece origin)
    write!(d, "M {},{}", origin.x, origin.y).unwrap();

    for seg in segments {
        match seg {
            CurveSegment::Line { end } => {
                write!(d, " L {},{}", origin.x + end.x, origin.y + end.y).unwrap();
            }
            CurveSegment::QuadraticBezier { control, end } => {
                write!(
                    d,
                    " Q {},{} {},{}",
                    origin.x + control.x,
                    origin.y + control.y,
                    origin.x + end.x,
                    origin.y + end.y
                )
                .unwrap();
            }
            CurveSegment::CubicBezier {
                control1,
                control2,
                end,
            } => {
                write!(
                    d,
                    " C {},{} {},{} {},{}",
                    origin.x + control1.x,
                    origin.y + control1.y,
                    origin.x + control2.x,
                    origin.y + control2.y,
                    origin.x + end.x,
                    origin.y + end.y
                )
                .unwrap();
            }
            CurveSegment::Arc {
                center,
                radius,
                start_angle,
                end_angle,
            } => {
                // Approximate arc with line segments
                arc_to_svg_lines(
                    &mut d,
                    origin.x + center.x,
                    origin.y + center.y,
                    *radius,
                    *start_angle,
                    *end_angle,
                );
            }
        }
    }

    d.push_str(" Z");
    d
}

fn arc_to_svg_lines(d: &mut String, cx: f64, cy: f64, r: f64, start: f64, end: f64) {
    let steps = ((end - start).abs() / 0.1).ceil().max(4.0) as usize;
    for i in 0..=steps {
        let t = start + (end - start) * (i as f64 / steps as f64);
        let x = cx + r * t.cos();
        let y = cy + r * t.sin();
        write!(d, " L {x},{y}").unwrap();
    }
}

// --- DXF Export ---

pub fn pieces_to_dxf(pieces: &[PatternPieceData]) -> String {
    let mut dxf = String::new();

    // Header
    dxf.push_str("0\nSECTION\n2\nENTITIES\n");

    for piece in pieces {
        let layer = &piece.name;
        let ox = piece.origin.x;
        // DXF is Y-up, our canvas is Y-down
        let oy = -piece.origin.y;

        if piece.outline.is_empty() {
            continue;
        }

        // Track current position for line segments
        let mut cx = ox;
        let mut cy = oy;

        for seg in &piece.outline {
            match seg {
                CurveSegment::Line { end } => {
                    let ex = ox + end.x;
                    let ey = -(piece.origin.y + end.y);
                    write_dxf_line(&mut dxf, layer, cx, cy, ex, ey);
                    cx = ex;
                    cy = ey;
                }
                CurveSegment::QuadraticBezier { control, end } => {
                    // Sample quadratic bezier to polyline
                    let pts = sample_quadratic(
                        cx,
                        cy,
                        ox + control.x,
                        -(piece.origin.y + control.y),
                        ox + end.x,
                        -(piece.origin.y + end.y),
                    );
                    for pair in pts.windows(2) {
                        write_dxf_line(&mut dxf, layer, pair[0].0, pair[0].1, pair[1].0, pair[1].1);
                    }
                    if let Some(last) = pts.last() {
                        cx = last.0;
                        cy = last.1;
                    }
                }
                CurveSegment::CubicBezier {
                    control1,
                    control2,
                    end,
                } => {
                    let pts = sample_cubic(
                        cx,
                        cy,
                        ox + control1.x,
                        -(piece.origin.y + control1.y),
                        ox + control2.x,
                        -(piece.origin.y + control2.y),
                        ox + end.x,
                        -(piece.origin.y + end.y),
                    );
                    for pair in pts.windows(2) {
                        write_dxf_line(&mut dxf, layer, pair[0].0, pair[0].1, pair[1].0, pair[1].1);
                    }
                    if let Some(last) = pts.last() {
                        cx = last.0;
                        cy = last.1;
                    }
                }
                CurveSegment::Arc {
                    center,
                    radius,
                    start_angle,
                    end_angle,
                } => {
                    // DXF ARC entity
                    let acx = ox + center.x;
                    let acy = -(piece.origin.y + center.y);
                    // DXF angles are in degrees, counter-clockwise
                    // Our angles may be in radians — convert
                    let sa = start_angle.to_degrees();
                    let ea = end_angle.to_degrees();
                    // Due to Y-flip, angles are mirrored
                    write_dxf_arc(&mut dxf, layer, acx, acy, *radius, -ea, -sa);
                    // Update current pos
                    let end_rad = *end_angle;
                    cx = acx + radius * end_rad.cos();
                    cy = acy - radius * end_rad.sin(); // Y-flipped
                }
            }
        }

        // Close: line from last point back to origin
        if (cx - ox).abs() > 0.001 || (cy - oy).abs() > 0.001 {
            write_dxf_line(&mut dxf, layer, cx, cy, ox, oy);
        }
    }

    dxf.push_str("0\nENDSEC\n0\nEOF\n");
    dxf
}

pub fn save_dxf(pieces: &[PatternPieceData], path: &str) -> Result<(), String> {
    let dxf = pieces_to_dxf(pieces);
    fs::write(path, dxf).map_err(|e| format!("Write error: {e}"))
}

fn write_dxf_line(dxf: &mut String, layer: &str, x1: f64, y1: f64, x2: f64, y2: f64) {
    write!(
        dxf,
        "0\nLINE\n8\n{layer}\n10\n{x1}\n20\n{y1}\n30\n0.0\n11\n{x2}\n21\n{y2}\n31\n0.0\n"
    )
    .unwrap();
}

fn write_dxf_arc(
    dxf: &mut String,
    layer: &str,
    cx: f64,
    cy: f64,
    radius: f64,
    start_deg: f64,
    end_deg: f64,
) {
    write!(
        dxf,
        "0\nARC\n8\n{layer}\n10\n{cx}\n20\n{cy}\n30\n0.0\n40\n{radius}\n50\n{start_deg}\n51\n{end_deg}\n"
    )
    .unwrap();
}

fn sample_quadratic(
    x0: f64,
    y0: f64,
    cx: f64,
    cy: f64,
    x1: f64,
    y1: f64,
) -> Vec<(f64, f64)> {
    let steps = 16;
    (0..=steps)
        .map(|i| {
            let t = i as f64 / steps as f64;
            let mt = 1.0 - t;
            let x = mt * mt * x0 + 2.0 * mt * t * cx + t * t * x1;
            let y = mt * mt * y0 + 2.0 * mt * t * cy + t * t * y1;
            (x, y)
        })
        .collect()
}

#[allow(clippy::too_many_arguments)]
fn sample_cubic(
    x0: f64,
    y0: f64,
    c1x: f64,
    c1y: f64,
    c2x: f64,
    c2y: f64,
    x1: f64,
    y1: f64,
) -> Vec<(f64, f64)> {
    let steps = 24;
    (0..=steps)
        .map(|i| {
            let t = i as f64 / steps as f64;
            let mt = 1.0 - t;
            let x = mt * mt * mt * x0
                + 3.0 * mt * mt * t * c1x
                + 3.0 * mt * t * t * c2x
                + t * t * t * x1;
            let y = mt * mt * mt * y0
                + 3.0 * mt * mt * t * c1y
                + 3.0 * mt * t * t * c2y
                + t * t * t * y1;
            (x, y)
        })
        .collect()
}

// --- PDF Export ---

#[derive(Debug, Clone, Copy)]
pub enum PaperSize {
    A4,
    Letter,
}

impl PaperSize {
    fn dimensions_mm(&self) -> (f64, f64) {
        match self {
            PaperSize::A4 => (210.0, 297.0),
            PaperSize::Letter => (216.0, 279.0),
        }
    }
}

/// Flatten an outline (origin-relative segments) into a polyline of absolute world coords.
fn outline_to_polyline(origin: &Point2D, segments: &[CurveSegment]) -> Vec<(f64, f64)> {
    let mut pts = vec![(origin.x, origin.y)];
    let mut cx = origin.x;
    let mut cy = origin.y;

    for seg in segments {
        match seg {
            CurveSegment::Line { end } => {
                let ex = origin.x + end.x;
                let ey = origin.y + end.y;
                pts.push((ex, ey));
                cx = ex;
                cy = ey;
            }
            CurveSegment::QuadraticBezier { control, end } => {
                let qpts = sample_quadratic(
                    cx, cy,
                    origin.x + control.x, origin.y + control.y,
                    origin.x + end.x, origin.y + end.y,
                );
                // Skip first (duplicate of current pos)
                pts.extend_from_slice(&qpts[1..]);
                if let Some(&last) = qpts.last() {
                    cx = last.0;
                    cy = last.1;
                }
            }
            CurveSegment::CubicBezier { control1, control2, end } => {
                let cpts = sample_cubic(
                    cx, cy,
                    origin.x + control1.x, origin.y + control1.y,
                    origin.x + control2.x, origin.y + control2.y,
                    origin.x + end.x, origin.y + end.y,
                );
                pts.extend_from_slice(&cpts[1..]);
                if let Some(&last) = cpts.last() {
                    cx = last.0;
                    cy = last.1;
                }
            }
            CurveSegment::Arc { center, radius, start_angle, end_angle } => {
                let steps = ((end_angle - start_angle).abs() / 0.1).ceil().max(4.0) as usize;
                for i in 1..=steps {
                    let t = start_angle + (end_angle - start_angle) * (i as f64 / steps as f64);
                    let ax = origin.x + center.x + radius * t.cos();
                    let ay = origin.y + center.y + radius * t.sin();
                    pts.push((ax, ay));
                }
                if let Some(&last) = pts.last() {
                    cx = last.0;
                    cy = last.1;
                }
            }
        }
    }

    pts
}

pub fn pieces_to_pdf(pieces: &[PatternPieceData], path: &str, paper: PaperSize) -> Result<(), String> {
    use printpdf::*;
    use std::io::BufWriter;

    fn mm(v: f64) -> Mm { Mm(v as f32) }
    fn pt(x: f64, y: f64) -> Point { Point::new(mm(x), mm(y)) }

    let (page_w, page_h) = paper.dimensions_mm();
    let margin = 10.0_f64;
    let print_w = page_w - 2.0 * margin;
    let print_h = page_h - 2.0 * margin;

    if pieces.is_empty() {
        let (doc, _, _) = PdfDocument::new("TCAD Export", mm(page_w), mm(page_h), "Layer 1");
        let file = fs::File::create(path).map_err(|e| format!("File error: {e}"))?;
        doc.save(&mut BufWriter::new(file)).map_err(|e| format!("PDF save error: {e}"))?;
        return Ok(());
    }

    // Pre-flatten all piece outlines to polylines
    let polylines: Vec<Vec<(f64, f64)>> = pieces
        .iter()
        .filter(|p| !p.outline.is_empty())
        .map(|p| outline_to_polyline(&p.origin, &p.outline))
        .collect();

    let bbox = compute_pieces_bbox(pieces).expand_by(5.0);
    let pattern_w = bbox.width();
    let pattern_h = bbox.height();

    let cols = (pattern_w / print_w).ceil().max(1.0) as usize;
    let rows = (pattern_h / print_h).ceil().max(1.0) as usize;

    let (doc, first_page, first_layer) = PdfDocument::new("TCAD Export", mm(page_w), mm(page_h), "Layer 1");
    let font = doc.add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| format!("Font error: {e}"))?;

    for row in 0..rows {
        for col in 0..cols {
            let tile_idx = row * cols + col;

            let layer = if tile_idx == 0 {
                doc.get_page(first_page).get_layer(first_layer)
            } else {
                let (page_idx, layer_idx) = doc.add_page(mm(page_w), mm(page_h), "Layer 1");
                doc.get_page(page_idx).get_layer(layer_idx)
            };

            let tile_x = bbox.min.x + col as f64 * print_w;
            let tile_y = bbox.min.y + row as f64 * print_h;

            // Alignment crosshairs
            layer.set_outline_thickness(0.3);
            layer.set_outline_color(Color::Rgb(Rgb::new(0.5, 0.5, 0.5, None)));
            let cs = 5.0_f64;
            for &(cx, cy) in &[
                (margin, margin),
                (margin, page_h - margin),
                (page_w - margin, margin),
                (page_w - margin, page_h - margin),
            ] {
                layer.add_line(Line::from_iter(vec![
                    (pt(cx - cs, cy), false),
                    (pt(cx + cs, cy), false),
                ]));
                layer.add_line(Line::from_iter(vec![
                    (pt(cx, cy - cs), false),
                    (pt(cx, cy + cs), false),
                ]));
            }

            // Grid label
            let label = format!("{}{}", (b'A' + row as u8) as char, col + 1);
            layer.use_text(&label, 8.0, mm(margin + 1.0), mm(page_h - margin - 6.0), &font);

            // Draw outlines
            layer.set_outline_thickness(0.5);
            layer.set_outline_color(Color::Rgb(Rgb::new(0.0, 0.0, 0.0, None)));

            for polyline in &polylines {
                let pdf_pts: Vec<(Point, bool)> = polyline
                    .iter()
                    .map(|&(wx, wy)| {
                        let px = margin + (wx - tile_x);
                        let py = page_h - margin - (wy - tile_y);
                        (pt(px, py), false)
                    })
                    .collect();

                if pdf_pts.len() >= 2 {
                    layer.add_line(Line::from_iter(pdf_pts));
                }
            }
        }
    }

    let file = fs::File::create(path).map_err(|e| format!("File error: {e}"))?;
    doc.save(&mut BufWriter::new(file)).map_err(|e| format!("PDF save error: {e}"))?;
    Ok(())
}

// --- Shared helpers ---

fn compute_pieces_bbox(pieces: &[PatternPieceData]) -> BBox2D {
    let mut bbox = BBox2D::empty();
    for piece in pieces {
        bbox.expand_point(&Vec2::new(piece.origin.x, piece.origin.y));
        for seg in &piece.outline {
            expand_bbox_for_segment(&mut bbox, &piece.origin, seg);
        }
        for line in &piece.internal_lines {
            for seg in line {
                expand_bbox_for_segment(&mut bbox, &piece.origin, seg);
            }
        }
        if let Some((s, e)) = &piece.grain_line {
            bbox.expand_point(&Vec2::new(piece.origin.x + s.x, piece.origin.y + s.y));
            bbox.expand_point(&Vec2::new(piece.origin.x + e.x, piece.origin.y + e.y));
        }
    }
    bbox
}

fn expand_bbox_for_segment(bbox: &mut BBox2D, origin: &Point2D, seg: &CurveSegment) {
    match seg {
        CurveSegment::Line { end } => {
            bbox.expand_point(&Vec2::new(origin.x + end.x, origin.y + end.y));
        }
        CurveSegment::QuadraticBezier { control, end } => {
            bbox.expand_point(&Vec2::new(origin.x + control.x, origin.y + control.y));
            bbox.expand_point(&Vec2::new(origin.x + end.x, origin.y + end.y));
        }
        CurveSegment::CubicBezier {
            control1,
            control2,
            end,
        } => {
            bbox.expand_point(&Vec2::new(origin.x + control1.x, origin.y + control1.y));
            bbox.expand_point(&Vec2::new(origin.x + control2.x, origin.y + control2.y));
            bbox.expand_point(&Vec2::new(origin.x + end.x, origin.y + end.y));
        }
        CurveSegment::Arc {
            center, radius, ..
        } => {
            // Conservative bbox for arc
            bbox.expand_point(&Vec2::new(
                origin.x + center.x - radius,
                origin.y + center.y - radius,
            ));
            bbox.expand_point(&Vec2::new(
                origin.x + center.x + radius,
                origin.y + center.y + radius,
            ));
        }
    }
}
