import {
	BoxIcon,
	CreditCardIcon,
	LayoutDashboardIcon,
	PlugZapIcon,
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

export const navMain = [
	{
		title: "Dashboard",
		url: "/",
		icon: <LayoutDashboardIcon />,
		isActive: true,
	},
	{
		title: "Projects",
		url: "/projects",
		icon: <BoxIcon />,
	},
	{
		title: "Connections",
		url: "/connections",
		icon: <PlugZapIcon />,
	},
	{
		title: "Clients",
		url: "/clients",
		icon: <UsersIcon />,
	},
];

export const navSecondary = [
	{
		title: "Billing",
		url: "/billing",
		icon: <CreditCardIcon />,
	},
	{
		title: "Settings",
		url: "/settings",
		icon: <Settings2Icon />,
	},
];
