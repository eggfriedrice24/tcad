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
import { useUpdater } from "@/hooks/use-updater";

export function UpdateDialog() {
  const { status, version, install, dismiss } = useUpdater();

  const open = status === "available" || status === "downloading";
  const downloading = status === "downloading";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v)
          dismiss();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Available</AlertDialogTitle>
          <AlertDialogDescription>
            {downloading
              ? "Downloading update\u2026"
              : `Version ${version} is ready to install.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={downloading} onClick={dismiss}>
            Later
          </AlertDialogCancel>
          <AlertDialogAction disabled={downloading} onClick={install}>
            {downloading ? "Installing\u2026" : "Install & Restart"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
