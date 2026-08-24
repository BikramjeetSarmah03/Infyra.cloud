import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">Welcome to infyra.</p>
    </div>
  );
}
