import { cn } from "@infyra/ui/lib/utils";
import type { ProviderId } from "@/lib/mock-data";

/**
 * Provider identity is never hidden (build-plan.md §5, principle 2) — the
 * agency holds the real account relationship with these providers, so every
 * resource must say where it actually lives.
 */
const PROVIDER_STYLES: Record<ProviderId, { mark: string; initials: string }> =
  {
    render: { mark: "bg-[#4f46e5] text-white", initials: "Rn" },
    vercel: { mark: "bg-foreground text-background", initials: "▲" },
    cloudflare: { mark: "bg-[#f38020] text-white", initials: "CF" },
    neon: { mark: "bg-[#00e599] text-black", initials: "Ne" },
    supabase: { mark: "bg-[#3ecf8e] text-black", initials: "Sb" },
  };

export function ProviderMark({
  providerId,
  className,
  size = "sm",
}: {
  providerId: ProviderId;
  className?: string;
  size?: "sm" | "md";
}) {
  const style = PROVIDER_STYLES[providerId];

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold",
        size === "sm" ? "size-4 text-[9px]" : "size-8 text-[12px]",
        style.mark,
        className,
      )}
    >
      {style.initials}
    </span>
  );
}
