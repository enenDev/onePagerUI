import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { FormToast } from "@/components/form/FormToast";
import { ArchiveOnePagerModal } from "@/components/landing/ArchiveOnePagerModal";
import { DeleteOnePagerModal } from "@/components/landing/DeleteOnePagerModal";
import { EditPublishedOnePagerModal } from "@/components/landing/EditPublishedOnePagerModal";
import { PageContainer } from "@/components/layout/PageContainer";
import { NationalPreviewDocument } from "@/components/preview/NationalPreviewDocument";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
} from "@/components/preview/nationalPreview";
import { Button } from "@/components/ui/button";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { archiveOnePager, deleteOnePager } from "@/redux/landingSlice";
import { isCurrentUserOwner } from "@/redux/userSlice";
import { exportOnePagerPpt } from "@/services/exportOnePagerPpt";
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

function composeTitle(record: OnePagerByIdRecord) {
  if (record.pager_type === "retailer") {
    return composeRetailerPreviewTitle(record.payload);
  }
  return composeNationalPreviewTitle(record.payload);
}

function publishedToastFromState(state: unknown): string {
  if (!state || typeof state !== "object") return "";
  const message = (state as { publishedToast?: unknown }).publishedToast;
  return typeof message === "string" ? message : "";
}

/**
 * Published-only Track board. Same GET-by-id as View/Edit; dots come from
 * pillar_track / initiative_track. PATCH uses pager_id + pillar_id +
 * initiative_id ("" for pillar-only) from that GET.
 *
 * Home Active card click and post-publish Preview both open this page.
 * More Options: Export / Archive / Edit / Delete (Track omitted — already
 * here). Archive / Delete → /home on success.
 *
 * TODO: Swap getOnePagerById / updateTrackStatus bodies only.
 * Keep this page looking up pillar_id / initiative_id from the mapped record.
 */
export function TrackOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const owner = useAppSelector((state) => state.user.currentUser.id);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [record, setRecord] = useState<OnePagerByIdRecord | null>(null);
  const [statuses, setStatuses] = useState<OnePagerTrackState>({
    pillars: {},
    initiatives: {},
  });
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(() =>
    Boolean(publishedToastFromState(location.state)),
  );
  const [toastMessage] = useState(() =>
    publishedToastFromState(location.state),
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [editPublishedOpen, setEditPublishedOpen] = useState(false);
  const [editPublishedBusy, setEditPublishedBusy] = useState(false);
  const [editPublishedError, setEditPublishedError] = useState<string | null>(
    null,
  );
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

  const trackTitle = record ? composeTitle(record) : "";
  const isOwner = record
    ? isCurrentUserOwner(record.created_by, currentUser.id)
    : false;
  const canUpdate = isOwner;

  const goEditCreateAsNew = () => {
    if (!record) return;
    navigate(`/edit/${record.id}`, { state: { createAsNew: true } });
  };

  const handleConfirmDelete = async () => {
    if (!record || !isOwner) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await dispatch(deleteOnePager({ pagerId: record.id, user: owner })).unwrap();
      setDeleteOpen(false);
      navigate("/home");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete one-pager",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!record || !isOwner) return;
    setArchiving(true);
    setArchiveError(null);
    try {
      await dispatch(archiveOnePager({ pagerId: record.id, user: owner })).unwrap();
      setArchiveOpen(false);
      navigate("/home");
    } catch (err) {
      setArchiveError(
        err instanceof Error ? err.message : "Failed to archive one-pager",
      );
    } finally {
      setArchiving(false);
    }
  };

  const handleArchiveAndEdit = async () => {
    if (!record || !isOwner) return;
    setEditPublishedBusy(true);
    setEditPublishedError(null);
    try {
      await dispatch(archiveOnePager({ pagerId: record.id, user: owner })).unwrap();
      setEditPublishedOpen(false);
      goEditCreateAsNew();
    } catch (err) {
      setEditPublishedError(
        err instanceof Error ? err.message : "Failed to archive one-pager",
      );
    } finally {
      setEditPublishedBusy(false);
    }
  };

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
      updated_by: currentUser.email,
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
      updated_by: currentUser.email,
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
            canEdit={isOwner}
            canDelete={isOwner}
            onEdit={() => {
              setEditPublishedError(null);
              setEditPublishedOpen(true);
            }}
            onExport={() => {
              void exportOnePagerPpt({
                pagerType: record.pager_type,
                payload: record.payload,
              });
            }}
            onArchive={() => {
              setArchiveError(null);
              setArchiveOpen(true);
            }}
            onDelete={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
            track={{
              canUpdate,
              statuses,
              onPillarChange: handlePillarChange,
              onInitiativeChange: handleInitiativeChange,
            }}
          />
        )}
      </PageContainer>

      <DeleteOnePagerModal
        open={deleteOpen}
        title={trackTitle}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        deleting={deleting}
        error={deleteError}
      />
      <ArchiveOnePagerModal
        open={archiveOpen}
        title={trackTitle}
        onOpenChange={setArchiveOpen}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
        archiving={archiving}
        error={archiveError}
      />
      <EditPublishedOnePagerModal
        open={editPublishedOpen}
        onOpenChange={setEditPublishedOpen}
        busy={editPublishedBusy}
        error={editPublishedError}
        onKeepActiveAndEdit={() => {
          setEditPublishedOpen(false);
          goEditCreateAsNew();
        }}
        onArchiveAndEdit={() => {
          void handleArchiveAndEdit();
        }}
      />
      <FormToast
        open={toastOpen}
        message={toastMessage}
        onOpenChange={setToastOpen}
      />
    </div>
  );
}
