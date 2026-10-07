import { ChevronRight, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  formatCount,
  formatPercent,
  formatRoleLine,
  isMetricNumber,
  NO_METRIC_DATA,
} from "@/components/adoption/formatMetric";
import { InfoMark } from "@/components/adoption/InfoMark";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  DashboardRole,
  FunnelResponse,
  MetricValue,
} from "@/services/adoptionDashboardApi";

type FunnelSummaryProps = {
  data: FunnelResponse;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

const STAGE_ROLES: DashboardRole[] = ["CSP", "CBD"];

/** Same fills as the three funnel boxes. Section titles use these colors. */
export const FUNNEL_STAGE_COLORS = {
  onboarding: "#1890ff",
  engagement: "#0066cc",
  adoption: "#004f9e",
} as const;

const STAGES = [
  {
    key: "onboarding_rate",
    label: "Stage 1 - Onboarding",
    hint: "Distinct logged-in users divided by provisioned users.",
    color: FUNNEL_STAGE_COLORS.onboarding,
  },
  {
    key: "engagement_rate",
    label: "Stage 2 - Engagement",
    hint: "Distinct users who created a draft, divided by provisioned users.",
    color: FUNNEL_STAGE_COLORS.engagement,
  },
  {
    key: "adoption_rate",
    label: "Stage 3 - Adoption",
    hint: "Distinct users who published a one-pager, divided by provisioned users.",
    color: FUNNEL_STAGE_COLORS.adoption,
  },
] as const;

function StageFigure({
  label,
  hint,
  value,
  loading,
}: {
  label: string;
  hint: string;
  value: MetricValue;
  loading: boolean;
}) {
  const total = value.total;
  const roles = formatRoleLine(value.by_role, STAGE_ROLES, formatPercent);

  return (
    <div className="min-w-0 text-left text-white">
      <div className="flex items-center gap-1 text-[11px] font-semibold leading-none tracking-wide uppercase">
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 cursor-pointer items-center"
              style={{ transform: "translateY(-1px)" }}
              aria-label={`About ${label}`}
            >
              <InfoMark />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{hint}</TooltipContent>
        </Tooltip>
      </div>
      {loading ? (
        <p className="mt-2 text-sm text-white/80">Loading…</p>
      ) : !isMetricNumber(total) ? (
        <p className="mt-2 text-sm text-white/80">{NO_METRIC_DATA}</p>
      ) : (
        <>
          <p className="mt-1 text-3xl leading-none font-semibold tabular-nums">
            {formatPercent(total)}
          </p>
          {roles ? (
            <p className="mt-2 text-xs text-white/85">{roles}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export function FunnelSummary({
  data,
  loading,
  refreshing,
  onRefresh,
}: FunnelSummaryProps) {
  const provisioned = data.provisioned_users;
  const provisionedTotal = provisioned.total;
  const provisionedRoles = formatRoleLine(
    provisioned.by_role,
    STAGE_ROLES,
    formatCount,
  );

  return (
    <section
      aria-label="Adoption funnel"
      className="rounded-xl border border-border bg-white px-4 py-4 shadow-sm md:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-primary">
          ADOPTION FUNNEL
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Refresh"
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw
                className={cn("size-4", refreshing && "animate-spin")}
                aria-hidden
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="shrink-0 xl:w-56">
          <p className="text-sm font-bold text-foreground">
            Onboarding to Adoption
          </p>
          {loading ? (
            <p className="mt-3 text-xs text-muted-foreground">Loading…</p>
          ) : !isMetricNumber(provisionedTotal) ? (
            <p className="mt-3 text-xs text-muted-foreground">{NO_METRIC_DATA}</p>
          ) : (
            <>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {formatCount(provisionedTotal)}
                </span>{" "}
                provisioned users
              </p>
              {provisionedRoles ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {provisionedRoles}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 xl:flex-row xl:items-stretch">
          {STAGES.map((stage, index) => (
            <div key={stage.key} className="flex min-w-0 flex-1 xl:contents">
              {index > 0 ? (
                <div className="hidden items-center text-primary xl:flex">
                  <ChevronRight className="size-5" aria-hidden />
                </div>
              ) : null}
              <div
                className="flex min-h-24 flex-1 items-center rounded-lg px-4 py-3"
                style={{ backgroundColor: stage.color }}
              >
                <StageFigure
                  label={stage.label}
                  hint={stage.hint}
                  value={data[stage.key]}
                  loading={loading}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
