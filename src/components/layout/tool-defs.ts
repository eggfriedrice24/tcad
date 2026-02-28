import type { Tool } from "@/stores/tool-store";

import {
  AnchorPointIcon,
  ArrowVerticalIcon,
  Cursor02Icon,
  DartIcon,
  EaseCurveControlPointsIcon,
  Fan01Icon,
  FlipHorizontalIcon,
  GridIcon,
  MagnetIcon,
  MirrorIcon,
  NodeEditIcon,
  OrthogonalEdgeIcon,
  PenToolAddIcon,
  Resize01Icon,
  RotateClockwiseIcon,
  RulerIcon,
  Scissor01Icon,
  SolidLine01Icon,
  TextIcon,
} from "@hugeicons/core-free-icons";

export type ToolDef = {
  id?: Tool;
  label: string;
  shortcut?: string;
  icon: typeof Cursor02Icon;
  disabled?: boolean;
};

export type ToolGroup = {
  label: string;
  tools: ToolDef[];
};

export type ModeDef = {
  id: string;
  label: string;
  shortcut?: string;
  icon: typeof Cursor02Icon;
  disabled?: boolean;
};

export const toolGroups: ToolGroup[] = [
  {
    label: "Select",
    tools: [
      { id: "select", label: "Select", shortcut: "V", icon: Cursor02Icon },
      { id: "node-edit", label: "Node Edit", shortcut: "A", icon: NodeEditIcon },
    ],
  },
  {
    label: "Draw",
    tools: [
      { id: "pen", label: "Pen", shortcut: "P", icon: PenToolAddIcon },
      { id: "line", label: "Line", shortcut: "L", icon: SolidLine01Icon },
      { id: "curve", label: "Curve", shortcut: "C", icon: EaseCurveControlPointsIcon },
    ],
  },
  {
    label: "Modify",
    tools: [
      { label: "Scissors", icon: Scissor01Icon, disabled: true },
      { label: "Mirror", icon: MirrorIcon, disabled: true },
      { label: "Rotate", icon: RotateClockwiseIcon, disabled: true },
    ],
  },
  {
    label: "Pattern",
    tools: [
      { label: "Dart", icon: DartIcon, disabled: true },
      { label: "Slash & Spread", icon: Fan01Icon, disabled: true },
      { label: "Grading", icon: Resize01Icon, disabled: true },
    ],
  },
  {
    label: "Annotate",
    tools: [
      { id: "measure", label: "Measure", shortcut: "M", icon: RulerIcon },
      { label: "Grain Line", icon: ArrowVerticalIcon, disabled: true },
      { label: "Notch", icon: AnchorPointIcon, disabled: true },
      { label: "Text", icon: TextIcon, disabled: true },
    ],
  },
];

export const modes: ModeDef[] = [
  { id: "snap", label: "Snap", shortcut: ".", icon: MagnetIcon },
  { id: "grid-snap", label: "Grid Snap", icon: GridIcon, disabled: true },
  { id: "ortho", label: "Ortho Lock", icon: OrthogonalEdgeIcon, disabled: true },
  { id: "symmetry", label: "Symmetry", icon: FlipHorizontalIcon, disabled: true },
];
