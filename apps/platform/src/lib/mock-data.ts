/**
 * Placeholder data for UI development.
 *
 * `apps/server` has no workspace/project/connection routes yet (build-plan.md
 * Phase 0-1), so these shapes stand in for them. They deliberately mirror the
 * normalized `resources` / `provider_connection` shapes in data-model.md so the
 * swap to real queries is a change to this file only, not to the pages.
 */

export type ProviderId =
  | "render"
  | "vercel"
  | "cloudflare"
  | "neon"
  | "supabase";

export type ProviderCategory = "deploy" | "database";

export type ConnectionStatus =
  | "connected"
  | "needs_reauth"
  | "revoked"
  | "invalid";

export type ResourceType = "web_service" | "static_site" | "database";

export type ResourceStatus = "active" | "provisioning" | "degraded" | "failed";

export type DeployStatus = "succeeded" | "failed" | "building" | "queued";

export type ProjectStatus =
  | "live"
  | "attention"
  | "provisioning"
  | "no_deploys";

export type ProviderMeta = {
  id: ProviderId;
  name: string;
  category: ProviderCategory;
  authType: "oauth" | "api_key";
  tagline: string;
};

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  render: {
    id: "render",
    name: "Render",
    category: "deploy",
    authType: "api_key",
    tagline: "Services, static sites, Postgres",
  },
  vercel: {
    id: "vercel",
    name: "Vercel",
    category: "deploy",
    authType: "oauth",
    tagline: "Frontend hosting, preview deploys",
  },
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare",
    category: "deploy",
    authType: "api_key",
    tagline: "Pages, Workers, D1, R2",
  },
  neon: {
    id: "neon",
    name: "Neon",
    category: "database",
    authType: "oauth",
    tagline: "Serverless Postgres with branching",
  },
  supabase: {
    id: "supabase",
    name: "Supabase",
    category: "database",
    authType: "oauth",
    tagline: "Postgres with auth and storage",
  },
};

export type Connection = {
  id: string;
  providerId: ProviderId;
  label: string;
  status: ConnectionStatus;
  /** Provider-side account scope — Render ownerId, Vercel teamId, etc. */
  accountScope: string | null;
  resourceCount: number;
  lastCheckedAt: string;
  /** Only set where the provider exposes an expiry (Cloudflare tokens, PATs). */
  expiresAt: string | null;
};

export const connections: Connection[] = [
  {
    id: "conn_render_main",
    providerId: "render",
    label: "Main account",
    status: "connected",
    accountScope: "Acme Digital",
    resourceCount: 14,
    lastCheckedAt: "2m ago",
    expiresAt: null,
  },
  {
    id: "conn_vercel_team",
    providerId: "vercel",
    label: "Acme team",
    status: "connected",
    accountScope: "team_acme",
    resourceCount: 7,
    lastCheckedAt: "4m ago",
    expiresAt: null,
  },
  {
    id: "conn_neon_client",
    providerId: "neon",
    label: "Client tier",
    status: "connected",
    accountScope: null,
    resourceCount: 8,
    lastCheckedAt: "4m ago",
    expiresAt: null,
  },
  {
    id: "conn_neon_personal",
    providerId: "neon",
    label: "Personal",
    status: "needs_reauth",
    accountScope: null,
    resourceCount: 6,
    lastCheckedAt: "1d ago",
    expiresAt: null,
  },
  {
    id: "conn_cloudflare_main",
    providerId: "cloudflare",
    label: "Acme DNS + Pages",
    status: "connected",
    accountScope: "a1b2c3d4",
    resourceCount: 3,
    lastCheckedAt: "11m ago",
    expiresAt: "in 24 days",
  },
  {
    id: "conn_supabase_legacy",
    providerId: "supabase",
    label: "Legacy projects",
    status: "revoked",
    accountScope: "acme-org",
    resourceCount: 2,
    lastCheckedAt: "3d ago",
    expiresAt: null,
  },
];

export type Resource = {
  id: string;
  name: string;
  type: ResourceType;
  providerId: ProviderId;
  status: ResourceStatus;
  region: string;
};

export type Deploy = {
  id: string;
  status: DeployStatus;
  commit: string;
  branch: string;
  message: string;
  triggeredBy: string;
  duration: string;
  createdAt: string;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  client: string;
  repo: string;
  status: ProjectStatus;
  domain: string | null;
  resources: Resource[];
  deploys: Deploy[];
  lastDeployAt: string;
};

export const projects: Project[] = [
  {
    id: "prj_northwind",
    slug: "northwind-site",
    name: "Northwind Site",
    client: "Northwind Traders",
    repo: "acme/northwind",
    status: "live",
    domain: "northwind.com",
    lastDeployAt: "4m ago",
    resources: [
      {
        id: "res_nw_web",
        name: "northwind-web",
        type: "web_service",
        providerId: "render",
        status: "active",
        region: "Oregon",
      },
      {
        id: "res_nw_db",
        name: "northwind-db",
        type: "database",
        providerId: "neon",
        status: "active",
        region: "aws-us-east-2",
      },
    ],
    deploys: [
      {
        id: "dep_1",
        status: "succeeded",
        commit: "a3f21c9",
        branch: "main",
        message: "fix: nav overflow on mobile",
        triggeredBy: "Bikram",
        duration: "1m 12s",
        createdAt: "4m ago",
      },
      {
        id: "dep_2",
        status: "succeeded",
        commit: "7b1e004",
        branch: "main",
        message: "chore: bump deps",
        triggeredBy: "webhook",
        duration: "1m 30s",
        createdAt: "5h ago",
      },
      {
        id: "dep_3",
        status: "failed",
        commit: "c9d8a12",
        branch: "main",
        message: "feat: checkout flow",
        triggeredBy: "webhook",
        duration: "48s",
        createdAt: "1d ago",
      },
    ],
  },
  {
    id: "prj_contoso",
    slug: "contoso-landing",
    name: "Contoso Landing",
    client: "Contoso Ltd",
    repo: "acme/contoso-landing",
    status: "attention",
    domain: "contoso.io",
    lastDeployAt: "2h ago",
    resources: [
      {
        id: "res_ct_web",
        name: "contoso-landing",
        type: "static_site",
        providerId: "vercel",
        status: "degraded",
        region: "iad1",
      },
    ],
    deploys: [
      {
        id: "dep_4",
        status: "failed",
        commit: "c9d8a12",
        branch: "main",
        message: "feat: pricing section",
        triggeredBy: "webhook",
        duration: "48s",
        createdAt: "2h ago",
      },
    ],
  },
  {
    id: "prj_fabrikam",
    slug: "fabrikam-api",
    name: "Fabrikam API",
    client: "Fabrikam Inc",
    repo: "acme/fabrikam-api",
    status: "live",
    domain: "api.fabrikam.dev",
    lastDeployAt: "22m ago",
    resources: [
      {
        id: "res_fb_web",
        name: "fabrikam-api",
        type: "web_service",
        providerId: "render",
        status: "active",
        region: "Frankfurt",
      },
      {
        id: "res_fb_db",
        name: "fabrikam-db",
        type: "database",
        providerId: "supabase",
        status: "active",
        region: "eu-central-1",
      },
    ],
    deploys: [
      {
        id: "dep_5",
        status: "succeeded",
        commit: "9d2c118",
        branch: "main",
        message: "feat: rate limiting",
        triggeredBy: "webhook",
        duration: "2m 04s",
        createdAt: "22m ago",
      },
    ],
  },
  {
    id: "prj_tailspin",
    slug: "tailspin-docs",
    name: "Tailspin Docs",
    client: "Tailspin Toys",
    repo: "acme/tailspin-docs",
    status: "provisioning",
    domain: null,
    lastDeployAt: "—",
    resources: [
      {
        id: "res_ts_web",
        name: "tailspin-docs",
        type: "static_site",
        providerId: "cloudflare",
        status: "provisioning",
        region: "global",
      },
    ],
    deploys: [],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}
