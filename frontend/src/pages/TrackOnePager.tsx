import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { PageContainer } from "@/components/layout/PageContainer";
import { NationalPreviewDocument } from "@/components/preview/NationalPreviewDocument";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
} from "@/components/preview/nationalPreview";
import { Button } from "@/components/ui/button";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import {
  getOnePagerById,
  type OnePagerByIdRecord,
} from "@/services/onePagerApi";
import {
  initiativeTrackKey,
  trackStateFromPillars,
  updateTrackStatus,
  type OnePagerTrackState,
  type TrackRagStatus,
} from "@/services/trackApi";
import { isCurrentUserOwner } from "@/types/onePager";

function composeTitle(record: OnePagerByIdRecord) {
  if (record.pager_type === "retailer") {
    return composeRetailerPreviewTitle(record.payload);
  }
  return composeNationalPreviewTitle(record.payload);
}

/**
 * Published-only Track board. Same GET-by-id as View/Edit; dots come from
 * pillar_track / initiative_track. PATCH uses pager_id + pillar_id +
 * initiative_id ("" for pillar-only) from that GET.
 *
 * TODO: Swap getOnePagerById / updateTrackStatus bodies only.
 * Keep this page looking up pillar_id / initiative_id from the mapped record.
 */
export function TrackOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const navigate = useNavigate();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [record, setRecord] = useState<OnePagerByIdRecord | null>(null);
  const [statuses, setStatuses] = useState<OnePagerTrackState>({
    pillars: {},
    initiatives: {},
  });
  const [error, setError] = useState<string | null>(null);
  const displayError = pagerId ? error : "Missing one-pager id.";

  useEffect(() => {
    setBackHandler(() => navigate("/home"));
    return () => {
      setHeaderTitle(null);
      setBackHandler(null);
    };
  }, [navigate, setBackHandler, setHeaderTitle]);

  useEffect(() => {
    if (!record) {
      setHeaderTitle("Track One-Pager");
      return;
    }
    setHeaderTitle(composeTitle(record));
  }, [record, setHeaderTitle]);

  useEffect(() => {
    if (!pagerId) return;

    let cancelled = false;

    void (async () => {
      const next = await getOnePagerById(pagerId);
      if (cancelled) return;
      if (!next) {
        setError("Could not load the one-pager.");
        return;
      }
      if (next.list_status !== "PUBLISHED") {
        setError("Only published one-pagers can be tracked.");
        return;
      }
      setRecord(next);
      setStatuses(trackStateFromPillars(next.payload.pillars));
    })();

    return () => {
      cancelled = true;
    };
  }, [pagerId]);

  const canUpdate = record ? isCurrentUserOwner(record.created_by) : false;

  const handlePillarChange = async (
    pillarNumber: number,
    status: TrackRagStatus,
  ) => {
    if (!record || !canUpdate) return;
    const pillar = record.payload.pillars.find(
      (item) => item.pillar_number === pillarNumber,
    );
    if (!pillar?.pillar_id) return;

    const previous = statuses;
    setStatuses({
      ...statuses,
      pillars: { ...statuses.pillars, [pillarNumber]: status },
    });
    const result = await updateTrackStatus({
      pagerId: record.id,
      pillarId: pillar.pillar_id,
      initiativeId: "",
      status,
    });
    if (!result.ok) setStatuses(previous);
  };

  const handleInitiativeChange = async (
    pillarNumber: number,
    initiativeNumber: number,
    status: TrackRagStatus,
  ) => {
    if (!record || !canUpdate) return;
    const pillar = record.payload.pillars.find(
      (item) => item.pillar_number === pillarNumber,
    );
    const initiative = pillar?.initiatives.find(
      (item) => item.initiative_number === initiativeNumber,
    );
    if (!pillar?.pillar_id || !initiative?.initiative_id) return;

    const previous = statuses;
    setStatuses({
      ...statuses,
      initiatives: {
        ...statuses.initiatives,
        [initiativeTrackKey(pillarNumber, initiativeNumber)]: status,
      },
    });
    const result = await updateTrackStatus({
      pagerId: record.id,
      pillarId: pillar.pillar_id,
      initiativeId: initiative.initiative_id,
      status,
    });
    if (!result.ok) setStatuses(previous);
  };

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] w-full flex-col">
      <PageContainer className="flex flex-1 flex-col py-6">
        {displayError ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-destructive">{displayError}</p>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => navigate("/home")}
            >
              Back to home
            </Button>
          </div>
        ) : !record ? (
          <Loading label="Loading track…" />
        ) : (
          <NationalPreviewDocument
            payload={record.payload}
            owner={record.created_by}
            publishedAt={record.published_at}
            status={record.list_status}
            moreOptionsEnabled
            hideMoreOptions
            track={{
              canUpdate,
              statuses,
              onPillarChange: handlePillarChange,
              onInitiativeChange: handleInitiativeChange,
            }}
          />
        )}
      </PageContainer>
    </div>
  );
}
