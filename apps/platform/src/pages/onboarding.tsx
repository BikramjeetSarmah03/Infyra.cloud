import { Button } from "@infyra/ui/components/button";
import { Input } from "@infyra/ui/components/input";
import { Label } from "@infyra/ui/components/label";
import { cn } from "@infyra/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingIcon,
  Loader2Icon,
  PlusIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import z from "zod";

import { type Step, Stepper } from "@/components/onboarding/stepper";
import { authClient } from "@/lib/auth-client";
import { authSessionKey, authSessionQueryOptions } from "@/lib/auth-session";
import {
  activeOrganizationKey,
  activeOrganizationQueryOptions,
} from "@/lib/use-active-organization";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      authSessionQueryOptions,
    );
    if (!session) {
      throw redirect({ to: "/auth/login" });
    }

    // Already onboarded — never let a completed user back into the flow.
    const organization = await context.queryClient.ensureQueryData(
      activeOrganizationQueryOptions,
    );
    if (organization) {
      throw redirect({ to: "/" });
    }
  },
});

const STEPS: Step[] = [
  {
    id: "workspace",
    title: "Workspace",
    description: "Name your agency",
    icon: <BuildingIcon />,
  },
  {
    id: "profile",
    title: "About you",
    description: "How you work",
    icon: <UserIcon />,
  },
  {
    id: "team",
    title: "Invite team",
    description: "Optional",
    icon: <UsersIcon />,
  },
];

const ROLES = [
  { id: "agency", label: "Agency", hint: "I manage client projects" },
  { id: "freelance", label: "Freelancer", hint: "I ship solo" },
  { id: "team", label: "Product team", hint: "We run our own product" },
] as const;

/** Mirrors better-auth's slug rules: lowercase, alphanumeric, dash-separated. */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);

  const [workspace, setWorkspace] = React.useState("");
  const [role, setRole] = React.useState<string>("agency");
  const [invites, setInvites] = React.useState<string[]>([""]);
  const [error, setError] = React.useState<string | null>(null);

  const slug = slugify(workspace);

  function goNext() {
    if (step === 0) {
      const parsed = z
        .string()
        .min(2, "Workspace name must be at least 2 characters")
        .safeParse(workspace.trim());
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid name");
        return;
      }
      if (!slug) {
        setError("Use at least one letter or number");
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  /**
   * Creates the workspace, then sends any invites. Invite failures are
   * surfaced but never block completion — the org already exists by then and
   * bouncing the user back would strand them outside the app.
   */
  async function finish() {
    setSubmitting(true);
    setError(null);

    const { data, error: createError } = await authClient.organization.create({
      name: workspace.trim(),
      slug,
      metadata: { role },
    });

    if (createError || !data) {
      setSubmitting(false);
      const message = createError?.message ?? "Could not create workspace";
      setError(
        message.toLowerCase().includes("slug")
          ? "That workspace URL is taken. Try a different name."
          : message,
      );
      return;
    }

    // create() does not activate the org, and every scoped request reads
    // session.activeOrganizationId — so this call is what unblocks the app.
    await authClient.organization.setActive({ organizationId: data.id });

    const emails = invites.map((e) => e.trim()).filter(Boolean);
    const failed: string[] = [];
    for (const email of emails) {
      const { error: inviteError } = await authClient.organization.inviteMember(
        {
          email,
          role: "member",
        },
      );
      if (inviteError) failed.push(email);
    }

    // Refetch and await the result rather than only invalidating: the
    // protected layout's beforeLoad reads this cache via ensureQueryData, so
    // navigating before the new value has landed bounces straight back here.
    await Promise.all([
      queryClient.refetchQueries({ queryKey: activeOrganizationKey }),
      queryClient.refetchQueries({ queryKey: authSessionKey }),
    ]);

    setSubmitting(false);

    if (failed.length) {
      toast.warning(`Workspace ready. Could not invite: ${failed.join(", ")}`);
    } else {
      toast.success("Workspace ready");
    }

    await navigate({ to: "/" });
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6">
      <div className="grid w-full max-w-4xl gap-10 rounded-xl border bg-background p-8 shadow-sm md:grid-cols-[240px_1fr] md:p-10">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-semibold text-lg">Set up Infyra</h1>
            <p className="text-muted-foreground text-sm">
              A couple of details and you're in.
            </p>
          </div>
          <Stepper steps={STEPS} current={step} />
        </div>

        <div className="flex flex-col">
          <div className="flex-1">
            {step === 0 && (
              <section className="flex flex-col gap-4">
                <header>
                  <h2 className="font-medium text-base">Name your workspace</h2>
                  <p className="text-muted-foreground text-sm">
                    Usually your agency or company name.
                  </p>
                </header>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="workspace">Workspace name</Label>
                  <Input
                    id="workspace"
                    autoFocus
                    value={workspace}
                    placeholder="Acme Studio"
                    onChange={(e) => setWorkspace(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                  />
                  {slug && (
                    <p className="text-muted-foreground text-xs">
                      URL: <span className="font-mono">{slug}</span>
                    </p>
                  )}
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="flex flex-col gap-4">
                <header>
                  <h2 className="font-medium text-base">How do you work?</h2>
                  <p className="text-muted-foreground text-sm">
                    We use this to tailor defaults. You can change it later.
                  </p>
                </header>
                <div className="flex flex-col gap-2">
                  {ROLES.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRole(option.id)}
                      className={cn(
                        "flex flex-col items-start rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                        role === option.id
                          ? "border-primary bg-accent"
                          : "border-border",
                      )}
                    >
                      <span className="font-medium text-sm">
                        {option.label}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {option.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="flex flex-col gap-4">
                <header>
                  <h2 className="font-medium text-base">Invite your team</h2>
                  <p className="text-muted-foreground text-sm">
                    Optional — you can do this any time from settings.
                  </p>
                </header>
                <div className="flex flex-col gap-2">
                  {invites.map((email, index) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
                      key={index}
                      className="flex items-center gap-2"
                    >
                      <Input
                        type="email"
                        value={email}
                        placeholder="teammate@agency.com"
                        onChange={(e) =>
                          setInvites((prev) =>
                            prev.map((v, i) =>
                              i === index ? e.target.value : v,
                            ),
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={`Remove ${email || "invite"}`}
                        // Keep one row on screen so the step never renders
                        // empty; clearing it is the way to "remove" the last.
                        disabled={invites.length === 1 && !email}
                        onClick={() =>
                          setInvites((prev) =>
                            prev.length === 1
                              ? [""]
                              : prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() => setInvites((prev) => [...prev, ""])}
                  >
                    <PlusIcon className="size-4" />
                    Add another
                  </Button>
                </div>
              </section>
            )}

            {error && <p className="mt-4 text-destructive text-sm">{error}</p>}
          </div>

          <footer className="mt-8 flex items-center justify-between border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={step === 0 || submitting}
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {isLast && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={finish}
                  disabled={submitting}
                >
                  Skip
                </Button>
              )}
              <Button
                type="button"
                onClick={isLast ? finish : goNext}
                disabled={submitting}
              >
                {submitting && <Loader2Icon className="size-4 animate-spin" />}
                {isLast ? "Finish" : "Continue"}
                {!isLast && <ArrowRightIcon className="size-4" />}
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
