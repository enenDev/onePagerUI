import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarketRequiredTooltip } from "@/components/ui/market-required-tooltip";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearFilters,
  fetchOnePagers,
  toggleFilterValue,
} from "@/redux/landingSlice";
import { unionMarketScopedOptions } from "@/services/metadataApi";
import type { FilterKey, FilterOption } from "@/types/onePager";
import { createEmptyFilters } from "@/types/onePager";

const FILTER_FIELDS: { key: FilterKey; label: string }[] = [
  { key: "market", label: "Market" },  
  { key: "channel", label: "Channel" },
  { key: "retailer", label: "Retailer" },
  { key: "category", label: "Category" },
  { key: "campaign", label: "Campaign" },
];

type FilterBarProps = {
  onCreateNew: () => void;
  /** Hide for read-only users (user_type_3). Default true. */
  showCreateNew?: boolean;
};

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
      <div className="flex min-w-0 flex-1 items-end gap-2 rounded-lg border border-border bg-white/80 px-3 pt-1.5 pb-2.5">
        <div className="flex min-w-0 flex-1 items-end gap-2">
          {FILTER_FIELDS.map((field) => {
            const options = optionsFor(field.key);
            const selected = filters[field.key];
            const disabled =
              field.key === "market"
                ? metadataLoading || !metadata
                : dependentsDisabled;

            return (
              <div key={field.key} className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs font-medium text-foreground">
                  {field.label}
                </Label>
                <MarketRequiredTooltip
                  show={
                    field.key !== "market" && showMarketRequiredTooltip
                  }
                >
                  <SearchableMultiSelect
                    label={field.label}
                    placeholder="Select"
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
          className="h-9 shrink-0 cursor-pointer rounded-lg bg-primary px-4 text-primary-foreground"
        >
          <Plus className="size-4" />
          Create New
        </Button>
      )}
    </div>
  );
}
