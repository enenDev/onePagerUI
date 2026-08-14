import { useEffect } from "react";
import { Check, X } from "lucide-react";

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
  durationMs = 5000,
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
        "fixed bottom-24 left-1/2 z-50 flex w-max max-w-[min(92vw,48rem)] -translate-x-1/2 items-center gap-2.5 rounded-[24px] bg-[#E3FFE4] px-[18px] py-4 text-sm whitespace-nowrap text-[#1f2937] shadow-[0_0_4px_0_#7EA2F1]",
        className,
      )}
    >
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#119511]">
        <Check className="size-3 text-white" strokeWidth={3} />
      </span>
      <p className="min-w-0 overflow-hidden text-ellipsis">{message}</p>
      <button
        type="button"
        className="cursor-pointer rounded p-0.5 text-[#1f2937] hover:bg-black/10"
        aria-label="Dismiss"
        onClick={() => onOpenChange(false)}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
