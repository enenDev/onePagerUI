import { clipToLimit, FIELD_LIMITS } from "@/components/form/fieldLimits";
import type { FilterOption } from "@/types/onePager";

function labelFor(options: FilterOption[], value: string): string {
  if (!value.trim()) return "";
  return options.find((option) => option.value === value)?.label ?? value;
}

function joinTitleParts(parts: string[]) {
  return clipToLimit(
    parts.filter((part) => part.trim().length > 0).join("-"),
    FIELD_LIMITS.title,
  );
}

type NationalTitleInput = {
  market: string;
  category: string;
  campaign: string;
  channel: string;
  markets: FilterOption[];
  categories: FilterOption[];
  campaigns: FilterOption[];
  channels: FilterOption[];
};

type RetailerTitleInput = NationalTitleInput & {
  targetRetailer: string;
  retailers: FilterOption[];
};

/** National: National-Market-Category-Campaign-Channel (empty parts omitted). */
export function buildNationalOnePagerTitle(input: NationalTitleInput) {
  return joinTitleParts([
    "National",
    labelFor(input.markets, input.market),
    labelFor(input.categories, input.category),
    labelFor(input.campaigns, input.campaign),
    labelFor(input.channels, input.channel),
  ]);
}

/**
 * Retailer: Retailer-Market-Category-Retailer-Campaign-Channel
 * (empty parts omitted; Target Retailer sits after Category).
 */
export function buildRetailerOnePagerTitle(input: RetailerTitleInput) {
  return joinTitleParts([
    "Retailer",
    labelFor(input.markets, input.market),
    labelFor(input.categories, input.category),
    labelFor(input.retailers, input.targetRetailer),
    labelFor(input.campaigns, input.campaign),
    labelFor(input.channels, input.channel),
  ]);
}
