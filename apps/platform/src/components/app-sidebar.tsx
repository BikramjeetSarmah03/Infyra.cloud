import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@infyra/ui/components/sidebar";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { authClient } from "@/lib/auth-client";
import { authSessionKey, useAuthSession } from "@/lib/auth-session";
import { navGroups, navSecondary, navTop, workspaces } from "@/lib/nav-data";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useAuthSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={workspaces} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navTop} />
        {navGroups.map((group) => (
          <NavMain
            key={group.label ?? "ungrouped"}
            label={group.label}
            items={group.items}
          />
        ))}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: session?.user.name ?? "",
            email: session?.user.email ?? "",
            avatar: session?.user.image ?? "",
          }}
          onSignOut={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  queryClient.setQueryData(authSessionKey, null);
                  navigate({ to: "/auth/login" });
                },
              },
            });
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
