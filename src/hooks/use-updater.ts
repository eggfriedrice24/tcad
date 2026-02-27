import type { Update } from "@tauri-apps/plugin-updater";

import { relaunch } from "@tauri-apps/plugin-process";

import { check } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useState } from "react";

type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "done";

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [version, setVersion] = useState("");
  const [update, setUpdate] = useState<Update | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkForUpdate() {
      setStatus("checking");
      try {
        const found = await check();
        if (cancelled)
          return;
        if (found) {
          setUpdate(found);
          setVersion(found.version);
          setStatus("available");
        }
        else {
          setStatus("idle");
        }
      }
      catch {
        setStatus("idle");
      }
    }

    checkForUpdate();
    return () => {
      cancelled = true;
    };
  }, []);

  const install = useCallback(async () => {
    if (!update)
      return;
    setStatus("downloading");
    try {
      await update.downloadAndInstall();
      setStatus("done");
      await relaunch();
    }
    catch {
      setStatus("available");
    }
  }, [update]);

  const dismiss = useCallback(() => {
    setUpdate(null);
    setStatus("idle");
  }, []);

  return { status, version, install, dismiss };
}
