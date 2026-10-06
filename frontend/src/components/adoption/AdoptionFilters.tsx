import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { DateField } from "@/components/form/DateField";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PERIOD_OPTIONS, type PeriodId } from "@/lib/adoptionPeriod";
import { displayToIso, isValidDisplayDate } from "@/lib/displayDate";
import type { FilterOption } from "@/types/onePager";

type AdoptionFiltersProps = {
  markets: FilterOption[];
  marketsLoading: boolean;
  selectedMarkets: string[];
  onToggleMarket: (value: string) => void;
  onClearMarkets: () => void;
  period: PeriodId;
  onPeriodChange: (period: PeriodId) => void;
  customStart: string;
  customEnd: string;
  onCustomStart: (value: string) => void;
  onCustomEnd: (value: string) => void;
  dateError: string | null;
  applying: boolean;
  onApply: () => void;
  onClear: () => void;
};

export function AdoptionFilters({
  markets,
  marketsLoading,
  selectedMarkets,
  onToggleMarket,
  onClearMarkets,
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStart,
  onCustomEnd,
  dateError,
  applying,
  onApply,
  onClear,
}: AdoptionFiltersProps) {
  // const marketPlaceholder = `All live markets (${markets.length})`;
  const marketPlaceholder = "Select Market";
  const endMinIso = isValidDisplayDate(customStart)
    ? displayToIso(customStart)
    : undefined;
  const customDatesMissing =
    period === "custom" &&
    (!isValidDisplayDate(customStart) || !isValidDisplayDate(customEnd));
  const applyDisabled = applying || customDatesMissing;

  return (
    <div className="rounded-xl border border-border bg-white px-4 py-4 shadow-sm md:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:w-64">
            <Label className="mb-1.5 text-xs font-medium text-foreground">
              Market
            </Label>
            <SearchableMultiSelect
              label="Market"
              options={markets}
              selected={selectedMarkets}
              onToggle={onToggleMarket}
              onClear={onClearMarkets}
              disabled={marketsLoading}
              placeholder={marketPlaceholder}
              searchPlaceholder="Search markets…"
            />
          </div>
          <div className="w-full sm:w-52">
            <Label className="mb-1.5 text-xs font-medium text-foreground">
              Time Period
            </Label>
            <Select
              value={period}
              onValueChange={(value) => onPeriodChange(value as PeriodId)}
            >
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {period === "custom" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="w-full sm:w-44">
                <DateField
                  label="Start date"
                  value={customStart}
                  onChange={onCustomStart}
                />
              </div>
              <div className="w-full sm:w-44">
                <DateField
                  label="End date"
                  value={customEnd}
                  minIso={endMinIso}
                  onChange={onCustomEnd}
                />
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {dateError ? (
            <p className="text-sm text-destructive" role="alert">
              {dateError}
            </p>
          ) : null}
          <div className="flex shrink-0 items-center gap-1">
            {customDatesMissing ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed">
                    <Button
                      type="button"
                      className="pointer-events-none h-9 rounded-full bg-primary px-5 text-primary-foreground"
                      disabled
                    >
                      Apply Filters
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Choose a start and end date.</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                type="button"
                className="h-9 cursor-pointer rounded-full bg-primary px-5 text-primary-foreground"
                disabled={applyDisabled}
                onClick={onApply}
              >
                Apply Filters
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-9 cursor-pointer rounded-full bg-brand-soft px-3 text-primary hover:bg-brand-soft-hover hover:text-primary"
              disabled={applying}
              onClick={onClear}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
