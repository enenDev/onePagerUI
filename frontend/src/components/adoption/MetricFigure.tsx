import { InfoMark } from "@/components/adoption/InfoMark";
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
  /** Growth comparison, such as "vs previous 30 days". */
  comparedTo?: string;
  className?: string;
};

export function MetricFigure({
  label,
  hint,
  kind,
  roles,
  value,
  loading,
  comparedTo,
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
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-border py-3",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1 text-xs font-medium leading-none text-[#4b5563]">
          <span>{label}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 cursor-pointer items-center"
                aria-label={`About ${label}`}
              >
                <InfoMark />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{hint}</TooltipContent>
          </Tooltip>
        </div>
        {!loading && roleLine ? (
          <p className="text-xs text-muted-foreground">{roleLine}</p>
        ) : null}
      </div>
      {loading ? (
        <p className="shrink-0 text-sm text-muted-foreground">Loading…</p>
      ) : !isMetricNumber(total) ? (
        <p className="shrink-0 text-sm text-muted-foreground">
          {NO_METRIC_DATA}
        </p>
      ) : (
        <p
          className={`shrink-0 text-right text-sm font-semibold tabular-nums ${tone}`}
        >
          {format(total)}
          {kind === "growth" && comparedTo ? (
            <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
              {comparedTo}
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}
