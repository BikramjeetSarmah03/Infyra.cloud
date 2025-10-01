import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/projects/$project/analytics")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(protected)/$project/analytics"!</div>;
}
