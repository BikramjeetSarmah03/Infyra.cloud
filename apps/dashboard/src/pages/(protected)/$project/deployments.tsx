import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/$project/deployments")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(protected)/$project/deployments"!</div>;
}
