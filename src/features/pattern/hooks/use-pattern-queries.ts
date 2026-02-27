import type { PatternPieceData, PatternPieceId } from "@/types/pattern";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createPatternPiece, deletePatternPiece, getAllPieces, getPiece, updatePatternPiece } from "@/lib/invoke";
import { patternKeys } from "@/lib/query-keys";

export function usePatternPieces() {
  return useQuery({
    queryKey: patternKeys.lists(),
    queryFn: getAllPieces,
  });
}

export function usePatternPiece(id: PatternPieceId | undefined) {
  return useQuery({
    queryKey: patternKeys.detail(id!),
    queryFn: () => getPiece(id!),
    enabled: !!id,
  });
}

export function useCreatePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (piece: PatternPieceData) => createPatternPiece(piece),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.lists() });
    },
  });
}

export function useUpdatePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, piece }: { id: PatternPieceId; piece: PatternPieceData }) =>
      updatePatternPiece(id, piece),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: patternKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: patternKeys.lists() });
    },
  });
}

export function useDeletePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: PatternPieceId) => deletePatternPiece(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: patternKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: patternKeys.lists() });
    },
  });
}
