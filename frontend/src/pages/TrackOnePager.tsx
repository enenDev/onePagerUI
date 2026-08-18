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
  getTrackStatuses,
  initiativeTrackKey,
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
 * Published-only Track board. Same document header as View (no More Options),
 * plus RAG dots on the pillar grid. Anyone can open; only the owner can update.
 *
 * TODO: This page already calls the right functions — do not rewrite handlers
 * or routes. Swap only the mock bodies:
 * - getOnePagerById in onePagerApi.ts (content)
 * - getTrackStatuses / updateTrackStatus in trackApi.ts (dots)
 * Keep /track/:pagerId, owner-only writes, independent pillar vs initiative status.
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
      const nextStatuses = await getTrackStatuses(pagerId);
      if (cancelled) return;
      setRecord(next);
      setStatuses(nextStatuses);
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
    if (!pagerId || !canUpdate) return;
    const previous = statuses;
    setStatuses({
      ...statuses,
      pillars: { ...statuses.pillars, [pillarNumber]: status },
    });
    const result = await updateTrackStatus({
      pagerId,
      kind: "pillar",
      pillarNumber,
      status,
    });
    if (!result.ok) setStatuses(previous);
  };

  const handleInitiativeChange = async (
    pillarNumber: number,
    initiativeNumber: number,
    status: TrackRagStatus,
  ) => {
    if (!pagerId || !canUpdate) return;
    const previous = statuses;
    setStatuses({
      ...statuses,
      initiatives: {
        ...statuses.initiatives,
        [initiativeTrackKey(pillarNumber, initiativeNumber)]: status,
      },
    });
    const result = await updateTrackStatus({
      pagerId,
      kind: "initiative",
      pillarNumber,
      initiativeNumber,
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
              onPillarChange: (pillarNumber, status) => {
                void handlePillarChange(pillarNumber, status);
              },
              onInitiativeChange: (pillarNumber, initiativeNumber, status) => {
                void handleInitiativeChange(
                  pillarNumber,
                  initiativeNumber,
                  status,
                );
              },
            }}
          />
        )}
      </PageContainer>
    </div>
  );
}
