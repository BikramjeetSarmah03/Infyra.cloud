import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/$project/logs")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(protected)/$project/logs"!</div>;
}
