import { landingOnePagers } from "@/services/landingSampleData";
import {
  toOnePagerSearchPayload,
  type FilterPayload,
  type OnePagerListItem,
} from "@/types/onePager";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function matchesFilter(item: OnePagerListItem, filters: FilterPayload) {
  // Multi-select: empty array = no constraint; non-empty = OR match on that key.
  if (filters.market.length > 0 && !filters.market.includes(item.market)) {
    return false;
  }
  if (
    filters.retailer.length > 0 &&
    !filters.retailer.includes(item.retailer)
  ) {
    return false;
  }
  if (filters.channel.length > 0 && !filters.channel.includes(item.channel)) {
    return false;
  }
  if (
    filters.category.length > 0 &&
    !filters.category.includes(item.category)
  ) {
    return false;
  }
  if (
    filters.campaign.length > 0 &&
    !filters.campaign.includes(item.campaign_focus)
  ) {
    return false;
  }
  return true;
}

/**
 * TODO: Replace with real FastAPI list/search endpoint.
 * Temporary: normalize to array-only payload, then filter `landingSampleData`
 * in-memory (used by Submit + Clear all).
 * Next: POST /api/one-pagers/search with JSON body from toOnePagerSearchPayload —
 * always `{ market: string[], retailer: string[], channel: string[],
 * category: string[], campaign: string[] }` (never scalar strings).
 * Prefer server-side Active/Drafts/Archive + All/My if product agrees; today those
 * tabs are filtered on the FE from this full mock list.
 * Keep stable: FilterPayload / toOnePagerSearchPayload array shape,
 * OnePagerListItem[] response.
 * Remove dependency on `landingSampleData` once API returns real cards.
 */
export async function submitOnePagerSearch(
  filters: FilterPayload,
): Promise<OnePagerListItem[]> {
  // Backend contract: each dropdown is an array only.
  const payload = toOnePagerSearchPayload(filters);
  await delay();
  return landingOnePagers.filter((item) => matchesFilter(item, payload));
}
