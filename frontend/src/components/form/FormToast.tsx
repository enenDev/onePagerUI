import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

import { cn } from "@/lib/utils";

type FormToastProps = {
  open: boolean;
  message: string;
  onOpenChange: (open: boolean) => void;
  durationMs?: number;
  className?: string;
};

/** Lightweight success toast — no extra dependency; replace with sonner later if needed. */
// TODO: Optional polish — replace with shadcn/sonner (or design-system toast) for stacking,
// variants (error/success), and shared app-wide usage beyond the national form.
export function FormToast({
  open,
  message,
  onOpenChange,
  durationMs = 3200,
  className,
}: FormToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => onOpenChange(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onOpenChange, message]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed right-4 bottom-24 z-50 flex max-w-sm items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 shadow-md",
        className,
      )}
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
      <p className="flex-1 leading-snug">{message}</p>
      <button
        type="button"
        className="cursor-pointer rounded p-0.5 text-emerald-700 hover:bg-emerald-100"
        aria-label="Dismiss"
        onClick={() => onOpenChange(false)}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
