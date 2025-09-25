import type { LinkProps } from "@tanstack/react-router";
import {
  CloudUploadIcon,
  ComputerIcon,
  FoldersIcon,
  GlobeIcon,
  LayoutDashboardIcon,
  TrendingUpIcon,
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
    title: "Deployments",
    url: "/deployments",
    icon: CloudUploadIcon,
  },
  {
    title: "Domains",
    url: "/domains",
    icon: GlobeIcon,
  },
  {
    title: "Anaytics",
    url: "/analytics",
    icon: TrendingUpIcon,
  },
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
];
