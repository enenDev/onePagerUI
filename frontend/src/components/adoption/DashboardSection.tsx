import { MarketRateChart } from "@/components/adoption/MarketRateChart";
import { MetricFigure } from "@/components/adoption/MetricFigure";
import type {
  DashboardRole,
  MarketRateRow,
  MetricValue,
} from "@/services/adoptionDashboardApi";

export type SectionMetric = {
  label: string;
  hint: string;
  kind: "count" | "percent" | "growth";
  roles: DashboardRole[];
  value: MetricValue;
};

type DashboardSectionProps = {
  title: string;
  /** Funnel-box fill for this section, used as the title color. */
  titleColor: string;
  chartTitle: string;
  chartHint: string;
  rows: MarketRateRow[];
  metrics: SectionMetric[];
  loading: boolean;
  comparedTo?: string;
};

export function DashboardSection({
  title,
  titleColor,
  chartTitle,
  chartHint,
  rows,
  metrics,
  loading,
  comparedTo,
}: DashboardSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <h2
        className="text-sm font-semibold tracking-wide uppercase"
        style={{ color: titleColor }}
      >
        {title}
      </h2>
      <div className="mt-4">
        <MarketRateChart
          title={chartTitle}
          hint={chartHint}
          rows={rows}
          loading={loading}
        />
      </div>
      <div className="mt-4">
        {metrics.map((metric) => (
          <MetricFigure
            key={metric.label}
            label={metric.label}
            hint={metric.hint}
            kind={metric.kind}
            roles={metric.roles}
            value={metric.value}
            loading={loading}
            comparedTo={comparedTo}
          />
        ))}
      </div>
    </section>
  );
}
