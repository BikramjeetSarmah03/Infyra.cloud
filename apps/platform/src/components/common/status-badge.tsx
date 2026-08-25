import { Badge } from "@infyra/ui/components/badge";
import { cn } from "@infyra/ui/lib/utils";
import {
  AlertTriangleIcon,
  BanIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleSlashIcon,
  LoaderIcon,
  XCircleIcon,
} from "lucide-react";
import type {
  ConnectionStatus,
  DeployStatus,
  ProjectStatus,
  ResourceStatus,
} from "@/lib/mock-data";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

type StatusPresentation = {
  label: string;
  variant: BadgeVariant;
  icon: React.ReactNode;
  /** Bare colour for dots rendered outside a badge. */
  dot: string;
};

/**
 * The four connection states from product.md §4.
 *
 * `revoked` and `invalid` are deliberately distinct: revoked means the user
 * pulled access and needs to reconnect, invalid means the credential itself is
 * malformed. They lead to different remediation, so they must not collapse into
 * one "error" colour.
 */
const CONNECTION: Record<ConnectionStatus, StatusPresentation> = {
  connected: {
    label: "Connected",
    variant: "success",
    icon: <CircleCheckIcon />,
    dot: "bg-success",
  },
  needs_reauth: {
    label: "Needs reauth",
    variant: "warning",
    icon: <AlertTriangleIcon />,
    dot: "bg-warning",
  },
  revoked: {
    label: "Revoked",
    variant: "destructive",
    icon: <BanIcon />,
    dot: "bg-destructive",
  },
  invalid: {
    label: "Invalid",
    variant: "muted",
    icon: <CircleSlashIcon />,
    dot: "bg-muted-foreground",
  },
};

const RESOURCE: Record<ResourceStatus, StatusPresentation> = {
  active: {
    label: "Active",
    variant: "success",
    icon: <CircleCheckIcon />,
    dot: "bg-success",
  },
  provisioning: {
    label: "Provisioning",
    variant: "info",
    icon: <LoaderIcon className="animate-spin" />,
    dot: "bg-info",
  },
  degraded: {
    label: "Degraded",
    variant: "warning",
    icon: <AlertTriangleIcon />,
    dot: "bg-warning",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircleIcon />,
    dot: "bg-destructive",
  },
};

const DEPLOY: Record<DeployStatus, StatusPresentation> = {
  succeeded: {
    label: "Succeeded",
    variant: "success",
    icon: <CircleCheckIcon />,
    dot: "bg-success",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircleIcon />,
    dot: "bg-destructive",
  },
  building: {
    label: "Building",
    variant: "info",
    icon: <LoaderIcon className="animate-spin" />,
    dot: "bg-info",
  },
  queued: {
    label: "Queued",
    variant: "muted",
    icon: <CircleDashedIcon />,
    dot: "bg-muted-foreground",
  },
};

const PROJECT: Record<ProjectStatus, StatusPresentation> = {
  live: {
    label: "Live",
    variant: "success",
    icon: <CircleCheckIcon />,
    dot: "bg-success",
  },
  attention: {
    label: "Needs attention",
    variant: "destructive",
    icon: <AlertTriangleIcon />,
    dot: "bg-destructive",
  },
  provisioning: {
    label: "Provisioning",
    variant: "info",
    icon: <LoaderIcon className="animate-spin" />,
    dot: "bg-info",
  },
  no_deploys: {
    label: "No deploys",
    variant: "muted",
    icon: <CircleDashedIcon />,
    dot: "bg-muted-foreground",
  },
};

export function connectionPresentation(status: ConnectionStatus) {
  return CONNECTION[status];
}

export function projectPresentation(status: ProjectStatus) {
  return PROJECT[status];
}

type StatusBadgeProps = {
  className?: string;
  /** Icon-free rendering, for dense rows where the dot carries the meaning. */
  hideIcon?: boolean;
} & (
  | { kind: "connection"; status: ConnectionStatus }
  | { kind: "resource"; status: ResourceStatus }
  | { kind: "deploy"; status: DeployStatus }
  | { kind: "project"; status: ProjectStatus }
);

export function StatusBadge({
  className,
  hideIcon,
  ...props
}: StatusBadgeProps) {
  const presentation =
    props.kind === "connection"
      ? CONNECTION[props.status]
      : props.kind === "resource"
        ? RESOURCE[props.status]
        : props.kind === "deploy"
          ? DEPLOY[props.status]
          : PROJECT[props.status];

  return (
    <Badge variant={presentation.variant} className={className}>
      {!hideIcon && presentation.icon}
      {presentation.label}
    </Badge>
  );
}

export function StatusDot({
  className,
  dot,
}: {
  className?: string;
  dot: string;
}) {
  return (
    <span className={cn("size-1.5 shrink-0 rounded-full", dot, className)} />
  );
}
