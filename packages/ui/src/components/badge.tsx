import { cn } from "@infyra/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-none px-2 py-0.5 font-medium text-[11px] leading-normal [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "text-foreground ring-1 ring-foreground/15",
        success: "bg-success-muted text-success ring-1 ring-success/25",
        warning: "bg-warning-muted text-warning ring-1 ring-warning/25",
        info: "bg-info-muted text-info ring-1 ring-info/25",
        destructive:
          "bg-destructive-muted text-destructive ring-1 ring-destructive/25",
        muted: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
