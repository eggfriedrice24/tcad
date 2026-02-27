import { QueryClientProvider } from "@tanstack/react-query";

import { CenterWorkspace } from "@/components/layout/center-workspace";
import { PropertiesSidebar } from "@/components/layout/properties-sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Toolbar } from "@/components/layout/toolbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UpdateDialog } from "@/components/update-dialog";
import { queryClient } from "@/lib/query-client";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}
