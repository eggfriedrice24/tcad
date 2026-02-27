import type { Tool } from "@/stores/tool-store";

import {
  Cursor02Icon,
  EaseCurveControlPointsIcon,
  PenToolAddIcon,
  RulerIcon,
  SolidLine01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useTool } from "@/hooks/use-tool";

const tools: { id: Tool; label: string; icon: typeof Cursor02Icon }[] = [
  { id: "select", label: "Select", icon: Cursor02Icon },
  { id: "pen", label: "Pen", icon: PenToolAddIcon },
  { id: "line", label: "Line", icon: SolidLine01Icon },
  { id: "curve", label: "Curve", icon: EaseCurveControlPointsIcon },
  { id: "measure", label: "Measure", icon: RulerIcon },
];

export function ToolSidebar() {
  const { activeTool, setActiveTool } = useTool();

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="TCAD">
              <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-bold">
                T
              </div>
              <span className="truncate font-semibold">TCAD</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map(tool => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton
                    isActive={activeTool === tool.id}
                    tooltip={tool.label}
                    onClick={() => setActiveTool(tool.id)}
                    className="cursor-pointer data-active:text-primary"
                  >
                    <HugeiconsIcon icon={tool.icon} strokeWidth={2} />
                    <span>{tool.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Pieces</SidebarGroupLabel>
          <SidebarGroupContent>
            <p className="px-2 text-xs text-muted-foreground">No pieces yet</p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
