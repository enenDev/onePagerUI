import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarketRequiredTooltip } from "@/components/ui/market-required-tooltip";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMetadata } from "@/redux/landingSlice";
import { unionMarketScopedOptions } from "@/services/metadataApi";
import { submitOnePagerSearch } from "@/services/onePagerApi";
import {
  createEmptyFilters,
  type FilterOption,
  type MarketScopedFilterKey,
  type OnePagerListItem,
  type OnePagerStatus,
} from "@/types/onePager";
import { getYearOptions } from "@/lib/years";
import { cn } from "@/lib/utils";

type ImportFilterKey =
  | "market"
  | "channel"
  | "business_group"
  | "category"
  | "campaign"
  | "year";

type ImportFilters = Record<ImportFilterKey, string>;

const EMPTY_FILTERS: ImportFilters = {
  market: "",
  channel: "",
  business_group: "",
  category: "",
  campaign: "",
  year: "",
};

const DEPENDENT_FILTER_KEYS = [
  "channel",
  "business_group",
  "category",
  "campaign",
] as const satisfies ReadonlyArray<Exclude<ImportFilterKey, "market" | "year">>;

const IMPORT_FILTER_FIELDS: {
  key: ImportFilterKey;
  label: string;
  independent?: boolean;
}[] = [
  { key: "market", label: "Market" },
  { key: "channel", label: "Channel" },
  { key: "business_group", label: "Business Group" },
  { key: "category", label: "Category" },
  { key: "campaign", label: "Campaign" },
  { key: "year", label: "Year", independent: true },
];

const YEAR_OPTIONS = getYearOptions();

type ImportFromNationalPickerProps = {
  onSubmit: (item: OnePagerListItem) => void;
};

function statusLabel(status: OnePagerStatus) {
  if (status === "PUBLISHED") return "Active";
  if (status === "ARCHIVED") return "Archive";
  if (status === "DELETED") return "Deleted";
  return "Draft";
}

function statusBadgeClass(status: OnePagerStatus) {
  if (status === "PUBLISHED") return "bg-emerald-100 text-emerald-800";
  if (status === "ARCHIVED") return "bg-orange-100 text-orange-800";
  if (status === "DELETED") return "bg-rose-100 text-rose-800";
  return "bg-slate-100 text-slate-700";
}

function matchesImportFilters(item: OnePagerListItem, filters: ImportFilters) {
  if (filters.market && item.market !== filters.market) return false;
  if (filters.channel && item.channel !== filters.channel) return false;
  if (
    filters.business_group &&
    (item.business_group ?? "") !== filters.business_group
  ) {
    return false;
  }
  if (filters.category && item.category !== filters.category) return false;
  if (filters.campaign && item.campaign_focus !== filters.campaign) {
    return false;
  }
  if (filters.year && (item.year ?? "") !== filters.year) return false;
  return true;
}

export function ImportFromNationalPicker({
  onSubmit,
}: ImportFromNationalPickerProps) {
  const dispatch = useAppDispatch();
  const filterMetadata = useAppSelector((state) => state.landing.metadata);
  const metadataLoading = useAppSelector(
    (state) => state.landing.metadataLoading,
  );
  const [items, setItems] = useState<OnePagerListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ImportFilters>(EMPTY_FILTERS);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const marketSelected = Boolean(filters.market);
  const dependentsDisabled =
    metadataLoading || !filterMetadata || !marketSelected;
  const showMarketRequiredTooltip =
    !marketSelected && !metadataLoading && Boolean(filterMetadata);

  useEffect(() => {
    if (filterMetadata) return;
    void dispatch(fetchMetadata());
  }, [dispatch, filterMetadata]);

  useEffect(() => {
    // TODO: Import list still uses submitOnePagerSearch(createEmptyFilters()) —
    // the same POST as Home — but the response lives in this picker's local
    // state, not Redux landing.items / listLoading. That keeps Home cards and
    // applied Home filters unchanged while the popup is open.
    // Next: FastAPI national list for import, e.g.
    // GET /api/one-pagers/search?pager_type=national excluding drafts.
    // Popup filters stay client-side on this local list (do not re-fetch).
    // Market + Channel / Business Group / Category / Campaign reuse
    // landing.metadata (getMetadata); Year uses getYearOptions(). Retailer is
    // omitted — national records have no retailer. Keep OnePagerListItem +
    // pager_id / pager_type / status shape stable.
    let cancelled = false;

    const loadImportList = async () => {
      setListLoading(true);
      setListError(null);
      try {
        const pagers = await submitOnePagerSearch(createEmptyFilters());
        if (!cancelled) {
          setItems(pagers);
        }
      } catch {
        if (!cancelled) {
          setListError("Could not load national one-pagers.");
        }
      } finally {
        if (!cancelled) {
          setListLoading(false);
        }
      }
    };

    void loadImportList();
    return () => {
      cancelled = true;
    };
  }, []);

  const nationalItems = useMemo(
    () =>
      items.filter(
        (item) => item.pager_type === "national" && item.status !== "DRAFT",
      ),
    [items],
  );

  const visibleItems = useMemo(
    () =>
      nationalItems.filter((item) => matchesImportFilters(item, filters)),
    [nationalItems, filters],
  );

  const selectedItem =
    nationalItems.find((item) => item.pager_id === selectedId) ?? null;
  const selectedVisible = visibleItems.some(
    (item) => item.pager_id === selectedId,
  );

  const optionsFor = (key: ImportFilterKey): FilterOption[] => {
    if (key === "year") return YEAR_OPTIONS;
    if (!filterMetadata) return [];
    if (key === "market") return filterMetadata.market;
    if (!marketSelected) return [];
    return unionMarketScopedOptions(
      filterMetadata,
      [filters.market],
      key as MarketScopedFilterKey,
    );
  };

  const patchFilter = (key: ImportFilterKey, value: string) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "market") {
        for (const dependent of DEPENDENT_FILTER_KEYS) {
          next[dependent] = "";
        }
      }
      return next;
    });
    if (key === "market") {
      setFilterResetKey((resetKey) => resetKey + 1);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm font-semibold text-foreground">
          Filters
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {IMPORT_FILTER_FIELDS.map((field) => {
            const disabled = field.independent
              ? false
              : field.key === "market"
                ? metadataLoading || !filterMetadata
                : dependentsDisabled;

            return (
              <div key={field.key} className="min-w-0 w-0 flex-1">
                <MarketRequiredTooltip
                  show={
                    field.key !== "market" &&
                    !field.independent &&
                    showMarketRequiredTooltip
                  }
                >
                  <PillSelect
                    key={`${field.key}-${filterResetKey}`}
                    placeholder={field.label}
                    value={filters[field.key]}
                    options={optionsFor(field.key)}
                    disabled={disabled}
                    onChange={(value) => patchFilter(field.key, value)}
                  />
                </MarketRequiredTooltip>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="shrink-0 cursor-pointer text-sm font-medium text-primary hover:underline"
          onClick={() => {
            setFilters({ ...EMPTY_FILTERS });
            setFilterResetKey((key) => key + 1);
          }}
        >
          Clear all
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <Label className="text-sm font-medium text-foreground">
          Select to Import National One-Pager{" "}
          <span className="text-destructive">*</span>
        </Label>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
          {listLoading ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              Loading national one-pagers…
            </p>
          ) : listError ? (
            <p className="px-3 py-6 text-sm text-destructive">{listError}</p>
          ) : visibleItems.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              No national one-pagers match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {visibleItems.map((item) => {
                const selected = item.pager_id === selectedId;
                return (
                  <li key={item.pager_id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition-colors",
                        selected ? "bg-accent" : "bg-white hover:bg-muted/60",
                      )}
                      onClick={() => setSelectedId(item.pager_id)}
                    >
                      <span className="min-w-0 truncate text-sm text-foreground">
                        {item.title}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "rounded-full hover:bg-inherit",
                          statusBadgeClass(item.status),
                        )}
                      >
                        {statusLabel(item.status)}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          className="h-9 cursor-pointer rounded-full px-5"
          disabled={!selectedItem || !selectedVisible}
          onClick={() => {
            if (selectedItem && selectedVisible) {
              onSubmit(selectedItem);
            }
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  );
}

function PillSelect({
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}: {
  placeholder: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <SearchableSelect
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder={`Search ${placeholder}…`}
      disabled={disabled}
      className="h-8 min-w-0 w-full cursor-pointer overflow-hidden rounded-full bg-white px-3"
    />
  );
}
