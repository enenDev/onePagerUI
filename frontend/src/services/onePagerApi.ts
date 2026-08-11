import { landingOnePagers } from "@/services/landingSampleData";
import type { FilterPayload, OnePagerListItem } from "@/types/onePager";

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function matchesFilter(item: OnePagerListItem, filters: FilterPayload) {
  if (filters.market && item.market !== filters.market) return false;
  if (filters.retailer && item.retailer !== filters.retailer) return false;
  if (filters.channel && item.channel !== filters.channel) return false;
  if (filters.category && item.category !== filters.category) return false;
  if (filters.campaign && item.campaign_focus !== filters.campaign) return false;
  return true;
}

/**
 * Mock list/search API.
 * Returns all statuses in one response; Active/Drafts/Archive + All/My are UI-filtered.
 */
export async function submitOnePagerSearch(
  filters: FilterPayload,
): Promise<OnePagerListItem[]> {
  await delay();
  return landingOnePagers.filter((item) => matchesFilter(item, filters));
}
