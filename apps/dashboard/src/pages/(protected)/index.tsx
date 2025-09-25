import ProjectCard from "@/components/features/project/project-card";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(protected)/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col flex-1 gap-4 p-4">
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProjectCard key={i.toString()} />
        ))}
      </div>
    </div>
  );
}
