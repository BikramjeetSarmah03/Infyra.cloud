import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/app-sidebar";
import { Header } from "@/components/common/header";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/(protected)")({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const { data, error } = await authClient.getSession();
    if (!data?.session || !data.user || error) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-muted/20">
        <Header />

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
