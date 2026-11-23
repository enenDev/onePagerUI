import { useState, type KeyboardEvent } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TrackRagStatus } from "@/services/trackApi";
import { cn } from "@/lib/utils";

const OWNER_TOOLTIP = "Only the owner can update status";

const OPTIONS: {
  value: TrackRagStatus;
  label: string;
  dot: string;
  text: string;
}[] = [
  { value: "clear", label: "Clear", dot: "bg-slate-400", text: "text-slate-600" },
  { value: "red", label: "Red", dot: "bg-red-500", text: "text-red-600" },
  { value: "amber", label: "Amber", dot: "bg-amber-500", text: "text-amber-600" },
  { value: "green", label: "Green", dot: "bg-green-500", text: "text-green-600" },
];

const DOT_CLASS: Record<TrackRagStatus, string> = {
  clear: "bg-slate-400",
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
};

type TrackStatusDotProps = {
  value: TrackRagStatus;
  canUpdate: boolean;
  ariaLabel: string;
  onChange: (status: TrackRagStatus) => void;
};

/**
 * RAG status control for Track. Popover (not DropdownMenu): same open-on-tap
 * path as searchable selects / initiative menu. DropdownMenu's shared iOS
 * pointerdown preventDefault plus avoidCollisions=false left the menu
 * unreachable or off-screen on iPhone (especially landscape).
 */
export function TrackStatusDot({
  value,
  canUpdate,
  ariaLabel,
  onChange,
}: TrackStatusDotProps) {
  const [open, setOpen] = useState(false);

  const dot = (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", DOT_CLASS[value])}
      aria-hidden
    />
  );

  if (!canUpdate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={ariaLabel}
            className="inline-flex cursor-not-allowed rounded-full p-2.5 lg:p-0.5"
          >
            {dot}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{OWNER_TOOLTIP}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      ),
    );
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = current < 0 ? 0 : (current + 1) % items.length;
        break;
      case "ArrowUp":
        next =
          current < 0
            ? items.length - 1
            : (current - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    items[next].focus();
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          className="inline-flex size-9 cursor-pointer touch-manipulation items-center justify-center rounded-full hover:opacity-80 lg:size-auto lg:p-0.5"
        >
          {dot}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={8}
        role="menu"
        aria-label={ariaLabel}
        className="w-auto min-w-28 overflow-hidden p-0"
        onKeyDown={handleKeyDown}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {OPTIONS.map((option, index) => (
          <div key={option.value}>
            {index > 0 ? <div role="separator" className="h-px bg-border" /> : null}
            <button
              type="button"
              role="menuitem"
              className={cn(
                "flex w-full cursor-pointer items-center gap-1.5 px-3 py-2.5 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent",
                option.text,
              )}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span
                className={cn("size-2.5 shrink-0 rounded-full", option.dot)}
              />
              {option.label}
            </button>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
