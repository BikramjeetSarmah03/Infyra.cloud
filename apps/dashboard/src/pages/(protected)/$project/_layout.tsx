import { cn } from "@/lib/utils";
import {
  createFileRoute,
  Link,
  Outlet,
  type LinkProps,
} from "@tanstack/react-router";

interface IProjectNavItem {
  title: string;
  url: LinkProps["to"];
  params: LinkProps["params"];
}

export const Route = createFileRoute("/(protected)/$project")({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();

  const ProjectNavItems: IProjectNavItem[] = [
    {
      title: "Overview",
      url: "/$project",
      params,
    },
    {
      title: "Deployments",
      url: "/$project/deployments",
      params,
    },
    {
      title: "Analytics",
      url: "/$project/analytics",
      params,
    },
    {
      title: "Logs",
      url: "/$project/logs",
      params,
    },
    {
      title: "Settings",
      url: "/$project/settings",
      params,
    },
  ];

  return (
    <section className="h-full">
      <nav className="space-x-8 bg-muted px-4 py-2">
        {ProjectNavItems.map((item) => {
          return (
            <Link
              key={item.title}
              to={item.url}
              params={item.params}
              className={cn("group relative pb-1.5 border-primary")}
            >
              {item.title}

              <span className="-bottom-1 left-0 absolute bg-primary w-0 group-hover:w-full h-0.5 transition-all duration-300" />
            </Link>
          );
        })}
      </nav>

      <section className="p-4">
        <Outlet />
      </section>
    </section>
  );
}
