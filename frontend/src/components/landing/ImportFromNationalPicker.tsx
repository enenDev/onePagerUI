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
import { getMetadata } from "@/services/metadataApi";
import { submitOnePagerSearch } from "@/services/onePagerApi";
import {
  createEmptyFilters,
  type FilterOption,
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
  const [items, setItems] = useState<OnePagerListItem[]>([]);
  const [marketOptions, setMarketOptions] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ImportFilters>(EMPTY_FILTERS);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // TODO: This list is the mock landing search (submitOnePagerSearch →
      // mocks/landingOnePagers.json). Next: swap to FastAPI national list, e.g.
      // GET /api/one-pagers/search?pager_type=national excluding drafts, plus
      // GET /api/metadata for Market / Category / Campaign / Channel options.
      // Keep OnePagerListItem + pager_id / pager_type stable.
      try {
        const [results, metadata] = await Promise.all([
          submitOnePagerSearch(createEmptyFilters()),
          getMetadata(),
        ]);
        if (cancelled) return;
        setItems(
          results.filter(
            (item) =>
              item.pager_type === "national" && item.status !== "DRAFT",
          ),
        );
        setMarketOptions(metadata.market);
        setError(null);
      } catch {
        if (cancelled) return;
        setError("Could not load national one-pagers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(
    () => uniqueSorted(items, "category"),
    [items],
  );
  const campaignOptions = useMemo(
    () => uniqueSorted(items, "campaign_focus"),
    [items],
  );
  const channelOptions = useMemo(() => uniqueSorted(items, "channel"), [items]);

  const visibleItems = useMemo(
    () => items.filter((item) => matchesImportFilters(item, filters)),
    [items, filters],
  );

  const selectedItem =
    items.find((item) => item.pager_id === selectedId) ?? null;
  const selectedVisible = visibleItems.some(
    (item) => item.pager_id === selectedId,
  );

  const patchFilter = (key: keyof ImportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

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
          {loading ? (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              Loading national one-pagers…
            </p>
          ) : error ? (
            <p className="px-3 py-6 text-sm text-destructive">{error}</p>
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
