import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMetadata, fetchOnePagers } from "@/redux/landingSlice";
import {
  createEmptyFilters,
  type OnePagerListItem,
  type OnePagerStatus,
} from "@/types/onePager";
import { cn } from "@/lib/utils";

type ImportFilters = {
  market: string;
  category: string;
  campaign: string;
  channel: string;
};

const EMPTY_FILTERS: ImportFilters = {
  market: "",
  category: "",
  campaign: "",
  channel: "",
};

type ImportFromNationalPickerProps = {
  onSubmit: (item: OnePagerListItem) => void;
};

function uniqueSorted(
  items: OnePagerListItem[],
  key: "channel" | "category" | "campaign_focus",
) {
  return [...new Set(items.map((item) => item[key]).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function statusLabel(status: OnePagerStatus) {
  if (status === "ACTIVE") return "Active";
  if (status === "ARCHIVE") return "Archive";
  return "Draft";
}

function statusBadgeClass(status: OnePagerStatus) {
  if (status === "ACTIVE") return "bg-emerald-100 text-emerald-800";
  if (status === "ARCHIVE") return "bg-orange-100 text-orange-800";
  return "bg-slate-100 text-slate-700";
}

function matchesImportFilters(item: OnePagerListItem, filters: ImportFilters) {
  if (filters.market && item.market !== filters.market) return false;
  if (filters.category && item.category !== filters.category) return false;
  if (filters.campaign && item.campaign_focus !== filters.campaign) return false;
  if (filters.channel && item.channel !== filters.channel) return false;
  return true;
}

export function ImportFromNationalPicker({
  onSubmit,
}: ImportFromNationalPickerProps) {
  const dispatch = useAppDispatch();
  const filterMetadata = useAppSelector((state) => state.landing.metadata);
  const items = useAppSelector((state) => state.landing.items);
  const listLoading = useAppSelector((state) => state.landing.listLoading);
  const listError = useAppSelector((state) => state.landing.error);
  const [filters, setFilters] = useState<ImportFilters>(EMPTY_FILTERS);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const marketOptions = filterMetadata?.market ?? [];

  useEffect(() => {
    if (filterMetadata) return;
    void dispatch(fetchMetadata());
  }, [dispatch, filterMetadata]);

  useEffect(() => {
    // TODO: Import list loads via fetchOnePagers(createEmptyFilters()) →
    // submitOnePagerSearch mock (same thunk as Home). This overwrites
    // landing.items with the unfiltered mock list while the popup is open.
    // Next: FastAPI national list for import, e.g.
    // GET /api/one-pagers/search?pager_type=national excluding drafts —
    // ideally a dedicated import endpoint or scoped fetch so Home filters /
    // landing.items are not clobbered. Popup market/category/campaign/channel
    // filters stay client-side on the already-loaded list (do not re-fetch).
    // Market options reuse landing.metadata (getMetadata). Category / Campaign /
    // Channel options stay derived from the loaded national (non-draft) list.
    // Keep OnePagerListItem + pager_id / pager_type / status shape stable.
    void dispatch(fetchOnePagers(createEmptyFilters()));
  }, [dispatch]);

  const nationalItems = useMemo(
    () =>
      items.filter(
        (item) => item.pager_type === "national" && item.status !== "DRAFT",
      ),
    [items],
  );

  const categoryOptions = useMemo(
    () => uniqueSorted(nationalItems, "category"),
    [nationalItems],
  );
  const campaignOptions = useMemo(
    () => uniqueSorted(nationalItems, "campaign_focus"),
    [nationalItems],
  );
  const channelOptions = useMemo(
    () => uniqueSorted(nationalItems, "channel"),
    [nationalItems],
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

  const patchFilter = (key: keyof ImportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const errorMessage = listError
    ? "Could not load national one-pagers."
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm font-semibold text-foreground">
          Filters
        </span>

        <PillSelect
          key={`market-${filterResetKey}`}
          placeholder="Market"
          value={filters.market}
          options={marketOptions}
          onChange={(value) => patchFilter("market", value)}
        />
        <PillSelect
          key={`category-${filterResetKey}`}
          placeholder="Category"
          value={filters.category}
          options={categoryOptions.map((value) => ({ label: value, value }))}
          onChange={(value) => patchFilter("category", value)}
        />
        <PillSelect
          key={`campaign-${filterResetKey}`}
          placeholder="Campaign"
          value={filters.campaign}
          options={campaignOptions.map((value) => ({ label: value, value }))}
          onChange={(value) => patchFilter("campaign", value)}
        />
        <PillSelect
          key={`channel-${filterResetKey}`}
          placeholder="Channel"
          value={filters.channel}
          options={channelOptions.map((value) => ({ label: value, value }))}
          onChange={(value) => patchFilter("channel", value)}
        />

        <button
          type="button"
          className="ml-auto cursor-pointer text-sm font-medium text-primary hover:underline"
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
          ) : errorMessage ? (
            <p className="px-3 py-6 text-sm text-destructive">{errorMessage}</p>
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
}: {
  placeholder: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || undefined}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <SelectTrigger className="h-8 cursor-pointer rounded-full bg-white px-3">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start">
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            No options
          </p>
        ) : (
          options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="cursor-pointer"
            >
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
