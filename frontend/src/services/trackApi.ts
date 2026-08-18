export type TrackRagStatus = "clear" | "red" | "amber" | "green";

export type OnePagerTrackState = {
  pillars: Record<number, TrackRagStatus>;
  initiatives: Record<string, TrackRagStatus>;
};

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO: Replace this in-memory Map with FastAPI track endpoints.
 * Temporary: statuses live only in the browser session, keyed by pager id.
 * Next:
 * - GET /api/one-pagers/:id/track → OnePagerTrackState
 * - PATCH /api/one-pagers/:id/track with { kind, pillar_number, initiative_number?, status }
 * Keep: TrackRagStatus (clear | red | amber | green), independent pillar vs
 * initiative values, owner-only writes on the server.
 */
const trackByPager = new Map<string, OnePagerTrackState>();

export function initiativeTrackKey(
  pillarNumber: number,
  initiativeNumber: number,
) {
  return `${pillarNumber}-${initiativeNumber}`;
}

function emptyState(): OnePagerTrackState {
  return { pillars: {}, initiatives: {} };
}

function cloneState(state: OnePagerTrackState): OnePagerTrackState {
  return {
    pillars: { ...state.pillars },
    initiatives: { ...state.initiatives },
  };
}

/**
 * TODO: Swap body for GET /api/one-pagers/:id/track.
 * Missing keys mean Clear. Keep OnePagerTrackState shape.
 */
export async function getTrackStatuses(
  pagerId: string,
): Promise<OnePagerTrackState> {
  await delay();
  const stored = trackByPager.get(pagerId);
  return stored ? cloneState(stored) : emptyState();
}

/**
 * TODO: Swap body for PATCH /api/one-pagers/:id/track.
 * Keep request fields: kind, pillar_number, optional initiative_number, status.
 * Server should 403 non-owners; FE already disables the dots.
 */
export async function updateTrackStatus(input: {
  pagerId: string;
  kind: "pillar" | "initiative";
  pillarNumber: number;
  initiativeNumber?: number;
  status: TrackRagStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await delay();
  const current = trackByPager.get(input.pagerId) ?? emptyState();
  const next = cloneState(current);

  if (input.kind === "pillar") {
    next.pillars[input.pillarNumber] = input.status;
  } else {
    if (input.initiativeNumber == null) {
      return { ok: false, error: "Missing initiative number." };
    }
    next.initiatives[
      initiativeTrackKey(input.pillarNumber, input.initiativeNumber)
    ] = input.status;
  }

  trackByPager.set(input.pagerId, next);
  return { ok: true };
}
