import type { PatternPieceData, PatternPieceId } from "@/types/pattern";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { resetPieceCounter } from "@/features/canvas/lib/piece-factory";
import { canUndoRedo, createPatternPiece, deletePatternPiece, getAllPieces, getPiece, loadProject, newProject, redo, saveProject, undo, updatePatternPiece } from "@/lib/invoke";
import { historyKeys, patternKeys } from "@/lib/query-keys";
import { useProjectStore } from "@/stores/project-store";

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

export function useCanUndoRedo() {
  return useQuery({
    queryKey: historyKeys.canUndoRedo(),
    queryFn: canUndoRedo,
  });
}

export function useCreatePiece() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (piece: PatternPieceData) => createPatternPiece(piece),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.lists() });
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
      useProjectStore.getState().setDirty(true);
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
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
      useProjectStore.getState().setDirty(true);
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
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
      useProjectStore.getState().setDirty(true);
    },
  });
}

export function useUndo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => undo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

export function useRedo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => redo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      queryClient.invalidateQueries({ queryKey: historyKeys.all });
    },
  });
}

export function useSaveProject() {
  return useMutation({
    mutationFn: (path: string) => saveProject(path),
  });
}

export function useLoadProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (path: string) => loadProject(path),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      const pieces = await queryClient.fetchQuery({ queryKey: patternKeys.lists(), queryFn: getAllPieces });
      resetPieceCounter(pieces.length);
    },
  });
}

export function useNewProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => newProject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patternKeys.all });
      resetPieceCounter();
    },
  });
}
