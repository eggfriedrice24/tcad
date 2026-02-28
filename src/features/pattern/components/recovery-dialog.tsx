import type { PatternPieceData } from "@/types/pattern";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RecoveryDialog({
  pieces,
  onRecover,
  onDiscard,
}: {
  pieces: PatternPieceData[];
  onRecover: () => void;
  onDiscard: () => void;
}) {
  return (
    <AlertDialog defaultOpen>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recover unsaved work?</AlertDialogTitle>
          <AlertDialogDescription>
            Found
            {" "}
            {pieces.length}
            {" "}
            unsaved
            {" "}
            {pieces.length === 1 ? "piece" : "pieces"}
            {" "}
            from a previous session.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Discard</AlertDialogCancel>
          <AlertDialogAction onClick={onRecover}>Recover</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
