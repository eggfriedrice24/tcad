import type { ViewMode } from "@/stores/workspace-store";

import { Download04Icon, KeyboardIcon, RedoIcon, UndoIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { save } from "@tauri-apps/plugin-dialog";

import { ThemeToggle } from "@/components/theme-toggle";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCanUndoRedo, usePatternPieces, useRedo, useUndo } from "@/features/pattern/hooks/use-pattern-queries";
import { useWorkspace } from "@/hooks/use-workspace";
import { exportDxf, exportPdf, exportSvgToFile } from "@/lib/invoke";
import { useProjectStore } from "@/stores/project-store";

const viewModes: { id: ViewMode; label: string }[] = [
  { id: "2d", label: "2D" },
  { id: "3d", label: "3D" },
  { id: "split", label: "Split" },
];

type ShortcutGroup = {
  label: string;
  items: { keys: string[]; description: string }[];
};

const shortcutGroups: ShortcutGroup[] = [
  {
    label: "Tools",
    items: [
      { keys: ["V"], description: "Select" },
      { keys: ["A"], description: "Node Edit" },
      { keys: ["L"], description: "Line" },
      { keys: ["C"], description: "Curve" },
      { keys: ["P"], description: "Pen" },
      { keys: ["M"], description: "Measure" },
    ],
  },
  {
    label: "Drawing",
    items: [
      { keys: ["Enter"], description: "Finish shape" },
      { keys: ["Esc"], description: "Cancel" },
      { keys: ["Del"], description: "Delete selected" },
      { keys: ["Dbl-click"], description: "Finish shape" },
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
    ],
  },
  {
    label: "Modifiers",
    items: [
      { keys: ["."], description: "Toggle snap" },
      { keys: ["Shift"], description: "Constrain 45°" },
    ],
  },
  {
    label: "File",
    items: [
      { keys: ["Ctrl", "S"], description: "Save" },
      { keys: ["Ctrl", "Shift", "S"], description: "Save As" },
      { keys: ["Ctrl", "O"], description: "Open" },
      { keys: ["Ctrl", "N"], description: "New" },
    ],
  },
  {
    label: "Navigation",
    items: [
      { keys: ["Space", "Drag"], description: "Pan" },
      { keys: ["Scroll"], description: "Zoom" },
      { keys: ["Mid-click"], description: "Pan" },
      { keys: ["Shift", "Click"], description: "Multi-select" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function Toolbar() {
  const { viewMode, setViewMode } = useWorkspace();
  const { name, dirty } = useProjectStore();
  const { data: pieces } = usePatternPieces();
  const undoMut = useUndo();
  const redoMut = useRedo();
  const { data: undoRedoState } = useCanUndoRedo();
  const canUndo = undoRedoState?.[0] ?? false;
  const canRedo = undoRedoState?.[1] ?? false;

  return (
    <header className="flex h-10 shrink-0 items-center border-b px-2">
      <SidebarTrigger />
      <span className="ml-2 text-xs text-muted-foreground">
        {name}
        {dirty && <span className="ml-1 text-pink-500">*</span>}
      </span>
      <Separator orientation="vertical" className="mx-2 my-auto h-4" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7" disabled={!canUndo} onClick={() => undoMut.mutate()}>
            <HugeiconsIcon icon={UndoIcon} size={16} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            Undo
            {" "}
            <Kbd>Ctrl+Z</Kbd>
          </p>
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7" disabled={!canRedo} onClick={() => redoMut.mutate()}>
            <HugeiconsIcon icon={RedoIcon} size={16} strokeWidth={2} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            Redo
            {" "}
            <Kbd>Ctrl+Shift+Z</Kbd>
          </p>
        </TooltipContent>
      </Tooltip>
      <div className="flex flex-1 items-center justify-center gap-1">
        {viewModes.map(mode => (
          <Button
            key={mode.id}
            variant={viewMode === mode.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode(mode.id)}
          >
            {mode.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" title="Export">
              <HugeiconsIcon icon={Download04Icon} size={18} strokeWidth={2} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1">
            <div className="space-y-0.5">
              {(["SVG", "DXF", "PDF"] as const).map(format => (
                <button
                  key={format}
                  className="flex w-full items-center rounded px-2 py-1.5 text-xs hover:bg-accent"
                  onClick={() => {
                    const ext = format.toLowerCase();
                    const ids = pieces?.map(p => p.id) ?? [];
                    save({ filters: [{ name: format, extensions: [ext] }] }).then((path) => {
                      if (!path)
                        return;
                      let promise: Promise<unknown> | undefined;
                      if (ext === "svg")
                        promise = exportSvgToFile(ids, path);
                      else if (ext === "dxf")
                        promise = exportDxf(ids, path);
                      else if (ext === "pdf")
                        promise = exportPdf(ids, path);
                      promise?.catch(err => console.error(`Export ${format} failed:`, err));
                    });
                  }}
                >
                  Export as
                  {" "}
                  {format}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" title="Keyboard shortcuts">
              <HugeiconsIcon icon={KeyboardIcon} size={18} strokeWidth={2} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-0">
            {shortcutGroups.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && <Separator />}
                <div className="px-3 py-2">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map(item => (
                      <div key={item.description} className="flex items-center justify-between">
                        <span className="text-xs text-foreground">{item.description}</span>
                        <div className="flex items-center gap-0.5">
                          {item.keys.map((k, i) => (
                            <span key={k} className="flex items-center gap-0.5">
                              {i > 0 && <span className="text-[10px] text-muted-foreground">+</span>}
                              <Kbd>{k}</Kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </PopoverContent>
        </Popover>
        <ThemeToggle />
      </div>
    </header>
  );
}
