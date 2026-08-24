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

export const workspaces = [
  {
    name: "My Agency",
    logo: <BoxIcon />,
    plan: "Free",
  },
];

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
        badge: 12,
        items: [
          { title: "Northwind Site", url: "/projects/northwind-site" },
          { title: "Contoso Landing", url: "/projects/contoso-landing" },
          { title: "Fabrikam API", url: "/projects/fabrikam-api" },
        ],
        viewAllUrl: "/projects",
        viewAllLabel: "All projects",
      },
      {
        title: "Connections",
        url: "/connections",
        icon: <PlugZapIcon />,
        badge: 5,
      },
      {
        title: "Databases",
        url: "/databases",
        icon: <DatabaseIcon />,
      },
      {
        title: "Deployments",
        url: "/deployments",
        icon: <RocketIcon />,
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
