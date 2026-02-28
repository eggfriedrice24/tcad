import type { ViewMode } from "@/stores/workspace-store";

import { KeyboardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useWorkspace } from "@/hooks/use-workspace";

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

  return (
    <header className="flex h-10 shrink-0 items-center border-b px-2">
      <SidebarTrigger />
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
