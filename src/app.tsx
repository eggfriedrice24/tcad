import { CenterWorkspace } from "@/components/layout/center-workspace";
import { PropertiesSidebar } from "@/components/layout/properties-sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { ToolSidebar } from "@/components/layout/tool-sidebar";
import { Toolbar } from "@/components/layout/toolbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToolProvider } from "@/components/providers/tool-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <ToolProvider>
        <WorkspaceProvider>
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
        </WorkspaceProvider>
      </ToolProvider>
    </ThemeProvider>
  );
}
