import { type PillarDraft } from "@/components/form/pillars";

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
  title: string;
  businessOutcome: string;
  coverImageName: string;
  /**
   * In-browser preview URL for cover (`blob:...`) until upload API exists.
   *
   * TODO: After real upload, store the permanent CDN/API URL here (or add `coverImageRemoteUrl`
   * and keep blob only for local preview). Revoke blob URLs when replacing/discarding.
   */
  coverImageUrl: string;
  /** Raw file kept for future multipart/signed upload. Null in edit mode until re-picked. */
  coverImageFile: File | null;
};

export const emptyRetailerFormValues: RetailerFormValues = {
  market: "",
  targetRetailer: "",
  category: "",
  campaign: "",
  channel: "",
  title: "",
  businessOutcome: "",
  coverImageName: "",
  coverImageUrl: "",
  coverImageFile: null,
};

/** Required strategy fields. Campaign/cover/outcome are optional. Initiatives are recommended, not required. */
export function getRetailerSubmitBlockers(
  values: RetailerFormValues,
  _pillars: PillarDraft[],
): string | null {
  if (!values.market.trim()) return "Select a Market.";
  if (!values.targetRetailer.trim()) return "Select a Target Retailer.";
  if (!values.category.trim()) return "Select a Category.";
  if (!values.channel.trim()) return "Select a Channel.";
  if (!values.title.trim()) return "Enter a Title.";

  return null;
}
