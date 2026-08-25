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
import { Separator } from "@infyra/ui/components/separator";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  GitBranchIcon,
  GlobeIcon,
  PlusIcon,
  RocketIcon,
  ServerIcon,
} from "lucide-react";
import { NotFound } from "@/components/common/not-found";
import { PageHeader } from "@/components/common/page-header";
import { ProviderMark } from "@/components/common/provider-mark";
import {
  projectPresentation,
  StatusBadge,
  StatusDot,
} from "@/components/common/status-badge";
import {
  type Deploy,
  getProjectBySlug,
  PROVIDERS,
  type Resource,
} from "@/lib/mock-data";

export const Route = createFileRoute("/(protected)/projects/$projectSlug")({
  component: ProjectDetailPage,
  notFoundComponent: NotFound,
  loader: ({ params }) => {
    const project = getProjectBySlug(params.projectSlug);
    if (!project) {
      throw notFound();
    }
    return project;
  },
});

function ProjectDetailPage() {
  const project = Route.useLoaderData();
  const presentation = projectPresentation(project.status);
  const latestDeploy = project.deploys.at(0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <Button
          size="sm"
          variant="ghost"
          className="-ml-2 w-fit text-muted-foreground"
          render={<Link to="/projects" />}
        >
          <ArrowLeftIcon />
          All projects
        </Button>

        <PageHeader
          title={
            <span className="flex items-center gap-2.5">
              <StatusDot dot={presentation.dot} className="size-2" />
              {project.name}
            </span>
          }
          description={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5">
                <GitBranchIcon className="size-3.5" />
                {project.repo}
              </span>
              {project.domain ? (
                <span className="flex items-center gap-1.5">
                  <GlobeIcon className="size-3.5" />
                  {project.domain}
                </span>
              ) : null}
              <span>Client: {project.client}</span>
            </span>
          }
          meta={<StatusBadge kind="project" status={project.status} />}
          actions={
            <>
              <Button size="sm" variant="outline">
                <PlusIcon />
                Add resource
              </Button>
              <Button size="sm">
                <RocketIcon />
                Deploy
              </Button>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <LatestDeployCard deploy={latestDeploy} />
        <ResourcesCard resources={project.resources} />
      </div>

      <DeployHistoryCard deploys={project.deploys} />
    </div>
  );
}

function LatestDeployCard({ deploy }: { deploy: Deploy | undefined }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Latest deploy</CardTitle>
        <CardDescription>Most recent build for this project</CardDescription>
      </CardHeader>

      {deploy ? (
        <>
          <CardContent className="flex flex-col gap-3">
            <StatusBadge kind="deploy" status={deploy.status} />
            <div className="flex flex-col gap-1.5">
              <span className="font-medium text-foreground">
                {deploy.message}
              </span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
                <code className="bg-muted px-1.5 py-0.5 text-[11px]">
                  {deploy.commit}
                </code>
                <span>{deploy.branch}</span>
                <span>·</span>
                <span>{deploy.createdAt}</span>
                <span>·</span>
                <span>{deploy.triggeredBy}</span>
              </span>
            </div>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm" variant="outline">
              View logs
            </Button>
            <Button size="sm" variant="ghost">
              Rollback
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent className="text-muted-foreground">
          No deploys yet. Link a repository and deploy to see history here.
        </CardContent>
      )}
    </Card>
  );
}

function ResourcesCard({ resources }: { resources: Resource[] }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="border-b">
        <CardTitle>Resources</CardTitle>
        <CardDescription>
          Live on your own provider accounts — infyra orchestrates, it does not
          host.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        {resources.length > 0 ? (
          <ul className="divide-y divide-border">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center justify-between gap-3 px-(--card-spacing) py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProviderMark providerId={resource.providerId} size="md" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium text-foreground">
                      {resource.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {resource.type === "database" ? (
                        <DatabaseIcon className="size-3" />
                      ) : (
                        <ServerIcon className="size-3" />
                      )}
                      {PROVIDERS[resource.providerId].name} · {resource.region}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge
                    kind="resource"
                    status={resource.status}
                    hideIcon
                  />
                  <Button size="icon-sm" variant="ghost">
                    <ExternalLinkIcon />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-(--card-spacing) py-6 text-center text-muted-foreground">
            No resources attached yet.
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button size="sm" variant="outline">
          <PlusIcon />
          Add resource
        </Button>
      </CardFooter>
    </Card>
  );
}

function DeployHistoryCard({ deploys }: { deploys: Deploy[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Deploy history</CardTitle>
            <CardDescription>
              Every build for this project, newest first
            </CardDescription>
          </div>
          <Badge variant="muted">{deploys.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {deploys.length > 0 ? (
          <ul className="divide-y divide-border">
            {deploys.map((deploy) => (
              <li
                key={deploy.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-(--card-spacing) py-2.5 hover:bg-muted/40"
              >
                <StatusBadge kind="deploy" status={deploy.status} hideIcon />
                <code className="bg-muted px-1.5 py-0.5 text-[11px]">
                  {deploy.commit}
                </code>
                <span className="min-w-0 flex-1 truncate text-foreground">
                  {deploy.message}
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-muted-foreground">{deploy.branch}</span>
                <span className="text-muted-foreground">{deploy.duration}</span>
                <span className="w-16 text-right text-muted-foreground">
                  {deploy.createdAt}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-(--card-spacing) py-8 text-center text-muted-foreground">
            No deploys yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
