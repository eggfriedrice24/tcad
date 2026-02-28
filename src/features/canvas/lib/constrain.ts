import type { Point2D } from "@/types/pattern";

const SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const DEG_TO_RAD = Math.PI / 180;

export function constrainAngle(anchor: Point2D, target: Point2D): Point2D {
  const dx = target.x - anchor.x;
  const dy = target.y - anchor.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.001)
    return { ...target };

  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  // Normalize to 0-360
  const normalized = ((angle % 360) + 360) % 360;

  // Find nearest 45° increment
  let nearest = SNAP_ANGLES[0];
  let minDiff = 360;
  for (const snapAngle of SNAP_ANGLES) {
    let diff = Math.abs(normalized - snapAngle);
    if (diff > 180)
      diff = 360 - diff;
    if (diff < minDiff) {
      minDiff = diff;
      nearest = snapAngle;
    }
  }

  const rad = nearest * DEG_TO_RAD;
  return {
    x: anchor.x + dist * Math.cos(rad),
    y: anchor.y + dist * Math.sin(rad),
  };
}
