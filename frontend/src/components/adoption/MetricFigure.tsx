import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatCount,
  formatPercent,
  formatRoleLine,
  formatSignedPercent,
  isMetricNumber,
  NO_METRIC_DATA,
} from "@/components/adoption/formatMetric";
import type {
  DashboardRole,
  MetricValue,
} from "@/services/adoptionDashboardApi";

type MetricKind = "count" | "percent" | "growth";

type MetricFigureProps = {
  label: string;
  hint: string;
  kind: MetricKind;
  roles: DashboardRole[];
  value: MetricValue;
  loading: boolean;
  className?: string;
};

export function MetricFigure({
  label,
  hint,
  kind,
  roles,
  value,
  loading,
  className,
}: MetricFigureProps) {
  const total = value.total;
  const format =
    kind === "count"
      ? formatCount
      : kind === "growth"
        ? formatSignedPercent
        : formatPercent;
  const roleLine = formatRoleLine(value.by_role, roles, format);
  const tone =
    kind === "growth" && isMetricNumber(total)
      ? total > 0
        ? "text-emerald-600"
        : total < 0
          ? "text-destructive"
          : "text-foreground"
      : "text-foreground";

  return (
    <div className={cn("border-t border-border py-3", className)}>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="cursor-pointer text-muted-foreground"
              aria-label={`About ${label}`}
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{hint}</TooltipContent>
        </Tooltip>
      </div>
      {loading ? (
        <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
      ) : !isMetricNumber(total) ? (
        <p className="mt-1 text-sm text-muted-foreground">{NO_METRIC_DATA}</p>
      ) : (
        <div className="mt-1 text-right">
          <p className={`text-xl font-semibold tabular-nums ${tone}`}>
            {format(total)}
            {kind === "growth" ? (
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (vs previous period)
              </span>
            ) : null}
          </p>
          {roleLine ? (
            <p className="text-xs text-muted-foreground">{roleLine}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
