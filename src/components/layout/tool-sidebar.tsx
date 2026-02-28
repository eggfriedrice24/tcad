import {
  Delete02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { modes, toolGroups } from "@/components/layout/tool-defs";
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
        {toolGroups.map(group => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className={cn("grid gap-1", collapsed ? "grid-cols-1 px-0.5" : "grid-cols-3 px-2")}>
                {group.tools.map(tool => (
                  <Tooltip key={tool.label}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={tool.id && activeTool === tool.id ? "secondary" : "ghost"}
                        size="icon"
                        className={cn("size-8", !tool.disabled && "cursor-pointer")}
                        disabled={tool.disabled}
                        onClick={tool.id ? () => setActiveTool(tool.id!) : undefined}
                      >
                        <HugeiconsIcon
                          icon={tool.icon}
                          size={16}
                          strokeWidth={2}
                          className={tool.id && activeTool === tool.id ? "text-primary" : ""}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side={collapsed ? "right" : "bottom"} className="text-xs">
                      {tool.label}
                      {tool.shortcut
                        ? (
                            <kbd className="ml-1.5 rounded border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                              {tool.shortcut}
                            </kbd>
                          )
                        : tool.disabled && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">Soon</span>
                        )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup className="py-1">
          <SidebarGroupLabel>Modes</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className={cn("grid gap-1", collapsed ? "grid-cols-1 px-0.5" : "grid-cols-3 px-2")}>
              {modes.map((mode) => {
                const active = mode.id === "snap" ? snapEnabled : false;
                const onClick = mode.id === "snap" ? toggleSnap : undefined;
                return (
                  <Tooltip key={mode.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        size="icon"
                        className={cn("size-8", !mode.disabled && "cursor-pointer")}
                        disabled={mode.disabled}
                        onClick={onClick}
                      >
                        <HugeiconsIcon
                          icon={mode.icon}
                          size={16}
                          strokeWidth={2}
                          className={active ? "text-primary" : ""}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side={collapsed ? "right" : "bottom"} className="text-xs">
                      {mode.label}
                      {mode.shortcut
                        ? (
                            <kbd className="ml-1.5 rounded border bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                              {mode.shortcut}
                            </kbd>
                          )
                        : mode.disabled && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground">Soon</span>
                        )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
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
