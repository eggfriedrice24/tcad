import type { Vector3 } from "three";
import type { PatternPieceData } from "@/types/pattern";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";

import { usePatternPieces } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelection } from "@/hooks/use-selection";

import { PieceMesh } from "./piece-mesh";
import { Scene } from "./scene";

function computeCenter(pieces: PatternPieceData[]): [number, number] {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const piece of pieces) {
    const pts = [piece.origin, ...piece.outline.map((seg) => {
      if ("end" in seg)
        return seg.end;
      return { x: seg.center.x, y: seg.center.y };
    })];
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function CameraFramer({ pieces }: { pieces: PatternPieceData[] }) {
  const camera = useThree(s => s.camera);
  const controlsRef = useThree(s => s.controls);
  const framedRef = useRef(false);

  const [cx, cy] = useMemo(() => computeCenter(pieces), [pieces]);

  useEffect(() => {
    if (framedRef.current)
      return;
    framedRef.current = true;

    // Compute a rough bounding size to set distance
    let maxSpan = 0;
    for (const piece of pieces) {
      const pts = [piece.origin, ...piece.outline.map((seg) => {
        if ("end" in seg)
          return seg.end;
        return { x: seg.center.x, y: seg.center.y };
      })];
      for (const p of pts) {
        const dx = Math.abs(p.x - cx);
        const dy = Math.abs(p.y - cy);
        maxSpan = Math.max(maxSpan, dx, dy);
      }
    }

    const distance = Math.max(maxSpan * 2.5, 50);
    camera.position.set(cx, cy, distance);
    camera.lookAt(cx, cy, 0);

    if (controlsRef && "target" in controlsRef) {
      (controlsRef.target as Vector3).set(cx, cy, 0);
      (controlsRef as { update: () => void }).update();
    }
  }, [cx, cy, camera, controlsRef, pieces]);

  return null;
}

export function Viewport3D() {
  const { data: pieces, isLoading } = usePatternPieces();
  const { clear } = useSelection();

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!pieces || pieces.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No pieces — draw in 2D to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="size-full">
      <Canvas
        camera={{ position: [0, 0, 500], fov: 50 }}
        onPointerMissed={() => clear()}
      >
        <Scene />
        <CameraFramer pieces={pieces} />
        {pieces.map(p => (
          <PieceMesh key={p.id} pieceId={p.id} />
        ))}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
