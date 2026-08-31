import { useEffect, useRef, type ReactNode } from "react";
import { CloudUpload, Loader2 } from "lucide-react";

import { CharCount } from "@/components/form/CharCount";
import {
  buildRetailerOnePagerTitle,
} from "@/components/form/buildOnePagerTitle";
import { FIELD_LIMITS } from "@/components/form/fieldLimits";
import type { RetailerFormValues } from "@/components/form/retailerForm";
import { useCoverImageUpload } from "@/components/form/useCoverImageUpload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketRequiredTooltip } from "@/components/ui/market-required-tooltip";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateFormMetadata } from "@/services/createFormApi";

type RetailerStrategyFormProps = {
  values: RetailerFormValues;
  onChange: (next: RetailerFormValues) => void;
  catalog: CreateFormMetadata | null;
  catalogLoading: boolean;
  /** Import From National — lock Market / Category / Channel / Campaign. */
  lockScope?: boolean;
};

const STRATEGY_TITLE_KEYS = [
  "market",
  "category",
  "campaign",
  "channel",
  "targetRetailer",
] as const satisfies ReadonlyArray<keyof RetailerFormValues>;

/**
 * Retailer strategy layout matches product mockup:
 * Market | Category
 * Channel | Target Retailer
 * Campaign (full width)
 * Title | Cover (full width)
 *
 * Dropdown options for Market / Category / Channel / Target Retailer / Campaign
 * come from shared homepage metadata (`landing.metadata`). Selected values live
 * in form state / API payload — do not inject missing values into option lists.
 */
export function RetailerStrategyForm({
  values,
  onChange,
  catalog,
  catalogLoading,
  lockScope = false,
}: RetailerStrategyFormProps) {
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  const { uploading: coverUploading, error: coverUploadError, onCoverFileChange } =
    useCoverImageUpload({
      patch: (next) => onChange({ ...valuesRef.current, ...next }),
    });

  const markets = catalog?.markets ?? [];
  const optionsByMarket = catalog?.optionsByMarket ?? {};
  const marketSelected = Boolean(values.market);
  const scoped = values.market ? optionsByMarket[values.market] : undefined;
  const retailerOptions = scoped?.retailers ?? [];
  const categoryOptions = scoped?.categories ?? [];
  const campaignOptions = scoped?.campaigns ?? [];
  const channelOptions = scoped?.channels ?? [];
  const dependentDisabled = !marketSelected || catalogLoading;
  const scopeDisabled = lockScope || catalogLoading;
  const dependentScopeDisabled = lockScope || dependentDisabled;
  // Tooltip only when Market is empty — not while loading, and not when
  // fields are locked from Import From National (different disable reason).
  const showMarketRequiredTooltip =
    !marketSelected && !catalogLoading && !lockScope;

  const titleFromStrategy = (next: RetailerFormValues) => {
    const nextScoped = next.market ? optionsByMarket[next.market] : undefined;
    return buildRetailerOnePagerTitle({
      market: next.market,
      category: next.category,
      campaign: next.campaign,
      channel: next.channel,
      targetRetailer: next.targetRetailer,
      markets,
      categories: nextScoped?.categories ?? [],
      campaigns: nextScoped?.campaigns ?? [],
      channels: nextScoped?.channels ?? [],
      retailers: nextScoped?.retailers ?? [],
    });
  };

  const handleMarketChange = (market: string) => {
    const next: RetailerFormValues = {
      ...values,
      market,
      targetRetailer: "",
      category: "",
      campaign: "",
      channel: "",
    };
    onChange({ ...next, title: titleFromStrategy(next) });
  };

  const patch = (partial: Partial<RetailerFormValues>) => {
    const next = { ...values, ...partial };
    const strategyChanged = STRATEGY_TITLE_KEYS.some((key) => key in partial);
    onChange(
      strategyChanged ? { ...next, title: titleFromStrategy(next) } : next,
    );
  };

  const dependentSelectKey = values.market || "no-market";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
      <section className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          General Strategy Information & Scope
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Market" required>
            <SearchableSelect
              options={markets}
              value={values.market}
              onValueChange={handleMarketChange}
              disabled={scopeDisabled}
              placeholder="Select Market"
              searchPlaceholder="Search Market…"
            />
          </Field>

          <Field label="Category" required>
            <MarketRequiredTooltip show={showMarketRequiredTooltip}>
              <SearchableSelect
                selectKey={`category-${dependentSelectKey}`}
                options={categoryOptions}
                value={values.category}
                onValueChange={(value) => patch({ category: value })}
                disabled={dependentScopeDisabled}
                placeholder="Select Category"
                searchPlaceholder="Search Category…"
              />
            </MarketRequiredTooltip>
          </Field>

          <Field label="Channel" required>
            <MarketRequiredTooltip show={showMarketRequiredTooltip}>
              <SearchableSelect
                selectKey={`channel-${dependentSelectKey}`}
                options={channelOptions}
                value={values.channel}
                onValueChange={(value) => patch({ channel: value })}
                disabled={dependentScopeDisabled}
                placeholder="Select Channel"
                searchPlaceholder="Search Channel…"
              />
            </MarketRequiredTooltip>
          </Field>

          <Field label="Target Retailer" required>
            <MarketRequiredTooltip show={showMarketRequiredTooltip}>
              <SearchableSelect
                selectKey={`retailer-${dependentSelectKey}`}
                options={retailerOptions}
                value={values.targetRetailer}
                onValueChange={(value) => patch({ targetRetailer: value })}
                disabled={dependentDisabled}
                placeholder="Select Retailer"
                searchPlaceholder="Search Retailer…"
              />
            </MarketRequiredTooltip>
          </Field>

          <div className="space-y-2 sm:col-span-2">
            <Label>Campaign</Label>
            <MarketRequiredTooltip show={showMarketRequiredTooltip}>
              <SearchableSelect
                selectKey={`campaign-${dependentSelectKey}`}
                options={campaignOptions}
                value={values.campaign}
                onValueChange={(value) => patch({ campaign: value })}
                disabled={dependentScopeDisabled}
                placeholder="Select Campaign"
                searchPlaceholder="Search Campaign…"
              />
            </MarketRequiredTooltip>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="retailer-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <CharCount value={values.title} max={FIELD_LIMITS.title} />
            </div>
            <Input
              id="retailer-title"
              value={values.title}
              maxLength={FIELD_LIMITS.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Enter Title"
              className="bg-white"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Cover Image/Thumbnail</Label>
            <label
              className={`flex h-11 items-center justify-center gap-2 rounded-lg border border-primary bg-white text-sm font-medium text-primary ${
                coverUploading
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-accent"
              }`}
            >
              {coverUploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <CloudUpload className="size-4" />
              )}
              {coverUploading
                ? "Uploading…"
                : values.coverImageName || "Upload Cover Image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                className="sr-only"
                disabled={coverUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  void onCoverFileChange(file);
                  event.target.value = "";
                }}
              />
            </label>
            {coverUploadError ? (
              <p className="text-sm text-destructive">{coverUploadError}</p>
            ) : null}
            {coverUploading ? (
              <div className="flex h-28 items-center justify-center gap-2 rounded-lg border border-border bg-[#f8fafc] text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                Uploading image…
              </div>
            ) : values.coverImageUrl ? (
              <div className="overflow-hidden rounded-lg border border-border bg-[#f8fafc]">
                <img
                  src={values.coverImageUrl}
                  alt={values.coverImageName || "Cover preview"}
                  className="h-28 w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">
            Business Outcome Statement
          </h2>
          <CharCount
            value={values.businessOutcome}
            max={FIELD_LIMITS.businessOutcome}
          />
        </div>
        <Textarea
          value={values.businessOutcome}
          maxLength={FIELD_LIMITS.businessOutcome}
          onChange={(event) => patch({ businessOutcome: event.target.value })}
          placeholder="State the core commercial target and outcome expected from this execution plan."
          className="min-h-24 resize-y bg-white"
        />
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
