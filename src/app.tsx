import type { PatternPieceData } from "@/types/pattern";

import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { CenterWorkspace } from "@/components/layout/center-workspace";
import { PropertiesSidebar } from "@/components/layout/properties-sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Toolbar } from "@/components/layout/toolbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UpdateDialog } from "@/components/update-dialog";
import { RecoveryDialog } from "@/features/pattern/components/recovery-dialog";
import { checkRecovery, clearRecovery, restoreRecovery, saveRecovery } from "@/lib/invoke";
import { queryClient } from "@/lib/query-client";
import { patternKeys } from "@/lib/query-keys";
import { useProjectStore } from "@/stores/project-store";

function AppInner() {
  const qc = useQueryClient();
  const [recoveryPieces, setRecoveryPieces] = useState<PatternPieceData[] | null>(null);

  useEffect(() => {
    checkRecovery().then((pieces) => {
      if (pieces && pieces.length > 0) {
        setRecoveryPieces(pieces);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (useProjectStore.getState().dirty) {
        saveRecovery().catch(() => {});
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <UpdateDialog />
      <TooltipProvider>
        <SidebarProvider>
          <ToolSidebar />
          <SidebarInset>
            <Toolbar />
            <CenterWorkspace />
            <StatusBar />
          </SidebarInset>
          <PropertiesSidebar />
        </SidebarProvider>
      </TooltipProvider>
      {recoveryPieces && (
        <RecoveryDialog
          pieces={recoveryPieces}
          onRecover={() => {
            restoreRecovery().then(() => {
              qc.invalidateQueries({ queryKey: patternKeys.all });
            });
            setRecoveryPieces(null);
          }}
          onDiscard={() => {
            clearRecovery();
            setRecoveryPieces(null);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <AppInner />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
