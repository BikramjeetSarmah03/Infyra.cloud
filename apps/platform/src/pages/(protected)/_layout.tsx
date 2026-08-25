import { Separator } from "@infyra/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@infyra/ui/components/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { NotFound } from "@/components/common/not-found";
import { ModeToggle } from "@/components/mode-toggle";
import { authSessionQueryOptions } from "@/lib/auth-session";
import { activeOrganizationQueryOptions } from "@/lib/use-active-organization";

export const Route = createFileRoute("/(protected)")({
  component: ProtectedLayout,
  notFoundComponent: NotFound,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      authSessionQueryOptions,
    );
    if (!session) {
      throw redirect({ to: "/auth/login" });
    }

    // Users predating the organization plugin (and anyone who abandoned
    // onboarding) have no workspace yet. Every tenant-scoped request would
    // fail, so gate the whole protected area rather than each page.
    const organization = await context.queryClient.ensureQueryData(
      activeOrganizationQueryOptions,
    );
    if (!organization) {
      throw redirect({ to: "/onboarding" });
    }

    return { session, organization };
  },
});

function ProtectedLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
