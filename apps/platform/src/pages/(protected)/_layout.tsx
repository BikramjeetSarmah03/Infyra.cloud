import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import Header from "@/components/header";
import { authSessionQueryOptions } from "@/lib/auth-session";

export const Route = createFileRoute("/(protected)")({
	component: ProtectedLayout,
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(
			authSessionQueryOptions,
		);
		if (!session) {
			throw redirect({ to: "/auth/login" });
		}
		return { session };
	},
});

function ProtectedLayout() {
	return (
		<div className="grid h-svh grid-rows-[auto_1fr]">
			<Header />
			<Outlet />
		</div>
	);
}
