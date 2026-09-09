import { clipToLimit, FIELD_LIMITS } from "@/components/form/fieldLimits";
import type { FilterOption } from "@/types/onePager";

function labelFor(options: FilterOption[], value: string = "  "): string {
  if (!value?.trim()) return "";
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
  businessGroup: string;
  year: string;
  markets: FilterOption[];
  categories: FilterOption[];
  campaigns: FilterOption[];
  channels: FilterOption[];
  businessGroups: FilterOption[];
};

type RetailerTitleInput = NationalTitleInput & {
  targetRetailer: string;
  retailers: FilterOption[];
};

/**
 * National: National-Channel-BusinessGroup-Category-Campaign-Year
 * (empty parts omitted; Year value is already its own label).
 */
export function buildNationalOnePagerTitle(input: NationalTitleInput) {
  return joinTitleParts([
    "National",
    labelFor(input.channels, input.channel),
    labelFor(input.businessGroups, input.businessGroup),
    labelFor(input.categories, input.category),
    labelFor(input.campaigns, input.campaign),
    input.year.trim(),
  ]);
}

/**
 * Retailer: {TargetRetailer}-Channel-BusinessGroup-Category-Campaign-Year
 * (empty parts omitted; leads with the selected Target Retailer's label).
 */
export function buildRetailerOnePagerTitle(input: RetailerTitleInput) {
  return joinTitleParts([
    labelFor(input.retailers, input.targetRetailer),
    labelFor(input.channels, input.channel),
    labelFor(input.businessGroups, input.businessGroup),
    labelFor(input.categories, input.category),
    labelFor(input.campaigns, input.campaign),
    input.year.trim(),
  ]);
}
