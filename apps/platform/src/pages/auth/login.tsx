import { Button } from "@infyra/ui/components/button";
import { Input } from "@infyra/ui/components/input";
import { Label } from "@infyra/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";
import { authSessionKey, useAuthSession } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate({ from: "/auth/login" });
	const queryClient = useQueryClient();
	const { isPending } = useAuthSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: ({ data }) => {
						queryClient.setQueryData(authSessionKey, data);
						navigate({ to: "/" });
						toast.success("Sign in successful");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col gap-6"
		>
			<div className="flex flex-col items-center gap-1 text-center">
				<h1 className="font-bold text-2xl">Login to your account</h1>
				<p className="text-balance text-muted-foreground text-sm">
					Enter your email below to login to your account
				</p>
			</div>

			<form.Field name="email">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>Email</Label>
						<Input
							id={field.name}
							name={field.name}
							type="email"
							placeholder="m@example.com"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-sm">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Field name="password">
				{(field) => (
					<div className="space-y-2">
						<div className="flex items-center">
							<Label htmlFor={field.name}>Password</Label>
						</div>
						<Input
							id={field.name}
							name={field.name}
							type="password"
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
						{field.state.meta.errors.map((error) => (
							<p key={error?.message} className="text-destructive text-sm">
								{error?.message}
							</p>
						))}
					</div>
				)}
			</form.Field>

			<form.Subscribe
				selector={(state) => ({
					canSubmit: state.canSubmit,
					isSubmitting: state.isSubmitting,
				})}
			>
				{({ canSubmit, isSubmitting }) => (
					<Button
						type="submit"
						className="w-full"
						disabled={!canSubmit || isSubmitting}
					>
						{isSubmitting ? "Signing in..." : "Login"}
					</Button>
				)}
			</form.Subscribe>

			<p className="text-center text-muted-foreground text-sm">
				Don&apos;t have an account?{" "}
				<Link to="/auth/register" className="underline underline-offset-4">
					Sign up
				</Link>
			</p>
		</form>
	);
}
