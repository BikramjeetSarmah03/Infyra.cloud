import { createFileRoute, Outlet } from "@tanstack/react-router";

import AuthWrapper from "./_components/auth-wrapper";

export const Route = createFileRoute("/auth")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthWrapper>
      <Outlet />
    </AuthWrapper>
  );
}
