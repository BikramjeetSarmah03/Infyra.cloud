import { TanstackDevtools } from "@tanstack/react-devtools";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import type { QueryClient } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";

import { ThemeProvider } from "@/components/common/theme-provider";

export type RouterAppContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="grid grid-rows-[auto_1fr] min-h-svh">
        <Outlet />
      </div>

      <Toaster richColors />

      <TanstackDevtools
        config={{
          position: "bottom-left",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </ThemeProvider>
  );
}
