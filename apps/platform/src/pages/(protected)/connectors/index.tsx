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
import { createFileRoute } from "@tanstack/react-router";
import {
  ClockIcon,
  DatabaseIcon,
  PlusIcon,
  RefreshCwIcon,
  RocketIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { ProviderMark } from "@/components/common/provider-mark";
import {
  connectionPresentation,
  StatusBadge,
  StatusDot,
} from "@/components/common/status-badge";
import {
  type Connection,
  connections,
  PROVIDERS,
  type ProviderCategory,
  type ProviderMeta,
} from "@/lib/mock-data";

export const Route = createFileRoute("/(protected)/connectors/")({
  component: ConnectorsPage,
});

function ConnectorsPage() {
  const healthy = connections.filter((c) => c.status === "connected").length;
  const unhealthy = connections.length - healthy;

  const deployConnections = connections.filter(
    (c) => PROVIDERS[c.providerId].category === "deploy",
  );
  const databaseConnections = connections.filter(
    (c) => PROVIDERS[c.providerId].category === "database",
  );

  const connectedProviderIds = new Set(connections.map((c) => c.providerId));
  const available = Object.values(PROVIDERS).filter(
    (provider) => !connectedProviderIds.has(provider.id),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Connectors"
        description="Credentials infyra uses to provision on your behalf. Resources stay in your own provider accounts — disconnecting never deletes them."
        meta={
          <div className="flex items-center gap-1.5">
            <Badge variant="success">{healthy} healthy</Badge>
            {unhealthy > 0 ? (
              <Badge variant="warning">{unhealthy} need action</Badge>
            ) : null}
          </div>
        }
        actions={
          <Button size="sm">
            <PlusIcon />
            Connect provider
          </Button>
        }
      />

      {unhealthy > 0 ? <AttentionBanner /> : null}

      <ConnectionGroup
        title="Deployment"
        icon={<RocketIcon className="size-3.5" />}
        connections={deployConnections}
      />

      <ConnectionGroup
        title="Databases"
        icon={<DatabaseIcon className="size-3.5" />}
        connections={databaseConnections}
      />

      {available.length > 0 ? (
        <AvailableProviders providers={available} />
      ) : null}
    </div>
  );
}

function AttentionBanner() {
  const needsAction = connections.filter((c) => c.status !== "connected");

  return (
    <Card className="bg-warning-muted/40 ring-warning/25">
      <CardContent className="flex flex-col gap-2.5">
        {needsAction.map((connection) => {
          const provider = PROVIDERS[connection.providerId];
          const presentation = connectionPresentation(connection.status);

          return (
            <div
              key={connection.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <StatusDot dot={presentation.dot} />
                <span className="font-medium text-foreground">
                  {provider.name}
                </span>
                <span className="text-muted-foreground">
                  {connection.label} — {presentation.label.toLowerCase()}
                </span>
              </span>
              <Button size="sm" variant="outline">
                {connection.status === "needs_reauth" ? "Reconnect" : "Fix"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ConnectionGroup({
  title,
  icon,
  connections: items,
}: {
  title: string;
  icon: React.ReactNode;
  connections: Connection[];
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {icon}
        {title}
        <span className="text-muted-foreground/60">({items.length})</span>
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((connection) => (
          <ConnectionCard key={connection.id} connection={connection} />
        ))}
      </div>
    </section>
  );
}

function ConnectionCard({ connection }: { connection: Connection }) {
  const provider = PROVIDERS[connection.providerId];
  const isHealthy = connection.status === "connected";

  return (
    <Card
      className={isHealthy ? undefined : "bg-warning-muted/20 ring-warning/30"}
    >
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <ProviderMark providerId={connection.providerId} size="md" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <CardTitle className="truncate">{provider.name}</CardTitle>
              {/* The label disambiguates multiple connections to one provider
                  (product.md §4), so it is shown, never truncated away. */}
              <CardDescription className="truncate">
                {connection.label}
              </CardDescription>
            </div>
          </div>
          <StatusBadge kind="connection" status={connection.status} hideIcon />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Auth</span>
          <Badge variant="outline">
            <ShieldCheckIcon />
            {provider.authType === "oauth" ? "OAuth" : "API key"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Resources</span>
          <span className="text-foreground">{connection.resourceCount}</span>
        </div>

        {connection.accountScope ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Scope</span>
            <span className="truncate text-foreground">
              {connection.accountScope}
            </span>
          </div>
        ) : null}

        {connection.expiresAt ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Token expires</span>
            <Badge variant="warning">
              <ClockIcon />
              {connection.expiresAt}
            </Badge>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="justify-between gap-2">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <RefreshCwIcon className="size-3" />
          Checked {connection.lastCheckedAt}
        </span>
        {isHealthy ? (
          <Button size="sm" variant="ghost">
            Manage
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            {connection.status === "needs_reauth" ? "Reconnect" : "Fix"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function AvailableProviders({ providers }: { providers: ProviderMeta[] }) {
  const categoryLabel: Record<ProviderCategory, string> = {
    deploy: "Deployment",
    database: "Database",
  };

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        Available to connect
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id} className="border-dashed bg-muted/20">
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <ProviderMark
                  providerId={provider.id}
                  size="md"
                  className="opacity-70"
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium text-foreground text-sm">
                    {provider.name}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {provider.tagline}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge variant="muted">
                  {categoryLabel[provider.category]}
                </Badge>
                <Button size="sm" variant="outline">
                  Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
