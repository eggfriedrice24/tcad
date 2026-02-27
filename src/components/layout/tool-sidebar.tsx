import type { Tool } from "@/stores/tool-store";

import {
  Cursor02Icon,
  EaseCurveControlPointsIcon,
  PenToolAddIcon,
  PlusSignIcon,
  RulerIcon,
  SolidLine01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
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
import { createDefaultRectangle } from "@/features/canvas/lib/piece-factory";
import { useCreatePiece, usePatternPieces } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelection } from "@/hooks/use-selection";
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
  const { data: pieces } = usePatternPieces();
  const createPiece = useCreatePiece();
  const { selectedIds, select } = useSelection();

  const handleNewPiece = () => {
    const piece = createDefaultRectangle();
    createPiece.mutate(piece, {
      onSuccess: () => select(piece.id),
    });
  };

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
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel className="p-0">Pieces</SidebarGroupLabel>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={handleNewPiece}
              disabled={createPiece.isPending}
              title="New Piece"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} strokeWidth={2} />
            </Button>
          </div>
          <SidebarGroupContent>
            {pieces && pieces.length > 0
              ? (
                  <SidebarMenu>
                    {pieces.map(piece => (
                      <SidebarMenuItem key={piece.id}>
                        <SidebarMenuButton
                          isActive={selectedIds.has(piece.id)}
                          onClick={() => select(piece.id)}
                          className="cursor-pointer data-active:text-primary"
                        >
                          <span className="truncate">{piece.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                )
              : (
                  <p className="px-2 text-xs text-muted-foreground">No pieces yet</p>
                )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
