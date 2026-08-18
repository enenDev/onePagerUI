import type { NationalOnePagerCreatePayload } from "@/services/createFormApi";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import landingOnePagersMock from "@/services/mocks/landingOnePagers.json";
import {
  CURRENT_USER_ID,
  type OnePagerListItem,
  type OnePagerStatus,
  type OnePagerType,
} from "@/types/onePager";

/**
 * In-memory landing list (session). Seeded from mocks/landingOnePagers.json.
 * TODO: Remove when FastAPI list/search owns cards. Save/publish should not
 * mutate a FE list — Home will refetch cover_image_url from the API.
 */
export const landingList: OnePagerListItem[] = structuredClone(
  landingOnePagersMock,
) as OnePagerListItem[];

function formatPublishedAt(date: Date) {
  const day = date.getDate().toString().padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ] as const;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes}`;
}

function recordStatusToListStatus(
  status: "draft" | "published",
): OnePagerStatus {
  return status === "draft" ? "DRAFT" : "PUBLISHED";
}

type UpsertLandingCardArgs = {
  pager_id: string;
  pager_type: OnePagerType;
  record_status: "draft" | "published";
  payload: NationalOnePagerCreatePayload | RetailerOnePagerCreatePayload;
};

/**
 * After mock save-draft / publish: keep Home cards in sync, including cover.
 * TODO: Delete when list API returns saved/published rows with permanent
 * cover_image_url. Do not rely on blob: URLs after form unmount revokes them.
 */
export function upsertLandingCardFromPayload({
  pager_id,
  pager_type,
  record_status,
  payload,
}: UpsertLandingCardArgs) {
  const cover_image_url = payload.cover_image?.blob_url ?? null;
  const retailer =
    pager_type === "retailer"
      ? (payload as RetailerOnePagerCreatePayload).target_retailer
      : "All Retailers";

  const next: OnePagerListItem = {
    pager_id,
    pager_type,
    market: payload.market,
    retailer,
    category: payload.category,
    campaign_focus: payload.campaign,
    channel: payload.channel,
    title: payload.title,
    business_outcome_statement: payload.business_outcome_statement,
    cover_image_url,
    scoring_mode: payload.scoring_mode,
    status: recordStatusToListStatus(record_status),
    created_by: CURRENT_USER_ID,
    published_at: formatPublishedAt(new Date()),
    pillars: [],
  };

  const index = landingList.findIndex((item) => item.pager_id === pager_id);
  if (index >= 0) {
    landingList[index] = next;
  } else {
    landingList.unshift(next);
  }
}

/**
 * Remove a card from the in-memory landing list after mock DELETE succeeds.
 * TODO: Remove when FastAPI DELETE owns persistence; Home will refetch or
 * apply the same remove-by-id against landing.items from the response.
 */
export function removeLandingCard(pager_id: string) {
  const index = landingList.findIndex((item) => item.pager_id === pager_id);
  if (index < 0) return false;
  landingList.splice(index, 1);
  return true;
}
