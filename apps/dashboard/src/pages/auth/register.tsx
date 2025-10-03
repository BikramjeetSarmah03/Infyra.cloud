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
import { LoadingButton } from "@/components/ui/loading-button";
import { SocialButtons } from "@/components/features/auth/social-button";
import { PasswordInput } from "@/components/ui/password-input";

const fallback = "/";

export const RegisterSchema = z.object({
  name: z.string().min(3, { error: "Please enter your name" }),
  email: z.email({ message: "Please enter a valid email" }),
  password: z.string({ message: "Please enter a password" }),
});

export type IRegisterSchema = z.infer<typeof RegisterSchema>;

export const Route = createFileRoute("/auth/register")({
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
  const naigate = Route.useNavigate();
  const form = useForm<IRegisterSchema>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: IRegisterSchema) => {
    try {
      const res = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/",
      });

      if (res.error) throw new Error(res.error.message);

      toast.success("Registered Successfully");
      naigate({ to: "/" });
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
          <h1 className="font-bold text-2xl">Regiter your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to register a new account
          </p>
        </div>
        <div className="gap-6 grid">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input placeholder="Email" type="email" {...field} />
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
          </div>
          <LoadingButton
            loading={form.formState.isLoading}
            type="submit"
            className="w-full"
          >
            Register
          </LoadingButton>
          <div className="after:top-1/2 after:z-0 after:absolute relative after:inset-0 after:flex after:items-center after:border-t after:border-border text-sm text-center">
            <span className="z-10 relative bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>

          <SocialButtons />
        </div>
        <div className="text-sm text-center">
          Already have an account?{" "}
          <Link to="/auth/login" className="underline underline-offset-4">
            Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
