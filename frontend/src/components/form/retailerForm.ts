import {
  getWeightedPillarWeightBlocker,
  type PillarDraft,
  type ScoringMode,
} from "@/components/form/pillars";

/**
 * Retailer create/edit strategy fields.
 * Separate from NationalFormValues — includes required Target Retailer.
 */
export type RetailerFormValues = {
  market: string;
  /** Required for retailer one-pagers (National create has no Target Retailer). */
  targetRetailer: string;
  category: string;
  campaign: string;
  channel: string;
  /** Market-dependent Business Group (required). */
  businessGroup: string;
  /** Plan year, e.g. "2026" (required). */
  year: string;
  title: string;
  businessOutcome: string;
  coverImageName: string;
  /** Signed cover URL for display. */
  coverImageUrl: string;
  /** Public cover URL for draft/publish `image_url`. */
  coverImagePublicUrl: string;
  /** Kept for compatibility; cleared after a successful upload. */
  coverImageFile: File | null;
};

export const emptyRetailerFormValues: RetailerFormValues = {
  market: "",
  targetRetailer: "",
  category: "",
  campaign: "",
  channel: "",
  businessGroup: "",
  year: "",
  title: "",
  businessOutcome: "",
  coverImageName: "",
  coverImageUrl: "",
  coverImagePublicUrl: "",
  coverImageFile: null,
};

/** Required strategy fields. Campaign/cover/outcome are optional. Initiatives are recommended, not required. */
export function getRetailerSubmitBlockers(
  values: RetailerFormValues,
  pillars: PillarDraft[],
  scoringMode: ScoringMode,
): string | null {
  if (!values?.market?.trim()) return "Select a Market.";
  if (!values?.targetRetailer?.trim()) return "Select a Target Retailer.";
  if (!values?.channel?.trim()) return "Select a Channel.";
  if (!values?.businessGroup?.trim()) return "Select a Business Group.";
  if (!values?.category?.trim()) return "Select a Category.";
  if (!values?.year?.trim()) return "Select a Year.";
  if (!values?.title?.trim()) return "Enter a Title.";

  return getWeightedPillarWeightBlocker(scoringMode, pillars);
}
