import { Badge } from "@infyra/ui/components/badge";
import { Button } from "@infyra/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@infyra/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@infyra/ui/components/empty";
import { Separator } from "@infyra/ui/components/separator";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CircleCheckIcon,
  GitBranchIcon,
  RocketIcon,
  TimerIcon,
  UserIcon,
  WebhookIcon,
  XCircleIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ProviderMark } from "@/components/common/provider-mark";
import { StatusBadge } from "@/components/common/status-badge";
import { type DeployRow, deploys, projects } from "@/lib/mock-data";

export const Route = createFileRoute("/(protected)/deployments/")({
  component: DeploymentsPage,
});

/** Which provider actually ran a deploy — resolved from the project's deploy target. */
function deployProvider(deploy: DeployRow) {
  const project = projects.find((p) => p.id === deploy.project.projectId);
  return project?.resources.find((r) => r.type !== "database")?.providerId;
}

function DeploymentsPage() {
  const failed = deploys.filter((d) => d.status === "failed");
  const succeeded = deploys.filter((d) => d.status === "succeeded");
  const inFlight = deploys.filter(
    (d) => d.status === "building" || d.status === "queued",
  );

  const successRate =
    deploys.length > 0
      ? Math.round((succeeded.length / deploys.length) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Deployments"
        description="Every build across every client project, newest first — so a failure never hides inside one project's tab."
        meta={
          <div className="flex items-center gap-1.5">
            {failed.length > 0 ? (
              <Badge variant="destructive">{failed.length} failed</Badge>
            ) : (
              <Badge variant="success">All passing</Badge>
            )}
            {inFlight.length > 0 ? (
              <Badge variant="info">{inFlight.length} in flight</Badge>
            ) : null}
          </div>
        }
        actions={
          <Button size="sm">
            <RocketIcon />
            Deploy a project
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total deploys"
          value={String(deploys.length)}
          icon={<RocketIcon className="size-3.5" />}
        />
        <StatCard
          label="Succeeded"
          value={String(succeeded.length)}
          icon={<CircleCheckIcon className="size-3.5" />}
          tone="success"
        />
        <StatCard
          label="Failed"
          value={String(failed.length)}
          icon={<XCircleIcon className="size-3.5" />}
          tone={failed.length > 0 ? "destructive" : "default"}
        />
        <StatCard
          label="Success rate"
          value={`${successRate}%`}
          icon={<TimerIcon className="size-3.5" />}
        />
      </div>

      {/* Failures lead. An agency opens this page to find what broke, and a
          failed build buried in a reverse-chronological list is a missed alert. */}
      {failed.length > 0 ? (
        <Card className="bg-destructive-muted/30 ring-destructive/25">
          <CardHeader className="border-destructive/15 border-b">
            <CardTitle className="flex items-center gap-2">
              <XCircleIcon className="size-3.5 text-destructive" />
              Failed deploys
            </CardTitle>
            <CardDescription>
              These need attention before the client notices.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-destructive/15">
              {failed.map((deploy) => (
                <DeployRowItem key={deploy.id} deploy={deploy} highlight />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>All deployments</CardTitle>
              <CardDescription>
                Across {projects.length} projects and every connected provider
              </CardDescription>
            </div>
            <Badge variant="muted">{deploys.length}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {deploys.length > 0 ? (
            <ul className="divide-y divide-border">
              {deploys.map((deploy) => (
                <DeployRowItem key={deploy.id} deploy={deploy} />
              ))}
            </ul>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RocketIcon />
                </EmptyMedia>
                <EmptyTitle>No deployments yet</EmptyTitle>
                <EmptyDescription>
                  Link a repository to a project and deploy — builds from every
                  provider will show up here.
                </EmptyDescription>
              </EmptyHeader>
              <Button size="sm">
                <RocketIcon />
                Deploy a project
              </Button>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "destructive";
}) {
  const valueTone =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : undefined;

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span
          className={`cn-font-heading font-semibold text-xl ${valueTone ?? ""}`}
        >
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function DeployRowItem({
  deploy,
  highlight,
}: {
  deploy: DeployRow;
  highlight?: boolean;
}) {
  const providerId = deployProvider(deploy);
  const isWebhook = deploy.triggeredBy === "webhook";

  return (
    <li
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-(--card-spacing) py-3 ${
        highlight ? "hover:bg-destructive/5" : "hover:bg-muted/40"
      }`}
    >
      <StatusBadge kind="deploy" status={deploy.status} hideIcon />

      <div className="flex min-w-56 flex-1 flex-col">
        <span className="truncate font-medium text-foreground">
          {deploy.message}
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
          <Link
            to="/projects/$projectSlug"
            params={{ projectSlug: deploy.project.projectSlug }}
            className="truncate hover:underline"
          >
            {deploy.project.projectName}
          </Link>
          <span className="text-muted-foreground/60">·</span>
          <span className="truncate">{deploy.project.client}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {providerId ? (
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <ProviderMark providerId={providerId} />
            <span className="truncate">{deploy.target}</span>
          </span>
        ) : null}
      </div>

      <Separator orientation="vertical" className="hidden h-4 sm:block" />

      <div className="flex items-center gap-2 text-muted-foreground">
        <code className="bg-muted px-1.5 py-0.5 text-[11px]">
          {deploy.commit}
        </code>
        <span className="flex items-center gap-1">
          <GitBranchIcon className="size-3" />
          {deploy.branch}
        </span>
      </div>

      <div className="flex min-w-28 items-center gap-1.5 text-muted-foreground">
        {isWebhook ? (
          <WebhookIcon className="size-3" />
        ) : (
          <UserIcon className="size-3" />
        )}
        <span className="truncate">{deploy.triggeredBy}</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <span className="w-14 text-right text-muted-foreground">
          {deploy.duration}
        </span>
        <span className="w-20 text-right text-muted-foreground">
          {deploy.createdAt}
        </span>
        <Button size="sm" variant={highlight ? "outline" : "ghost"}>
          {deploy.status === "failed" ? "View logs" : "Details"}
        </Button>
      </div>
    </li>
  );
}
