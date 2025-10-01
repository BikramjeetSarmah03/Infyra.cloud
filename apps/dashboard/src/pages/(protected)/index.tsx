import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col flex-1 gap-4 p-4">
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 h-full">
        <div className="space-y-6 bg-muted p-4 border hover:border-primary/50 rounded-md text-sm transition-all duration-300">
          Hey
        </div>
        <div className="space-y-6 bg-muted p-4 border hover:border-primary/50 rounded-md text-sm transition-all duration-300">
          Hey
        </div>
        <div className="space-y-6 bg-muted p-4 border hover:border-primary/50 rounded-md text-sm transition-all duration-300">
          Hey
        </div>
        <div className="space-y-6 bg-muted p-4 border hover:border-primary/50 rounded-md text-sm transition-all duration-300">
          Hey
        </div>
      </div>
    </div>
  );
}
