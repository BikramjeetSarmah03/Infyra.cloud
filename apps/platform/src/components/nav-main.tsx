import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@infyra/ui/components/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@infyra/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";

import type { NavItem } from "@/lib/nav-data";

export function NavMain({
  label,
  items,
}: {
  label?: string;
  items: NavItem[];
}) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) =>
          item.items?.length ? (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={<SidebarMenuButton tooltip={item.title} />}
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>
              {item.badge !== undefined ? (
                <SidebarMenuBadge className="right-6">
                  {item.badge}
                </SidebarMenuBadge>
              ) : null}
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton render={<Link to={subItem.url} />}>
                        <span>{subItem.title}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                  {item.viewAllUrl ? (
                    <SidebarMenuSubItem className="mt-1 border-sidebar-border/70 border-t pt-1.5">
                      <SidebarMenuSubButton
                        render={<Link to={item.viewAllUrl} />}
                        className="text-sidebar-foreground/70"
                      >
                        <span>{item.viewAllLabel ?? "View all"} &rarr;</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : null}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                render={<Link to={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
              {item.badge !== undefined ? (
                <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
              ) : null}
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
