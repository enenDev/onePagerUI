import { Fragment } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export function TrackStatusDot({
  value,
  canUpdate,
  ariaLabel,
  onChange,
}: TrackStatusDotProps) {
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
            className="inline-flex cursor-not-allowed"
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="inline-flex cursor-pointer rounded-full p-0.5 hover:opacity-80"
        >
          {dot}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-28 w-auto p-0">
        {OPTIONS.map((option, index) => (
          <Fragment key={option.value}>
            {index > 0 ? <DropdownMenuSeparator className="m-0" /> : null}
            <DropdownMenuItem
              className={cn(
                "cursor-pointer rounded-none px-3 py-2",
                option.text,
              )}
              onClick={() => onChange(option.value)}
            >
              <span
                className={cn("size-2.5 shrink-0 rounded-full", option.dot)}
              />
              {option.label}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
