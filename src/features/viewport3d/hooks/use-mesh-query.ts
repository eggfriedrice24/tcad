import type { PatternPieceId } from "@/types/pattern";

import { useQuery } from "@tanstack/react-query";

import { generate3dMesh } from "@/lib/invoke";
import { meshKeys } from "@/lib/query-keys";

export function useMeshQuery(pieceId: PatternPieceId) {
  return useQuery({
    queryKey: meshKeys.generate([pieceId]),
    queryFn: () => generate3dMesh([pieceId]),
  });
}
