import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { Input } from "@/components/ui/input";

import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SocialButtons } from "@/components/features/auth/social-button";
import { PasswordInput } from "@/components/ui/password-input";
import { LoadingButton } from "@/components/ui/loading-button";

const fallback = "/";

const LoginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

type ILoginSchema = z.infer<typeof LoginSchema>;

export const Route = createFileRoute("/auth/login")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  component: RouteComponent,
  beforeLoad: async ({ search }) => {
    const { data } = await authClient.getSession();
    if (data?.session) {
      throw redirect({ to: search.redirect || fallback });
    }
  },
});

function RouteComponent() {
  const form = useForm<ILoginSchema>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: ILoginSchema) => {
    try {
      const res = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/",
        rememberMe: true,
      });

      if (res.error) throw new Error(res.error.message);

      toast.success("Logged In Successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={"flex flex-col gap-6"}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-bold text-2xl">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        <div className="gap-6 grid">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="gap-3 grid">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Link
              to="/auth/password/forgot"
              className="ml-auto text-sm hover:underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </div>
          <LoadingButton
            loading={form.formState.isLoading}
            type="submit"
            className="w-full"
          >
            Login
          </LoadingButton>
          <div className="after:top-1/2 after:z-0 after:absolute relative after:inset-0 after:flex after:items-center after:border-t after:border-border text-sm text-center">
            <span className="z-10 relative bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>

          <SocialButtons />
        </div>
        <div className="text-sm text-center">
          Don&apos;t have an account?{" "}
          <Link to="/auth/register" className="underline underline-offset-4">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  );
}
