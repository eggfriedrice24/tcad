import type { Tool } from "@/stores/tool-store";

import {
  Cursor02Icon,
  Delete02Icon,
  EaseCurveControlPointsIcon,
  MagnetIcon,
  MirrorIcon,
  NodeEditIcon,
  PenToolAddIcon,
  PlusSignIcon,
  RotateClockwiseIcon,
  RulerIcon,
  Scissor01Icon,
  SolidLine01Icon,
  TextIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createDefaultRectangle } from "@/features/canvas/lib/piece-factory";
import { useCreatePiece, useDeletePiece, usePatternPieces } from "@/features/pattern/hooks/use-pattern-queries";
import { useSelection } from "@/hooks/use-selection";
import { useTool } from "@/hooks/use-tool";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

type ToolDef = {
  id: Tool;
  label: string;
  shortcut: string;
  icon: typeof Cursor02Icon;
  disabled?: boolean;
};

const tools: ToolDef[] = [
  { id: "select", label: "Select", shortcut: "V", icon: Cursor02Icon },
  { id: "node-edit", label: "Node Edit", shortcut: "A", icon: NodeEditIcon },
  { id: "pen", label: "Pen", shortcut: "P", icon: PenToolAddIcon },
  { id: "line", label: "Line", shortcut: "L", icon: SolidLine01Icon },
  { id: "curve", label: "Curve", shortcut: "C", icon: EaseCurveControlPointsIcon },
  { id: "measure", label: "Measure", shortcut: "M", icon: RulerIcon },
];

const futureTools: Omit<ToolDef, "id" | "shortcut">[] = [
  { label: "Scissors", icon: Scissor01Icon, disabled: true },
  { label: "Text", icon: TextIcon, disabled: true },
  { label: "Mirror", icon: MirrorIcon, disabled: true },
  { label: "Rotate", icon: RotateClockwiseIcon, disabled: true },
];

export function ToolSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { activeTool, setActiveTool } = useTool();
  const { snapEnabled, toggleSnap } = useWorkspace();
  const { data: pieces } = usePatternPieces();
  const createPiece = useCreatePiece();
  const deletePiece = useDeletePiece();
  const { selectedIds, select } = useSelection();

  const handleNewPiece = () => {
    const piece = createDefaultRectangle();
    createPiece.mutate(piece, {
      onSuccess: () => select(piece.id),
    });
  };

  const handleDeletePiece = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deletePiece.mutate(id);
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
            <div className={cn("grid gap-1", collapsed ? "grid-cols-1 px-0.5" : "grid-cols-3 px-2")}>
              {tools.map(tool => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTool === tool.id ? "secondary" : "ghost"}
                      size="icon"
                      className="size-8 cursor-pointer"
                      onClick={() => setActiveTool(tool.id)}
                    >
                      <HugeiconsIcon
                        icon={tool.icon}
                        size={16}
                        strokeWidth={2}
                        className={activeTool === tool.id ? "text-primary" : ""}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={collapsed ? "right" : "bottom"} className="text-xs">
                    {tool.label}
                    <kbd className="ml-1.5 rounded border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                      {tool.shortcut}
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              ))}
              {!collapsed && futureTools.map(tool => (
                <Tooltip key={tool.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled
                    >
                      <HugeiconsIcon icon={tool.icon} size={16} strokeWidth={2} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {tool.label}
                    <span className="ml-1.5 text-[10px] text-muted-foreground">Soon</span>
                  </TooltipContent>
                </Tooltip>
              ))}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={snapEnabled ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8 cursor-pointer"
                    onClick={toggleSnap}
                  >
                    <HugeiconsIcon
                      icon={MagnetIcon}
                      size={16}
                      strokeWidth={2}
                      className={snapEnabled ? "text-primary" : ""}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={collapsed ? "right" : "bottom"} className="text-xs">
                  Snap
                  <kbd className="ml-1.5 rounded border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    .
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        <Separator className="mx-2 w-auto" />
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
                          className="group/piece cursor-pointer data-active:text-primary"
                        >
                          <span className="truncate">{piece.name}</span>
                          <button
                            type="button"
                            className="ml-auto opacity-0 transition-opacity hover:text-destructive group-hover/piece:opacity-100"
                            onClick={e => handleDeletePiece(e, piece.id)}
                            title="Delete piece"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                          </button>
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
