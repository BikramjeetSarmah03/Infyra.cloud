import { cn } from "@infyra/ui/lib/utils";
import { CheckIcon } from "lucide-react";

export type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

/**
 * Vertical step rail. Purely presentational — the parent owns which step is
 * current, so the rail can also be rendered from a resumed/partial state.
 */
export function Stepper({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step, index) => {
        const isComplete = index < current;
        const isCurrent = index === current;

        return (
          <li key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isComplete &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete &&
                    !isCurrent &&
                    "border-border text-muted-foreground",
                )}
              >
                {isComplete ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <span className="[&_svg]:size-4">{step.icon}</span>
                )}
              </span>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    "my-1 w-px flex-1 transition-colors",
                    isComplete ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>

            <div className={cn("pb-8", index === steps.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "font-medium text-sm leading-9 transition-colors",
                  isCurrent || isComplete
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              <p className="text-muted-foreground text-xs">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
