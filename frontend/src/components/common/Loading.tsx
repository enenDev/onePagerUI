import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type LoadingProps = {
  label?: string;
  className?: string;
};

/** Shared inline loading state for list/submit and future screens. */
export function Loading({
  label = "Loading…",
  className,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
