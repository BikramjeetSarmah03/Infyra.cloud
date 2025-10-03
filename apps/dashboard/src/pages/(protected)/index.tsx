import { createFileRoute } from "@tanstack/react-router";
import {
  Server,
  Database,
  HardDrive,
  CreditCard,
  TrendingUp,
  Activity,
  CheckCircle,
  Package,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DashboardChart } from "@/components/demo/dashboard-chart";

export const Route = createFileRoute("/(protected)/")({
  component: App,
});

function App() {
  return (
    <div className="flex flex-col flex-1 gap-4 p-4">
      {/* Upper 4 Column Cards */}
      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Apps"
          value="12"
          change="+2 this month"
          icon={Server}
          trend="up"
        />
        <StatsCard
          title="Databases"
          value="8"
          change="+1 this week"
          icon={Database}
          trend="up"
        />
        <StatsCard
          title="Storage"
          value="2.4 TB"
          change="+180 GB this month"
          icon={HardDrive}
          trend="up"
        />
        <StatsCard
          title="Monthly Bill"
          value="$247.50"
          change="-$12.30 vs last month"
          icon={CreditCard}
          trend="down"
        />
      </div>

      {/* Mid 2 Column Cards */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-3 h-full">
        {/* Left Column - Analytics & Resource Table */}
        <div className="space-y-4 col-span-2">
          <AnalyticsCard />
          <ResourceTable />
        </div>

        {/* Right Column - Recent Activities */}
        <RecentActivitiesCard />
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  trend: "up" | "down";
}) {
  return (
    <div className="bg-sidebar p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="font-bold text-2xl">{value}</p>
          <p
            className={`text-xs flex items-center gap-1 ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp
              className={`h-3 w-3 ${trend === "down" ? "rotate-180" : ""}`}
            />
            {change}
          </p>
        </div>
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
    </div>
  );
}

function AnalyticsCard() {
  return (
    <div className="bg-sidebar p-4 border rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Analytics</h3>
        <Select defaultValue="apps">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apps">Apps</SelectItem>
            <SelectItem value="databases">Databases</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DashboardChart />
    </div>
  );
}

function ResourceTable() {
  return (
    <div className="bg-sidebar p-4 border rounded-md">
      <Tabs defaultValue="apps" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="apps">Apps</TabsTrigger>
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="mt-4">
          <div className="space-y-3">
            <ResourceRow name="my-app" status="Active" type="Web App" />
            <ResourceRow name="api-service" status="Active" type="API" />
            <ResourceRow name="worker-app" status="Pending" type="Worker" />
          </div>
        </TabsContent>

        <TabsContent value="databases" className="mt-4">
          <div className="space-y-3">
            <ResourceRow name="users-db" status="Active" type="PostgreSQL" />
            <ResourceRow name="cache-db" status="Active" type="Redis" />
            <ResourceRow
              name="analytics-db"
              status="Maintenance"
              type="MongoDB"
            />
          </div>
        </TabsContent>

        <TabsContent value="storage" className="mt-4">
          <div className="space-y-3">
            <ResourceRow name="media-bucket" status="Active" type="S3 Bucket" />
            <ResourceRow name="logs-bucket" status="Active" type="S3 Bucket" />
            <ResourceRow
              name="backup-storage"
              status="Active"
              type="Block Storage"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResourceRow({
  name,
  status,
  type,
}: {
  name: string;
  status: string;
  type: string;
}) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "maintenance":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="flex justify-between items-center bg-sidebar-accent p-3 border rounded-md">
      <div className="space-y-1">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-muted-foreground text-xs">{type}</p>
      </div>
      <Badge variant={getStatusColor(status)}>{status}</Badge>
    </div>
  );
}

function RecentActivitiesCard() {
  const activities = [
    {
      type: "deploy",
      message: "Deployed my-app to production",
      time: "2 minutes ago",
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
    {
      type: "database",
      message: "Database backup completed for users-db",
      time: "15 minutes ago",
      icon: Database,
      iconColor: "text-blue-500",
    },
    {
      type: "storage",
      message: "New files uploaded to media-bucket",
      time: "1 hour ago",
      icon: Package,
      iconColor: "text-purple-500",
    },
    {
      type: "function",
      message: "Function execution completed",
      time: "2 hours ago",
      icon: Zap,
      iconColor: "text-yellow-500",
    },
    {
      type: "deploy",
      message: "Rollback initiated for api-service",
      time: "3 hours ago",
      icon: Activity,
      iconColor: "text-orange-500",
    },
    {
      type: "database",
      message: "Migration applied to analytics-db",
      time: "5 hours ago",
      icon: Database,
      iconColor: "text-blue-500",
    },
    {
      type: "storage",
      message: "Storage quota increased",
      time: "1 day ago",
      icon: HardDrive,
      iconColor: "text-gray-500",
    },
    {
      type: "deploy",
      message: "New version deployed to staging",
      time: "1 day ago",
      icon: CheckCircle,
      iconColor: "text-green-500",
    },
  ];

  return (
    <div className="bg-sidebar p-4 border rounded-md">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Recent Activities</h3>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={index.toString()}
            className="flex items-start gap-3 bg-sidebar-accent p-3 border rounded-md"
          >
            <activity.icon className={`h-4 w-4 mt-0.5 ${activity.iconColor}`} />
            <div className="flex-1 space-y-1">
              <p className="text-sm">{activity.message}</p>
              <p className="text-muted-foreground text-xs">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
