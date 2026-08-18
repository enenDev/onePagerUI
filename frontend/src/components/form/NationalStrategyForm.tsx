import { useState, type ReactNode } from "react";
import { CloudUpload } from "lucide-react";

import { AddCampaignModal } from "@/components/form/AddCampaignModal";
import type { NationalFormValues } from "@/components/form/nationalForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketRequiredTooltip } from "@/components/ui/market-required-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/redux/hooks";
import { appendCampaignOption } from "@/redux/landingSlice";
import type { CreateFormMetadata } from "@/services/createFormApi";

type NationalStrategyFormProps = {
  values: NationalFormValues;
  onChange: (next: NationalFormValues) => void;
  catalog: CreateFormMetadata | null;
  catalogLoading: boolean;
};

export function NationalStrategyForm({
  values,
  onChange,
  catalog,
  catalogLoading,
}: NationalStrategyFormProps) {
  const dispatch = useAppDispatch();
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);

  const markets = catalog?.markets ?? [];
  const optionsByMarket = catalog?.optionsByMarket ?? {};
  const marketSelected = Boolean(values.market);
  const scoped = values.market ? optionsByMarket[values.market] : undefined;
  const categoryOptions = scoped?.categories ?? [];
  const campaignOptions = scoped?.campaigns ?? [];
  const channelOptions = scoped?.channels ?? [];
  const dependentDisabled = !marketSelected || catalogLoading;
  // Tooltip only when Market is empty — not while catalog is still loading.
  const showMarketRequiredTooltip = !marketSelected && !catalogLoading;

  const handleMarketChange = (market: string) => {
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
                disabled={catalogLoading}
              >
                <SelectTrigger className="h-9 w-full cursor-pointer bg-white disabled:cursor-not-allowed">
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
              <MarketRequiredTooltip show={showMarketRequiredTooltip}>
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
                    {categoryOptions.map((option) => (
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
              </MarketRequiredTooltip>
            </Field>

            <div className="space-y-2 sm:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <Label>Campaign</Label>
                <button
                  type="button"
                  className="cursor-pointer text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!marketSelected || catalogLoading}
                  onClick={() => setAddCampaignOpen(true)}
                >
                  + Add New
                </button>
              </div>
              <MarketRequiredTooltip show={showMarketRequiredTooltip}>
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
                    {campaignOptions.map((option) => (
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
              </MarketRequiredTooltip>
            </div>

            <Field label="Channel" required>
              <MarketRequiredTooltip show={showMarketRequiredTooltip}>
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
                    {channelOptions.map((option) => (
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
              </MarketRequiredTooltip>
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
                    // TODO: When upload API exists, optionally upload file here (or on Save)
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
        existingCampaigns={campaignOptions}
        onOpenChange={setAddCampaignOpen}
        onAdded={(campaign) => {
          if (values.market) {
            dispatch(
              appendCampaignOption({
                market: values.market,
                campaign,
              }),
            );
          }
          patch({ campaign: campaign.value });
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
