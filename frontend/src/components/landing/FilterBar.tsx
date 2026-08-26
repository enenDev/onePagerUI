import { Check, ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarketRequiredTooltip } from "@/components/ui/market-required-tooltip";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearFilters,
  fetchOnePagers,
  toggleFilterValue,
} from "@/redux/landingSlice";
import { unionMarketScopedOptions } from "@/services/metadataApi";
import type { FilterKey, FilterOption } from "@/types/onePager";
import { createEmptyFilters } from "@/types/onePager";
import { cn } from "@/lib/utils";

const FILTER_FIELDS: { key: FilterKey; label: string }[] = [
  { key: "market", label: "Market" },
  { key: "retailer", label: "Retailer" },
  { key: "channel", label: "Channel" },
  { key: "category", label: "Category" },
  { key: "campaign", label: "Campaign" },
];

type FilterBarProps = {
  onCreateNew: () => void;
  /** Hide for read-only users (user_type_3). Default true. */
  showCreateNew?: boolean;
};

function multiSelectLabel(
  placeholder: string,
  selected: string[],
  options: FilterOption[],
) {
  if (selected.length === 0) return placeholder;
  if (selected.length === 1) {
    return (
      options.find((option) => option.value === selected[0])?.label ??
      selected[0]
    );
  }
  return `${selected.length} selected`;
}

function MultiSelectFilter({
  label,
  options,
  selected,
  disabled,
  onToggle,
}: {
  label: string;
  options: FilterOption[];
  selected: string[];
  disabled?: boolean;
  onToggle: (value: string) => void;
}) {
  const triggerLabel = multiSelectLabel(label, selected, options);
  const hasSelection = selected.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-white py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            hasSelection ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span className="min-w-0 truncate text-left">{triggerLabel}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-(--radix-dropdown-menu-trigger-width)"
      >
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No options
          </p>
        ) : (
          options.map((option) => {
            const isChecked = selected.includes(option.value);
            return (
              <DropdownMenuItem
                key={option.value}
                // Keep menu open so users can pick multiple values in one pass.
                onSelect={(event) => {
                  event.preventDefault();
                  onToggle(option.value);
                }}
                className="cursor-pointer gap-2"
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-[3px] border-2",
                    isChecked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/55 bg-white",
                  )}
                >
                  {isChecked ? <Check className="size-3 stroke-[3]" /> : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar({
  onCreateNew,
  showCreateNew = true,
}: FilterBarProps) {
  const dispatch = useAppDispatch();
  const { metadata, filters, listLoading, metadataLoading } = useAppSelector(
    (state) => state.landing,
  );

  const marketSelected = filters.market.length > 0;
  const dependentsDisabled =
    metadataLoading || !metadata || !marketSelected;
  // Tooltip only when Market is empty — not while metadata is still loading.
  const showMarketRequiredTooltip =
    !marketSelected && !metadataLoading && Boolean(metadata);

  const handleSubmit = () => {
    // TODO: Replace submit with real FastAPI search.
    // Temporary: dispatch(fetchOnePagers) → submitOnePagerSearch mock, which
    // builds array-only body via toOnePagerSearchPayload.
    // Next: POST /api/one-pagers/search with JSON:
    // { market: string[], retailer: string[], channel: string[],
    //   category: string[], campaign: string[] }
    // (OR within key, AND across keys; [] = no constraint).
    // Keep stable: FilterPayload / toOnePagerSearchPayload, Submit UX,
    // Redux filters state, OnePagerListItem[] response.
    void dispatch(fetchOnePagers(filters));
  };

  const handleClear = () => {
    // TODO: Clear still goes through the mock list API after resetting local state.
    // Temporary: clearFilters() resets Redux multi-select arrays; then
    // fetchOnePagers(createEmptyFilters()) reloads the unfiltered mock list.
    // Next: same FastAPI search endpoint with empty arrays (or omit filters);
    // optionally skip refetch if product prefers client-only clear until Submit.
    // Keep stable: createEmptyFilters() / empty multi-select UI, Clear all label,
    // and that all five filter keys reset together.
    dispatch(clearFilters());
    void dispatch(fetchOnePagers(createEmptyFilters()));
  };

  const optionsFor = (key: FilterKey): FilterOption[] => {
    if (!metadata) return [];
    if (key === "market") return metadata.market;
    if (!marketSelected) return [];
    return unionMarketScopedOptions(metadata, filters.market, key);
  };

  return (
    <div className="flex w-full items-center gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-white/80 p-3">
        <span className="shrink-0 text-sm font-semibold text-foreground">
          Filters
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {FILTER_FIELDS.map((field) => {
            const options = optionsFor(field.key);
            const selected = filters[field.key];
            const disabled =
              field.key === "market"
                ? metadataLoading || !metadata
                : dependentsDisabled;

            return (
              <div key={field.key} className="min-w-0 flex-1">
                <MarketRequiredTooltip
                  show={
                    field.key !== "market" && showMarketRequiredTooltip
                  }
                >
                  <MultiSelectFilter
                    label={field.label}
                    options={options}
                    selected={selected}
                    disabled={disabled}
                    onToggle={(value) =>
                      dispatch(toggleFilterValue({ key: field.key, value }))
                    }
                  />
                </MarketRequiredTooltip>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={listLoading}
            className="h-9 cursor-pointer rounded-full bg-primary px-5 text-primary-foreground"
          >
            Submit
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            disabled={listLoading}
            className="h-9 cursor-pointer rounded-full bg-brand-soft px-3 text-primary hover:bg-brand-soft-hover hover:text-primary"
          >
            Clear all
          </Button>
        </div>
      </div>

      {showCreateNew && (
        <Button
          type="button"
          onClick={onCreateNew}
          className="h-9 shrink-0 cursor-pointer rounded-full bg-primary px-4 text-primary-foreground"
        >
          <Plus className="size-4" />
          Create New
        </Button>
      )}
    </div>
  );
}
