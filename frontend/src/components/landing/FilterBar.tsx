import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearFilters,
  fetchOnePagers,
  setFilter,
} from "@/redux/landingSlice";
import type { FilterKey } from "@/types/onePager";
import { emptyFilters } from "@/types/onePager";

const FILTER_FIELDS: { key: FilterKey; label: string }[] = [
  { key: "market", label: "Market" },
  { key: "retailer", label: "Retailer" },
  { key: "channel", label: "Channel" },
  { key: "category", label: "Category" },
  { key: "campaign", label: "Campaign" },
];

type FilterBarProps = {
  onCreateNew: () => void;
};

export function FilterBar({ onCreateNew }: FilterBarProps) {
  const dispatch = useAppDispatch();
  const { metadata, filters, listLoading, metadataLoading } = useAppSelector(
    (state) => state.landing,
  );

  const handleSubmit = () => {
    void dispatch(fetchOnePagers(filters));
  };

  const handleClear = () => {
    dispatch(clearFilters());
    void dispatch(fetchOnePagers(emptyFilters));
  };

  return (
    <div className="flex w-full items-center gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-white/80 p-3">
        <span className="shrink-0 text-sm font-semibold text-foreground">
          Filters
        </span>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {FILTER_FIELDS.map((field) => {
            const options = metadata?.[field.key] ?? [];
            const value = filters[field.key];

            return (
              <div key={field.key} className="min-w-0 flex-1">
                <Select
                  value={value || undefined}
                  onValueChange={(next) =>
                    dispatch(setFilter({ key: field.key, value: next ?? "" }))
                  }
                  disabled={metadataLoading || !metadata}
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer rounded-lg bg-white">
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
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

      <Button
        type="button"
        onClick={onCreateNew}
        className="h-9 shrink-0 cursor-pointer rounded-full bg-primary px-4 text-primary-foreground"
      >
        <Plus className="size-4" />
        Create New
      </Button>
    </div>
  );
}
