import { useState } from "react";
import { Info } from "lucide-react";
import {
  Bar,
  BarChart,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatPercent,
  isMetricNumber,
  NO_METRIC_DATA,
} from "@/components/adoption/formatMetric";
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip as UiTooltip,
} from "@/components/ui/tooltip";
import type { MarketRateRow } from "@/services/adoptionDashboardApi";

const VISIBLE_MARKETS = 4;
const CSP_COLOR = "#0066cc";
const CBD_COLOR = "#8ec3f0";

type MarketRateChartProps = {
  title: string;
  hint: string;
  rows: MarketRateRow[];
  loading: boolean;
};

function percentLabel(value: unknown) {
  return isMetricNumber(value) ? formatPercent(value) : "";
}

export function MarketRateChart({
  title,
  hint,
  rows,
  loading,
}: MarketRateChartProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? rows : rows.slice(0, VISIBLE_MARKETS);
  const hiddenCount = Math.max(rows.length - VISIBLE_MARKETS, 0);
  const chartHeight = Math.max(visible.length * 52, 120);

  return (
    <div>
      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
        <span>{title}</span>
        <UiTooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="cursor-pointer text-muted-foreground"
              aria-label={`About ${title}`}
            >
              <Info className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{hint}</TooltipContent>
        </UiTooltip>
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{NO_METRIC_DATA}</p>
      ) : (
        <>
          <div className="mt-3" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={visible}
                margin={{ top: 4, right: 48, left: 0, bottom: 0 }}
                barCategoryGap={12}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="market"
                  width={92}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#334155" }}
                />
                <Tooltip
                  formatter={(value) =>
                    isMetricNumber(value) ? formatPercent(value) : ""
                  }
                />
                <Legend
                  align="right"
                  verticalAlign="top"
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="csp"
                  name="CSP"
                  fill={CSP_COLOR}
                  barSize={8}
                  radius={[0, 2, 2, 0]}
                >
                  <LabelList
                    dataKey="csp"
                    position="right"
                    formatter={percentLabel}
                    className="fill-muted-foreground text-[10px]"
                  />
                </Bar>
                <Bar
                  dataKey="cbd"
                  name="CBD"
                  fill={CBD_COLOR}
                  barSize={8}
                  radius={[0, 2, 2, 0]}
                >
                  <LabelList
                    dataKey="cbd"
                    position="right"
                    formatter={percentLabel}
                    className="fill-muted-foreground text-[10px]"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="mt-1 cursor-pointer text-xs font-medium text-primary"
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? "Show less" : `+${hiddenCount} more`}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
