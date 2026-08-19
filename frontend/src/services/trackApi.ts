export type ApiTrackColor = "red" | "amber" | "green";
export type TrackRagStatus = "clear" | ApiTrackColor;

export type OnePagerTrackState = {
  pillars: Record<number, TrackRagStatus>;
  initiatives: Record<string, TrackRagStatus>;
};

/**
 * PATCH update-track body. `table` is always "pager".
 * Pillar-only: initiative_id is "". Initiative: all three ids.
 * Clear → track: null (same as GET). Else "red" | "amber" | "green".
 */
export type UpdateTrackPayload = {
  table: "pager";
  pager_id: string;
  pillar_id: string;
  initiative_id: string;
  track: ApiTrackColor | null;
  updated_by: string;
};

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export function initiativeTrackKey(
  pillarNumber: number,
  initiativeNumber: number,
) {
  return `${pillarNumber}-${initiativeNumber}`;
}

function apiTrackToUi(
  value: ApiTrackColor | null | undefined,
): TrackRagStatus {
  return value ?? "clear";
}

/** Read RAG dots from GET-by-id pillars. Missing / null = Clear. */
export function trackStateFromPillars(
  pillars: Array<{
    pillar_number: number;
    pillar_track?: ApiTrackColor | null;
    initiatives: Array<{
      initiative_number: number;
      initiative_track?: ApiTrackColor | null;
    }>;
  }>,
): OnePagerTrackState {
  const next: OnePagerTrackState = { pillars: {}, initiatives: {} };
  for (const pillar of pillars) {
    next.pillars[pillar.pillar_number] = apiTrackToUi(pillar.pillar_track);
    for (const initiative of pillar.initiatives) {
      next.initiatives[
        initiativeTrackKey(pillar.pillar_number, initiative.initiative_number)
      ] = apiTrackToUi(initiative.initiative_track);
    }
  }
  return next;
}

/**
 * TODO: Replace the function body with the real PATCH (e.g.
 * PATCH /api/one-pagers/:id/track). Temporary: delay then { ok: true }.
 * Send UpdateTrackPayload:
 * { table: "pager", pager_id, pillar_id, initiative_id, track, updated_by }.
 * Map input.status: Clear → track null; else "red" | "amber" | "green".
 * initiative_id is "" for pillar-only updates.
 * updated_by comes from the logged-in user email (user.currentUser.email).
 */
export async function updateTrackStatus(input: {
  pagerId: string;
  pillarId: string;
  initiativeId: string;
  status: TrackRagStatus;
  updated_by: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await delay();

  if (!input.pagerId.trim() || !input.pillarId.trim()) {
    return { ok: false, error: "Missing pager or pillar id." };
  }

  return { ok: true };
}
