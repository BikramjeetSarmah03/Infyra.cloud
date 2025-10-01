import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/projects/$project/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(protected)/$project/settings"!</div>;
}
