import type { ThreeEvent } from "@react-three/fiber";
import type { PatternPieceId } from "@/types/pattern";

import { useMemo } from "react";

import { useSelection } from "@/hooks/use-selection";

import { useMeshQuery } from "../hooks/use-mesh-query";
import { buildGeometry } from "../lib/build-geometry";
import { defaultMaterial, hoveredMaterial, selectedMaterial } from "../lib/materials";

export function PieceMesh({ pieceId }: { pieceId: PatternPieceId }) {
  const { data: meshData } = useMeshQuery(pieceId);
  const { selectedIds, hoveredId, select, toggle, setHovered } = useSelection();

  const geometry = useMemo(() => {
    if (!meshData)
      return null;
    return buildGeometry(meshData);
  }, [meshData]);

  if (!geometry)
    return null;

  const isSelected = selectedIds.has(pieceId);
  const isHovered = hoveredId === pieceId;

  const material = isSelected
    ? selectedMaterial
    : isHovered
      ? hoveredMaterial
      : defaultMaterial;

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (e.nativeEvent.shiftKey) {
      toggle(pieceId);
    }
    else {
      select(pieceId);
    }
  }

  return (
    <mesh
      geometry={geometry}
      material={material}
      onClick={handleClick}
      onPointerEnter={() => setHovered(pieceId)}
      onPointerLeave={() => setHovered(null)}
    />
  );
}
