import { createFileRoute } from "@tanstack/react-router";
import {
  MoreVertical,
  Plus,
  CheckCircle,
  Database,
  Package,
  ExternalLink,
  Activity,
  Server,
  Folder,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/(protected)/projects/$project/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { project } = Route.useParams();

  console.log({ project });

  return (
    <div className="space-y-4">
      {/* Header */}
      <ProjectHeader />

      {/* Quick Stats Cards */}
      <QuickStats />

      <div className="gap-4 grid md:grid-cols-3 grid-col-1">
        <ResourceTables />

        <RecentActivity />
      </div>
    </div>
  );
}

function ProjectHeader() {
  return (
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <h1 className="font-bold text-2xl">Project A</h1>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>Domain: ims.infyra.cloud</span>
          <span>•</span>
          <span>Owner: Bikramjeet</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
            Project Settings
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Manage Team</DropdownMenuItem>
          <DropdownMenuItem>View Logs</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function QuickStats() {
  const stats = [
    { label: "Apps", count: 3, status: "active", icon: Server },
    { label: "DBs", count: 2, status: "active", icon: Database },
    { label: "Buckets", count: 1, status: "active", icon: Folder },
  ];

  return (
    <div className="gap-4 grid sm:grid-cols-3 grid-col-1">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{stat.label}:</span>
              <span className="font-bold">{stat.count}</span>
              <div
                className={`w-2 h-2 rounded-full ${stat.status === "active" ? "bg-green-500" : "bg-gray-400"}`}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="w-3 h-3" />
            New {stat.label.slice(0, -1)}
          </Button>
        </div>
      ))}
    </div>
  );
}

function RecentActivity() {
  const activities = [
    {
      type: "deploy",
      message: "Deployed `my-app` (commit 23fa9c)",
      time: "2h ago",
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    {
      type: "database",
      message: "DB migration applied `users-db`",
      time: "6h ago",
      icon: Database,
      iconColor: "text-blue-500",
    },
    {
      type: "storage",
      message: "New bucket `logs-bucket` created",
      time: "1d ago",
      icon: Package,
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="grid-cols-1 bg-card p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" />
        <h2 className="font-semibold text-lg">Recent Activity</h2>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index.toString()} className="flex items-center gap-3">
            <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
            <span className="text-sm">{activity.message}</span>
            <span className="ml-auto text-muted-foreground text-xs">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResourceTables() {
  return (
    <Tabs
      defaultValue="apps"
      className="col-span-2 bg-sidebar border rounded-md w-full"
    >
      <TabsList className="gap-4 grid grid-cols-3 w-full">
        <TabsTrigger value="apps" className="w-full">
          Applications
        </TabsTrigger>
        <TabsTrigger value="bucket" className="w-full">
          Buckets
        </TabsTrigger>
        <TabsTrigger value="db" className="w-full">
          Databases
        </TabsTrigger>
      </TabsList>
      <TabsContent value="apps">
        <ApplicationsTable />
      </TabsContent>
      <TabsContent value="bucket">
        <BucketsTable />
      </TabsContent>
      <TabsContent value="db">
        <DatabasesTable />
      </TabsContent>
    </Tabs>
  );
}

function ApplicationsTable() {
  const apps = [
    {
      name: "my-app",
      domain: "my-app.infyra.cloud",
      provider: "AWS",
      status: "Active",
    },
    {
      name: "blog-site",
      domain: "blog.infyra.cloud",
      provider: "Infyra",
      status: "Active",
    },
    {
      name: "analytics",
      domain: "analytics.infyra.cloud",
      provider: "GCP",
      status: "Pending",
    },
  ];

  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-2 font-medium text-left">App Name</th>
            <th className="py-2 font-medium text-left">Domain</th>
            <th className="py-2 font-medium text-left">Provider</th>
            <th className="py-2 font-medium text-left">Status</th>
            <th className="py-2 font-medium text-left"></th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr
              key={app.name}
              className="hover:bg-muted/50 border-b cursor-pointer"
            >
              <td className="py-3 font-medium">{app.name}</td>
              <td className="py-3">
                <div className="flex items-center gap-1">
                  {app.domain}
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
              </td>
              <td className="py-3">{app.provider}</td>
              <td className="py-3">
                <Badge
                  variant={app.status === "Active" ? "default" : "secondary"}
                >
                  {app.status}
                </Badge>
              </td>
              <td className="py-3">
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DatabasesTable() {
  const databases = [
    {
      name: "users-db",
      type: "Postgres",
      region: "us-east1",
      status: "Active",
    },
    { name: "cache-db", type: "Redis", region: "asia-s1", status: "Active" },
  ];

  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-2 font-medium text-left">DB Name</th>
            <th className="py-2 font-medium text-left">Type</th>
            <th className="py-2 font-medium text-left">Region</th>
            <th className="py-2 font-medium text-left">Status</th>
            <th className="py-2 font-medium text-left"></th>
          </tr>
        </thead>
        <tbody>
          {databases.map((db) => (
            <tr
              key={db.name}
              className="hover:bg-muted/50 border-b cursor-pointer"
            >
              <td className="py-3 font-medium">{db.name}</td>
              <td className="py-3">{db.type}</td>
              <td className="py-3">{db.region}</td>
              <td className="py-3">
                <Badge variant="default">{db.status}</Badge>
              </td>
              <td className="py-3">
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BucketsTable() {
  const buckets = [
    { name: "logs-bucket", region: "asia-s1", files: 1200, status: "Active" },
    { name: "media-bucket", region: "us-east1", files: 542, status: "Active" },
  ];

  return (
    <div className="p-4 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="py-2 font-medium text-left">Bucket Name</th>
            <th className="py-2 font-medium text-left">Region</th>
            <th className="py-2 font-medium text-left">Files</th>
            <th className="py-2 font-medium text-left">Status</th>
            <th className="py-2 font-medium text-left"></th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr
              key={bucket.name}
              className="hover:bg-muted/50 border-b cursor-pointer"
            >
              <td className="py-3 font-medium">{bucket.name}</td>
              <td className="py-3">{bucket.region}</td>
              <td className="py-3">{bucket.files.toLocaleString()}</td>
              <td className="py-3">
                <Badge variant="default">{bucket.status}</Badge>
              </td>
              <td className="py-3">
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
