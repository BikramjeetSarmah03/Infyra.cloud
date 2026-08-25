import {
  BoxIcon,
  CreditCardIcon,
  DatabaseIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  PlugZapIcon,
  RocketIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { connections, databases, deploys, projects } from "@/lib/mock-data";

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  badge?: number;
  items?: NavSubItem[];
  viewAllUrl?: string;
  viewAllLabel?: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

// Ungrouped — always first, no section label.
export const navTop: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: <LayoutDashboardIcon />,
    isActive: true,
  },
];

export const navGroups: NavGroup[] = [
  {
    label: "Infrastructure",
    items: [
      {
        title: "Projects",
        url: "/projects",
        icon: <BoxIcon />,
        badge: projects.length,
        // Recent projects pinned as children — agencies work on a few active
        // clients at a time, so deep-linking them saves the list→detail hop.
        items: projects.slice(0, 3).map((project) => ({
          title: project.name,
          url: `/projects/${project.slug}`,
        })),
        viewAllUrl: "/projects",
        viewAllLabel: "All projects",
      },
      {
        title: "Connectors",
        url: "/connectors",
        icon: <PlugZapIcon />,
        badge: connections.length,
      },
      {
        title: "Databases",
        url: "/databases",
        icon: <DatabaseIcon />,
        badge: databases.length,
      },
      {
        title: "Deployments",
        url: "/deployments",
        icon: <RocketIcon />,
        badge: deploys.length,
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        title: "Clients",
        url: "/clients",
        icon: <UsersIcon />,
        badge: 8,
      },
      {
        title: "Billing",
        url: "/billing",
        icon: <CreditCardIcon />,
      },
    ],
  },
];

export const navSecondary: NavItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: <Settings2Icon />,
  },
  {
    title: "Help",
    url: "/help",
    icon: <HelpCircleIcon />,
  },
];
