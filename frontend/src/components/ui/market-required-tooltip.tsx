import type { ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Exact product copy for dependent filters when Market is empty. */
export const MARKET_REQUIRED_FILTER_TOOLTIP =
  "Please chose a Market to enable this filter";

/**
 * Wraps a disabled control so hover still shows the market-required tooltip.
 * Only pass `show` when the control is disabled because Market is not selected
 * (not when disabled solely for metadata/catalog loading).
 */
export function MarketRequiredTooltip({
  show,
  children,
  className = "block w-full",
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
}) {
  if (!show) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={className}>{children}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{MARKET_REQUIRED_FILTER_TOOLTIP}</p>
      </TooltipContent>
    </Tooltip>
  );
}
