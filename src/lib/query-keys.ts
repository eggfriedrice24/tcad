import type { PatternPieceId } from "@/types/pattern";

export const patternKeys = {
  all: ["pattern"] as const,
  lists: () => [...patternKeys.all, "list"] as const,
  details: () => [...patternKeys.all, "detail"] as const,
  detail: (id: PatternPieceId) => [...patternKeys.details(), id] as const,
  area: (id: PatternPieceId) => [...patternKeys.all, "area", id] as const,
  validation: (id: PatternPieceId) => [...patternKeys.all, "validation", id] as const,
  seamAllowance: (id: PatternPieceId, mm: number) => [...patternKeys.all, "seam-allowance", id, mm] as const,
};

export const meshKeys = {
  all: ["mesh"] as const,
  generate: (ids: PatternPieceId[]) => [...meshKeys.all, "generate", ...ids] as const,
};
