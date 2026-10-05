import { ChevronRight } from "lucide-react";

import { MetricFigure } from "@/components/adoption/MetricFigure";
import type { FunnelResponse } from "@/services/adoptionDashboardApi";

type FunnelSummaryProps = {
  data: FunnelResponse;
  loading: boolean;
};

const STAGES = [
  {
    key: "onboarding_rate",
    label: "Stage 1 · Onboarding",
    hint: "Distinct logged-in users divided by provisioned users.",
  },
  {
    key: "engagement_rate",
    label: "Stage 2 · Engagement",
    hint: "Distinct users who created a draft, divided by provisioned users.",
  },
  {
    key: "adoption_rate",
    label: "Stage 3 · Adoption",
    hint: "Distinct users who published a one-pager, divided by provisioned users.",
  },
] as const;

export function FunnelSummary({ data, loading }: FunnelSummaryProps) {
  return (
    <section aria-label="Adoption funnel">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">
        ADOPTION FUNNEL
      </h2>
      <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div className="rounded-lg border border-border bg-white px-4 xl:flex-1">
          <MetricFigure
            label="Provisioned users"
            hint="Users provisioned for the selected markets and period."
            kind="count"
            roles={["CSP", "CBD"]}
            value={data.provisioned_users}
            loading={loading}
            className="border-t-0"
          />
        </div>
        {STAGES.map((stage, index) => (
          <div key={stage.key} className="flex xl:contents">
            {index > 0 ? (
              <div className="hidden items-center text-primary xl:flex">
                <ChevronRight className="size-5" aria-hidden />
              </div>
            ) : null}
            <div className="flex-1 rounded-lg bg-primary px-4 text-primary-foreground xl:flex-1 [&_button]:text-primary-foreground/80 [&_p]:text-primary-foreground [&_span]:text-primary-foreground/90">
              <MetricFigure
                label={stage.label}
                hint={stage.hint}
                kind="percent"
                roles={["CSP", "CBD"]}
                value={data[stage.key]}
                loading={loading}
                className="border-t-0"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
