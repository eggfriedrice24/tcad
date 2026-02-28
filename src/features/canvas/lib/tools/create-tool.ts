import type { CanvasTool, ToolContext } from "./tool-types";
import type { Tool } from "@/stores/tool-store";

import { createCurveTool } from "./curve-tool";
import { createLineTool } from "./line-tool";
import { createMeasureTool } from "./measure-tool";
import { createNodeEditTool } from "./node-edit-tool";
import { createPenTool } from "./pen-tool";
import { createSelectTool } from "./select-tool";

const toolFactories: Record<Tool, (ctx: ToolContext) => CanvasTool> = {
  "select": createSelectTool,
  "node-edit": createNodeEditTool,
  "line": createLineTool,
  "curve": createCurveTool,
  "pen": createPenTool,
  "measure": createMeasureTool,
};

export function createTool(name: Tool, ctx: ToolContext): CanvasTool {
  const factory = toolFactories[name];
  return factory(ctx);
}
