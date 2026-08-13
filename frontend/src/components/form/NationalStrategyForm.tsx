import { useEffect, useRef, useState, type ReactNode } from "react";
import { CloudUpload } from "lucide-react";

import { AddCampaignModal } from "@/components/form/AddCampaignModal";
import type { NationalFormValues } from "@/components/form/nationalForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getCreateFormMarkets,
  getOptionsForMarket,
  type FilterOption,
} from "@/services/createFormApi";

type NationalStrategyFormProps = {
  values: NationalFormValues;
  onChange: (next: NationalFormValues) => void;
};

export function NationalStrategyForm({
  values,
  onChange,
}: NationalStrategyFormProps) {
  const [markets, setMarkets] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [campaigns, setCampaigns] = useState<FilterOption[]>([]);
  const [channels, setChannels] = useState<FilterOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);
  const marketOptionsRequestId = useRef(0);

  const marketSelected = Boolean(values.market);
  const dependentDisabled = !marketSelected || optionsLoading;

  useEffect(() => {
    void getCreateFormMarkets().then(setMarkets);
  }, []);

  const loadMarketOptions = async (market: string) => {
    const requestId = ++marketOptionsRequestId.current;
    setOptionsLoading(true);
    setCategories([]);
    setCampaigns([]);
    setChannels([]);

    const options = await getOptionsForMarket(market);
    // Ignore stale responses if the user changed market again quickly.
    if (requestId !== marketOptionsRequestId.current) return;

    setCategories(options.categories);
    setCampaigns(options.campaigns);
    setChannels(options.channels);
    setOptionsLoading(false);
  };

  // Reload dependent dropdown options whenever market is set — including restore
  // from preview (values are in parent state, but option lists live only here).
  useEffect(() => {
    if (!values.market) {
      marketOptionsRequestId.current += 1;
      setOptionsLoading(false);
      setCategories([]);
      setCampaigns([]);
      setChannels([]);
      return;
    }
    void loadMarketOptions(values.market);
  }, [values.market]);

  const handleMarketChange = (market: string) => {
    // Always reset dependent filters when market changes.
    // Option lists reload via the values.market effect above.
    onChange({
      ...values,
      market,
      category: "",
      campaign: "",
      channel: "",
    });
  };

  const patch = (partial: Partial<NationalFormValues>) => {
    onChange({ ...values, ...partial });
  };

  // Remount dependent selects when market changes so Radix clears the visible value.
  const dependentSelectKey = values.market || "no-market";

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <section className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            General Strategy Information & Scope
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Market" required>
              <Select
                value={values.market || undefined}
                onValueChange={(value) => handleMarketChange(value ?? "")}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer bg-white">
                  <SelectValue placeholder="Select Market" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Category" required>
              <Select
                key={`category-${dependentSelectKey}`}
                value={values.category || undefined}
                onValueChange={(value) => patch({ category: value ?? "" })}
                disabled={dependentDisabled}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer bg-white disabled:cursor-not-allowed">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-2 sm:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <Label>Campaign</Label>
                <button
                  type="button"
                  className="cursor-pointer text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!marketSelected}
                  onClick={() => setAddCampaignOpen(true)}
                >
                  + Add New
                </button>
              </div>
              <Select
                key={`campaign-${dependentSelectKey}`}
                value={values.campaign || undefined}
                onValueChange={(value) => patch({ campaign: value ?? "" })}
                disabled={dependentDisabled}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer bg-white disabled:cursor-not-allowed">
                  <SelectValue placeholder="Select Campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Field label="Channel" required>
              <Select
                key={`channel-${dependentSelectKey}`}
                value={values.channel || undefined}
                onValueChange={(value) => patch({ channel: value ?? "" })}
                disabled={dependentDisabled}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer bg-white disabled:cursor-not-allowed">
                  <SelectValue placeholder="Select Channel" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="national-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="national-title"
                value={values.title}
                onChange={(event) => patch({ title: event.target.value })}
                placeholder="Enter Title"
                className="bg-white"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Cover Image/Thumbnail</Label>
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white text-sm font-medium text-primary hover:bg-accent">
                <CloudUpload className="size-4" />
                {values.coverImageName || "Upload Cover Image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (values.coverImageUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(values.coverImageUrl);
                    }
                    // TODO: When upload API exists, optionally upload `file` here (or on Save)
                    // and store the returned permanent URL in coverImageUrl instead of blob:.
                    patch({
                      coverImageName: file?.name ?? "",
                      coverImageUrl: file ? URL.createObjectURL(file) : "",
                      coverImageFile: file,
                    });
                    event.target.value = "";
                  }}
                />
              </label>
              {values.coverImageUrl ? (
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
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Business Outcome Statement
          </h2>
          <Textarea
            value={values.businessOutcome}
            onChange={(event) => patch({ businessOutcome: event.target.value })}
            placeholder="State the core commercial target and outcome expected from this execution plan."
            className="min-h-[280px] resize-y bg-white"
          />
        </section>
      </div>

      <AddCampaignModal
        open={addCampaignOpen}
        market={values.market}
        onOpenChange={setAddCampaignOpen}
        onAdded={(campaignValue) => {
          setCampaigns((prev) =>
            prev.some((item) => item.value === campaignValue)
              ? prev
              : [...prev, { label: campaignValue, value: campaignValue }],
          );
          patch({ campaign: campaignValue });
        }}
      />
    </>
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
