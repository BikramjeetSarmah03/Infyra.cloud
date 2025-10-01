import type { LinkProps } from "@tanstack/react-router";
import {
  LayoutDashboardIcon,
  FolderKanbanIcon,
  AppWindowIcon,
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
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanbanIcon,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: AppWindowIcon,
  },
  // {
  //   title: "Databases",
  //   url: "/database",
  //   icon: DatabaseIcon,
  // },
  // {
  //   title: "Storage",
  //   url: "/storage",
  //   icon: HardDriveIcon,
  // },
  // {
  //   title: "Analytics",
  //   url: "/analytics",
  //   icon: BarChart3Icon,
  // },
];
