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
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DatabaseIcon,
  GitBranchIcon,
  HardDriveIcon,
  MoonIcon,
  PlusIcon,
  ZapIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ProviderMark } from "@/components/common/provider-mark";
import { StatusBadge } from "@/components/common/status-badge";
import { type DatabaseRow, databases, PROVIDERS } from "@/lib/mock-data";

export const Route = createFileRoute("/(protected)/databases/")({
  component: DatabasesPage,
});

function DatabasesPage() {
  const totalGb = databases.reduce(
    (sum, db) => sum + (db.database?.sizeGb ?? 0),
    0,
  );
  const provisioning = databases.filter(
    (db) => db.status === "provisioning",
  ).length;
  const injected = databases.filter((db) => db.database?.injectedInto).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Databases"
        description="Every database infyra provisioned for you, across all clients and providers."
        meta={<Badge variant="muted">{databases.length} total</Badge>}
        actions={
          <Button size="sm">
            <PlusIcon />
            Provision database
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Databases"
          value={String(databases.length)}
          icon={<DatabaseIcon className="size-3.5" />}
        />
        <StatCard
          label="Total storage"
          value={`${totalGb.toFixed(1)} GB`}
          icon={<HardDriveIcon className="size-3.5" />}
        />
        <StatCard
          label="Auto-injected"
          value={`${injected} of ${databases.length}`}
          icon={<ZapIcon className="size-3.5" />}
        />
        <StatCard
          label="Provisioning"
          value={String(provisioning)}
          icon={<DatabaseIcon className="size-3.5" />}
          tone={provisioning > 0 ? "info" : "default"}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>All databases</CardTitle>
          <CardDescription>
            Hosted on your own provider accounts — infyra provisions and tracks
            them, it never holds your data.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {databases.length > 0 ? (
            <ul className="divide-y divide-border">
              {databases.map((database) => (
                <DatabaseRowItem key={database.id} database={database} />
              ))}
            </ul>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <DatabaseIcon />
                </EmptyMedia>
                <EmptyTitle>No databases yet</EmptyTitle>
                <EmptyDescription>
                  Provision one from a connected Neon or Supabase account and it
                  will appear here.
                </EmptyDescription>
              </EmptyHeader>
              <Button size="sm">
                <PlusIcon />
                Provision database
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
  tone?: "default" | "info";
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span
          className={
            tone === "info"
              ? "cn-font-heading font-semibold text-info text-xl"
              : "cn-font-heading font-semibold text-xl"
          }
        >
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function DatabaseRowItem({ database }: { database: DatabaseRow }) {
  const detail = database.database;
  const provider = PROVIDERS[database.providerId];

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-(--card-spacing) py-3 hover:bg-muted/40">
      <div className="flex min-w-56 flex-1 items-center gap-2.5">
        <ProviderMark providerId={database.providerId} size="md" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {database.name}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Link
              to="/projects/$projectSlug"
              params={{ projectSlug: database.project.projectSlug }}
              className="truncate hover:underline"
            >
              {database.project.projectName}
            </Link>
            <span className="text-muted-foreground/60">·</span>
            <span className="truncate">{database.project.client}</span>
          </span>
        </div>
      </div>

      <div className="flex min-w-32 flex-col text-muted-foreground">
        <span className="text-foreground">
          {provider.name} {detail?.version}
        </span>
        <span>{database.region}</span>
      </div>

      <div className="flex min-w-24 flex-col text-muted-foreground">
        <span className="text-foreground">{detail?.plan}</span>
        <span>{detail?.sizeGb} GB</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* Branching is Neon-specific; providers without it show nothing
            rather than a misleading zero. */}
        {detail?.branches != null ? (
          <Badge variant="outline">
            <GitBranchIcon />
            {detail.branches} {detail.branches === 1 ? "branch" : "branches"}
          </Badge>
        ) : null}

        {/* Scale-to-zero is normal for Neon, so it reads as neutral info —
            never as a degraded state (providers/neon.md §6.6). */}
        {detail?.computeSuspended ? (
          <Badge variant="muted">
            <MoonIcon />
            Idle
          </Badge>
        ) : null}

        {detail?.injectedInto ? (
          <Badge variant="info">
            <ZapIcon />
            {detail.injectedInto}
          </Badge>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <StatusBadge kind="resource" status={database.status} hideIcon />
        <Button size="sm" variant="ghost">
          Manage
        </Button>
      </div>
    </li>
  );
}
