import type { LinkProps } from "@tanstack/react-router";
import {
  ComputerIcon,
  DatabaseIcon,
  FoldersIcon,
  LayoutDashboardIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: LinkProps["to"];
  icon: LucideIcon;
  divider?: boolean;
}

export const MainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboardIcon,
  },
  // {
  //   title: "Deployments",
  //   url: "/deployments",
  //   icon: CloudUploadIcon,
  // },

  // {
  //   title: "Anaytics",
  //   url: "/analytics",
  //   icon: TrendingUpIcon,
  // },
  {
    title: "VM",
    url: "/vm",
    icon: ComputerIcon,
  },
  {
    title: "Storage",
    url: "/storage",
    icon: FoldersIcon,
  },
  {
    title: "Database",
    url: "/database",
    icon: DatabaseIcon,
  },
  // {
  //   title: "Domains",
  //   url: "/domains",
  //   icon: GlobeIcon,
  // },
];
