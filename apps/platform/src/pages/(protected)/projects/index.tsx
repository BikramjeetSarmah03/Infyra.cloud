import { Badge } from "@infyra/ui/components/badge";
import { Button } from "@infyra/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@infyra/ui/components/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DatabaseIcon,
  GitBranchIcon,
  GlobeIcon,
  PlusIcon,
  RocketIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ProviderMark } from "@/components/common/provider-mark";
import {
  projectPresentation,
  StatusBadge,
  StatusDot,
} from "@/components/common/status-badge";
import { type Project, projects } from "@/lib/mock-data";

export const Route = createFileRoute("/(protected)/projects/")({
  component: ProjectsPage,
});

function ProjectsPage() {
  const liveCount = projects.filter((p) => p.status === "live").length;
  const attentionCount = projects.filter(
    (p) => p.status === "attention",
  ).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Projects"
        description="Each project is one client site or app, spanning the resources it needs across your connected providers."
        meta={
          <div className="flex items-center gap-1.5">
            <Badge variant="muted">{projects.length} total</Badge>
            {attentionCount > 0 ? (
              <Badge variant="destructive">
                {attentionCount} need attention
              </Badge>
            ) : (
              <Badge variant="success">{liveCount} live</Badge>
            )}
          </div>
        }
        actions={
          <Button size="sm">
            <PlusIcon />
            New project
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const presentation = projectPresentation(project.status);
  const databases = project.resources.filter((r) => r.type === "database");
  const services = project.resources.filter((r) => r.type !== "database");

  return (
    <Card className="group/project transition-colors hover:ring-foreground/20">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <CardTitle className="flex items-center gap-2">
              <StatusDot dot={presentation.dot} />
              <Link
                to="/projects/$projectSlug"
                params={{ projectSlug: project.slug }}
                className="truncate hover:underline"
              >
                {project.name}
              </Link>
            </CardTitle>
            <CardDescription className="truncate">
              {project.client}
            </CardDescription>
          </div>
          <StatusBadge kind="project" status={project.status} hideIcon />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-muted-foreground">
          <span className="flex items-center gap-2">
            <GitBranchIcon className="size-3.5 shrink-0" />
            <span className="truncate">{project.repo}</span>
          </span>
          <span className="flex items-center gap-2">
            <GlobeIcon className="size-3.5 shrink-0" />
            {project.domain ? (
              <span className="truncate">{project.domain}</span>
            ) : (
              <span className="text-muted-foreground/70">No domain yet</span>
            )}
          </span>
        </div>

        {/* Provider identity stays visible at list level, not just on detail. */}
        <div className="flex flex-wrap items-center gap-1.5">
          {services.map((resource) => (
            <Badge key={resource.id} variant="outline" className="gap-1.5">
              <ProviderMark providerId={resource.providerId} />
              {resource.type === "web_service" ? "Service" : "Static"}
            </Badge>
          ))}
          {databases.map((resource) => (
            <Badge key={resource.id} variant="outline" className="gap-1.5">
              <ProviderMark providerId={resource.providerId} />
              <DatabaseIcon />
              DB
            </Badge>
          ))}
          {project.resources.length === 0 ? (
            <span className="text-muted-foreground/70 text-xs">
              No resources attached
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <RocketIcon className="size-3.5" />
          {project.deploys.length > 0
            ? `Deployed ${project.lastDeployAt}`
            : "Never deployed"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          render={
            <Link
              to="/projects/$projectSlug"
              params={{ projectSlug: project.slug }}
            />
          }
        >
          Open
        </Button>
      </CardFooter>
    </Card>
  );
}
