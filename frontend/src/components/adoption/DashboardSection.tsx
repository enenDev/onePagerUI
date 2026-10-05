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
  index: number;
  title: string;
  chartTitle: string;
  chartHint: string;
  rows: MarketRateRow[];
  metrics: SectionMetric[];
  loading: boolean;
};

export function DashboardSection({
  index,
  title,
  chartTitle,
  chartHint,
  rows,
  metrics,
  loading,
}: DashboardSectionProps) {
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold text-foreground">
        <span className="mr-2 text-xs font-medium tracking-wide text-muted-foreground">
          SECTION {index}
        </span>
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
          />
        ))}
      </div>
    </section>
  );
}
