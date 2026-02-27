import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function PropertiesSidebar() {
  return (
    <Sidebar side="right" collapsible="none" className="border-l">
      <SidebarHeader>
        <span className="px-2 text-sm font-semibold">Properties</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Selection</SidebarGroupLabel>
          <SidebarGroupContent>
            <p className="px-2 text-xs text-muted-foreground">Nothing selected</p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
