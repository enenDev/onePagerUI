import { useEffect, useRef, useState } from "react";

import { AdoptionFilters } from "@/components/adoption/AdoptionFilters";
import { DashboardSection } from "@/components/adoption/DashboardSection";
import {
  FUNNEL_STAGE_COLORS,
  FunnelSummary,
} from "@/components/adoption/FunnelSummary";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMetadata } from "@/redux/landingSlice";
import {
  DEFAULT_PERIOD,
  growthComparisonLabel,
  resolveDashboardRanges,
  type PeriodId,
} from "@/lib/adoptionPeriod";
import {
  displayToIso,
  isDisplayDateBefore,
  isValidDisplayDate,
} from "@/lib/displayDate";
import {
  emptyAdoption,
  emptyEngagement,
  emptyFunnel,
  emptyOnboarding,
  getAdoptionDashboard,
  getAdoptionEngagement,
  getAdoptionFunnel,
  getAdoptionOnboarding,
  type AdoptionResponse,
  type DashboardFilterPayload,
  type EngagementResponse,
  type FunnelResponse,
  type OnboardingResponse,
} from "@/services/adoptionDashboardApi";

type SectionState<T> = {
  loading: boolean;
  data: T;
};

function marketsPayload(selected: string[], available: string[]): string[] {
  const noneSelected = selected.length === 0;
  const everyMarketChecked =
    available.length > 0 &&
    selected.length === available.length &&
    available.every((market) => selected.includes(market));
  if (noneSelected || everyMarketChecked) return [];
  return [...selected];
}

async function fetchDashboard(body: DashboardFilterPayload) {
  const [funnelResult, onboardingResult, engagementResult, adoptionResult] =
    await Promise.allSettled([
      getAdoptionFunnel(body),
      getAdoptionOnboarding(body),
      getAdoptionEngagement(body),
      getAdoptionDashboard(body),
    ]);

  return {
    funnel:
      funnelResult.status === "fulfilled" ? funnelResult.value : emptyFunnel(),
    onboarding:
      onboardingResult.status === "fulfilled"
        ? onboardingResult.value
        : emptyOnboarding(),
    engagement:
      engagementResult.status === "fulfilled"
        ? engagementResult.value
        : emptyEngagement(),
    adoption:
      adoptionResult.status === "fulfilled"
        ? adoptionResult.value
        : emptyAdoption(),
  };
}

export function UserAdoption() {
  const dispatch = useAppDispatch();
  const metadata = useAppSelector((state) => state.landing.metadata);
  const marketsLoading = useAppSelector(
    (state) => state.landing.metadataLoading,
  );
  const markets = metadata?.market ?? [];

  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodId>(DEFAULT_PERIOD);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [comparedTo, setComparedTo] = useState(() =>
    growthComparisonLabel(DEFAULT_PERIOD),
  );
  const appliedQuery = useRef<{
    body: DashboardFilterPayload;
    period: PeriodId;
  } | null>(null);

  const [funnel, setFunnel] = useState<SectionState<FunnelResponse>>({
    loading: true,
    data: emptyFunnel(),
  });
  const [onboarding, setOnboarding] = useState<
    SectionState<OnboardingResponse>
  >({
    loading: true,
    data: emptyOnboarding(),
  });
  const [engagement, setEngagement] = useState<
    SectionState<EngagementResponse>
  >({
    loading: true,
    data: emptyEngagement(),
  });
  const [adoption, setAdoption] = useState<SectionState<AdoptionResponse>>({
    loading: true,
    data: emptyAdoption(),
  });

  const applyBody = async (
    body: DashboardFilterPayload,
    appliedPeriod: PeriodId,
  ) => {
    appliedQuery.current = { body, period: appliedPeriod };
    setApplying(true);
    setFunnel((current) => ({ ...current, loading: true }));
    setOnboarding((current) => ({ ...current, loading: true }));
    setEngagement((current) => ({ ...current, loading: true }));
    setAdoption((current) => ({ ...current, loading: true }));
    const result = await fetchDashboard(body);
    setComparedTo(growthComparisonLabel(appliedPeriod));
    setFunnel({ loading: false, data: result.funnel });
    setOnboarding({ loading: false, data: result.onboarding });
    setEngagement({ loading: false, data: result.engagement });
    setAdoption({ loading: false, data: result.adoption });
    setApplying(false);
  };

  useEffect(() => {
    void dispatch(fetchMetadata());
    const ranges = resolveDashboardRanges(DEFAULT_PERIOD, new Date(), "", "");
    if (!ranges) return;
    const body: DashboardFilterPayload = {
      markets: [],
      current: ranges.current,
      previous: ranges.previous,
    };
    appliedQuery.current = { body, period: DEFAULT_PERIOD };
    let cancelled = false;
    void fetchDashboard(body).then((result) => {
      if (cancelled) return;
      setFunnel({ loading: false, data: result.funnel });
      setOnboarding({ loading: false, data: result.onboarding });
      setEngagement({ loading: false, data: result.engagement });
      setAdoption({ loading: false, data: result.adoption });
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const applyFilters = () => {
    if (period === "custom") {
      if (!isValidDisplayDate(customStart) || !isValidDisplayDate(customEnd)) {
        return;
      }
      if (displayToIso(customEnd) < displayToIso(customStart)) {
        setDateError("End date must be on or after the start date.");
        return;
      }
    }

    const ranges = resolveDashboardRanges(
      period,
      new Date(),
      customStart,
      customEnd,
    );
    if (!ranges) return;

    setDateError(null);
    void applyBody(
      {
        markets: marketsPayload(
          selectedMarkets,
          markets.map((market) => market.value),
        ),
        current: ranges.current,
        previous: ranges.previous,
      },
      period,
    );
  };

  const refresh = () => {
    const applied = appliedQuery.current;
    if (!applied || applying) return;
    void applyBody(applied.body, applied.period);
  };

  const clearFilters = () => {
    setSelectedMarkets([]);
    setPeriod(DEFAULT_PERIOD);
    setCustomStart("");
    setCustomEnd("");
    setDateError(null);
    const ranges = resolveDashboardRanges(DEFAULT_PERIOD, new Date(), "", "");
    if (!ranges) return;
    void applyBody(
      {
        markets: [],
        current: ranges.current,
        previous: ranges.previous,
      },
      DEFAULT_PERIOD,
    );
  };

  return (
    <div className="-mx-6 -my-6 min-h-[calc(100svh-3.5rem)] bg-[#edf2f9] px-6 py-6 lg:-mx-8 lg:px-8">
      <AdoptionFilters
        markets={markets}
        marketsLoading={marketsLoading && markets.length === 0}
        selectedMarkets={selectedMarkets}
        onToggleMarket={(value) => {
          setSelectedMarkets((current) =>
            current.includes(value)
              ? current.filter((item) => item !== value)
              : [...current, value],
          );
        }}
        onClearMarkets={() => setSelectedMarkets([])}
        period={period}
        onPeriodChange={(next) => {
          setPeriod(next);
          setDateError(null);
        }}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStart={(value) => {
          setCustomStart(value);
          setDateError(null);
          if (
            customEnd &&
            isValidDisplayDate(value) &&
            isValidDisplayDate(customEnd) &&
            isDisplayDateBefore(customEnd, value)
          ) {
            setCustomEnd("");
          }
        }}
        onCustomEnd={(value) => {
          setCustomEnd(value);
          setDateError(null);
        }}
        dateError={dateError}
        applying={applying}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <div className="mt-3">
        <FunnelSummary
          data={funnel.data}
          loading={funnel.loading}
          refreshing={applying || funnel.loading}
          onRefresh={refresh}
        />
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        <DashboardSection
          title="Onboarding"
          titleColor={FUNNEL_STAGE_COLORS.onboarding}
          chartTitle="Onboarded Rate by market"
          chartHint="Onboarding rate by market for CSP and CBD."
          rows={onboarding.data.by_market}
          loading={onboarding.loading}
          comparedTo={comparedTo}
          metrics={[
            {
              label: "Onboarded Users",
              hint: "Distinct users who logged in during the selected period.",
              kind: "count",
              roles: ["CSP", "CBD", "General"],
              value: onboarding.data.onboarded_users,
            },
            {
              label: "Onboarded Users Growth Rate",
              hint: "Change versus the previous period: (current − previous) / previous.",
              kind: "growth",
              roles: ["CSP", "CBD"],
              value: onboarding.data.onboarded_users_growth_rate,
            },
            {
              label: "Total One-Pager Views",
              hint: "One-pager views during the selected period.",
              kind: "count",
              roles: ["CSP", "CBD", "General"],
              value: onboarding.data.total_one_pager_views,
            },
          ]}
        />
        <DashboardSection
          title="Engagement"
          titleColor={FUNNEL_STAGE_COLORS.engagement}
          chartTitle="Engagement Rate by market"
          chartHint="Engagement rate by market for CSP and CBD."
          rows={engagement.data.by_market}
          loading={engagement.loading}
          comparedTo={comparedTo}
          metrics={[
            {
              label: "Engaged Users",
              hint: "Distinct users who created at least one draft.",
              kind: "count",
              roles: ["CSP", "CBD"],
              value: engagement.data.engaged_users,
            },
            {
              label: "Track-to-Publish %",
              hint: "Published one-pagers that were tracked, divided by published one-pagers.",
              kind: "percent",
              roles: ["CSP", "CBD"],
              value: engagement.data.track_to_publish,
            },
            {
              label: "Total Exports",
              hint: "One-pager exports during the selected period.",
              kind: "count",
              roles: ["CSP", "CBD", "General"],
              value: engagement.data.total_exports,
            },
          ]}
        />
        <DashboardSection
          title="Adoption"
          titleColor={FUNNEL_STAGE_COLORS.adoption}
          chartTitle="Adoption Rate by market"
          chartHint="Adoption rate by market for CSP and CBD."
          rows={adoption.data.by_market}
          loading={adoption.loading}
          comparedTo={comparedTo}
          metrics={[
            {
              label: "Adopted Users",
              hint: "Distinct users who published at least one one-pager.",
              kind: "count",
              roles: ["CSP", "CBD"],
              value: adoption.data.adopted_users,
            },
            {
              label: "Adopted Users Growth Rate",
              hint: "Change versus the previous period: (current − previous) / previous.",
              kind: "growth",
              roles: ["CSP", "CBD"],
              value: adoption.data.adopted_users_growth_rate,
            },
            {
              label: "Draft-to-Publish %",
              hint: "Published one-pagers divided by active drafts plus published one-pagers.",
              kind: "percent",
              roles: ["CSP", "CBD"],
              value: adoption.data.draft_to_publish,
            },
            {
              label: "Total One-Pagers Published",
              hint: "One-pagers published during the selected period.",
              kind: "count",
              roles: ["CSP", "CBD"],
              value: adoption.data.total_one_pagers_published,
            },
          ]}
        />
      </div>
    </div>
  );
}
