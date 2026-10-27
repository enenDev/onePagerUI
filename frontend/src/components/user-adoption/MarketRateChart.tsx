import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatPercent,
  isMetricNumber,
  NO_METRIC_DATA,
} from "@/components/user-adoption/formatMetric";
import { HintTooltipContent } from "@/components/user-adoption/HintTooltipContent";
import { InfoMark } from "@/components/user-adoption/InfoMark";
import { TooltipTrigger, Tooltip as UiTooltip } from "@/components/ui/tooltip";
import type { MarketRateRow } from "@/services/adoptionDashboardApi";

const VISIBLE_MARKETS = 4;
const ROW_HEIGHT = 52;
const MARKET_LABEL_SIZE = 10;
const MARKET_NAME_COLOR = "#334155";
/** Fixed label column on a phone so a long market name wraps instead of widening the axis. */
const PHONE_AXIS_WIDTH = 76;
const PHONE_QUERY = "(max-width: 639px)";
/** CSP matches the adoption stage. CBD matches the onboarding stage. */
const CSP_COLOR = "#004f9e";
const CBD_COLOR = "#1890ff";

type MarketRateChartProps = {
  title: string;
  hint: string;
  rows: MarketRateRow[];
  loading: boolean;
};

function percentLabel(value: unknown) {
  return isMetricNumber(value) ? formatPercent(value) : "";
}

function usePhoneLayout() {
  const [phone, setPhone] = useState(
    () => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const onChange = () => setPhone(query.matches);
    onChange();
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return phone;
}

function WrappingMarketTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
}) {
  const label = payload?.value ?? "";

  return (
    <foreignObject
      x={x - PHONE_AXIS_WIDTH}
      y={y - 18}
      width={PHONE_AXIS_WIDTH}
      height={36}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: PHONE_AXIS_WIDTH,
          height: 36,
          overflowWrap: "anywhere",
          textAlign: "right",
          fontSize: MARKET_LABEL_SIZE,
          lineHeight: 1.2,
          color: MARKET_NAME_COLOR,
        }}
      >
        {label}
      </div>
    </foreignObject>
  );
}

/** Thicker bars when few markets share the row; slim bars once four or more fit. */
function barThickness(count: number): number {
  if (count <= 1) return 16;
  if (count === 2) return 12;
  if (count === 3) return 10;
  return 8;
}

function LegendSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-[1em] w-[1em] shrink-0 rounded-[2px]"
      style={{ backgroundColor: color, transform: "translateY(-2px)" }}
      aria-hidden
    />
  );
}

function ChartLegend() {
  return (
    <div className="flex shrink-0 items-center gap-3 text-[10px] leading-none text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <LegendSwatch color={CBD_COLOR} />
        CBD
      </span>
      <span className="inline-flex items-center gap-1">
        <LegendSwatch color={CSP_COLOR} />
        CSP
      </span>
    </div>
  );
}

export function MarketRateChart({
  title,
  hint,
  rows,
  loading,
}: MarketRateChartProps) {
  const phone = usePhoneLayout();
  const rowCount = rows.length;
  const viewportHeight = VISIBLE_MARKETS * ROW_HEIGHT;
  const plotHeight = Math.max(rowCount, 1) * ROW_HEIGHT;
  const scrollable = rowCount > VISIBLE_MARKETS;
  const thickness = barThickness(rowCount);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex min-w-0 items-center gap-1 text-sm font-medium leading-none"
          style={{ color: MARKET_NAME_COLOR }}
        >
          <span>{title}</span>
          <UiTooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex shrink-0 cursor-pointer items-center"
                style={{ transform: "translateY(-1.5px)" }}
                aria-label={`About ${title}`}
              >
                <InfoMark />
              </button>
            </TooltipTrigger>
            <HintTooltipContent hint={hint} />
          </UiTooltip>
        </div>
        {loading || rowCount === 0 ? null : <ChartLegend />}
      </div>
      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : rowCount === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{NO_METRIC_DATA}</p>
      ) : (
        <div
          className={
            scrollable
              ? "chart-scroll mt-2 overflow-y-auto [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none"
              : "mt-2 flex items-center [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none"
          }
          style={{ height: viewportHeight }}
        >
          <div className="w-full shrink-0" style={{ height: plotHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                accessibilityLayer={false}
                layout="vertical"
                data={rows}
                margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
                barCategoryGap={8}
                barGap={3}
              >
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="market"
                  width={phone ? PHONE_AXIS_WIDTH : "auto"}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={2}
                  tick={
                    phone
                      ? WrappingMarketTick
                      : {
                          fontSize: MARKET_LABEL_SIZE,
                          fill: MARKET_NAME_COLOR,
                        }
                  }
                />
                <Tooltip
                  cursor={{ fill: "rgba(24, 144, 255, 0.1)" }}
                  contentStyle={{
                    padding: "4px 6px",
                    fontSize: 11,
                    lineHeight: 1.3,
                  }}
                  labelStyle={{ fontSize: 11, margin: 0 }}
                  itemStyle={{ fontSize: 11, paddingTop: 0, paddingBottom: 0 }}
                  formatter={(value) =>
                    isMetricNumber(value) ? formatPercent(value) : ""
                  }
                />
                <Bar
                  dataKey="csp"
                  name="CSP"
                  fill={CSP_COLOR}
                  barSize={thickness}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
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
                  barSize={thickness}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
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
        </div>
      )}
    </div>
  );
}
