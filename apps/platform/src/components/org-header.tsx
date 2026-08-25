import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@infyra/ui/components/sidebar";
import { BoxIcon } from "lucide-react";

import { useActiveOrganization } from "@/lib/use-active-organization";

/**
 * Displays the active organization. Deliberately not a switcher: a user belongs
 * to exactly one workspace, so this exists to make the active tenant visible
 * (every scoped query depends on it), not to change it.
 */
export function OrgHeader() {
  const { data: organization } = useActiveOrganization();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent active:bg-transparent"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <BoxIcon className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {organization?.name ?? "Workspace"}
            </span>
            <span className="truncate text-muted-foreground text-xs">Free</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
