import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { commandSubstringFilter } from "@/components/ui/command-filter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { FilterOption } from "@/types/onePager";

type SearchableMultiSelectProps = {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  /** Empty-state trigger text. Defaults to `label`. */
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
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

/**
 * Multi-select Combobox with search. Stays open while toggling options
 * (same UX as the previous FilterBar DropdownMenu).
 */
export function SearchableMultiSelect({
  label,
  options,
  selected,
  onToggle,
  disabled = false,
  placeholder = label,
  searchPlaceholder = `Search ${label}…`,
  className,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerLabel = multiSelectLabel(placeholder, selected, options);
  const hasSelection = selected.length > 0;

  const handleOpenChange = (next: boolean) => {
    if (disabled) return;
    setOpen(next);
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-input bg-white py-2 pr-2 pl-2.5 text-sm whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            hasSelection ? "text-foreground" : "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 truncate text-left">{triggerLabel}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command filter={commandSubstringFilter}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>
              {options.length === 0 ? "No options" : "No options found."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isChecked = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    keywords={[option.value, option.label]}
                    className="cursor-pointer gap-2"
                    onSelect={() => {
                      onToggle(option.value);
                    }}
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
                      {isChecked ? (
                        <Check className="size-3 stroke-[3]" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
