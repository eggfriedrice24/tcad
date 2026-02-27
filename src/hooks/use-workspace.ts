import { useWorkspaceStore } from "@/stores/workspace-store";

export function useWorkspace() {
  return useWorkspaceStore();
}
