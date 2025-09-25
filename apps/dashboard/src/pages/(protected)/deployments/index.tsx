import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/deployments/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className="p-4">Hello "/(protected)/deployments/"!</div>;
}
