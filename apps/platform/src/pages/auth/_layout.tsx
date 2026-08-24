import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AuthWrapper } from "@/components/auth-wrapper";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <AuthWrapper>
      <Outlet />
    </AuthWrapper>
  );
}
