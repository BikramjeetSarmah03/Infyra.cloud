import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/password/forgot")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/auth/password/forgot"!</div>;
}
