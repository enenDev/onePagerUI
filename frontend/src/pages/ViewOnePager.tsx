import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { ArchiveOnePagerModal } from "@/components/landing/ArchiveOnePagerModal";
import { DeleteOnePagerModal } from "@/components/landing/DeleteOnePagerModal";
import { EditPublishedOnePagerModal } from "@/components/landing/EditPublishedOnePagerModal";
import { RestoreOnePagerModal } from "@/components/landing/RestoreOnePagerModal";
import { NationalPreviewDocument } from "@/components/preview/NationalPreviewDocument";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
} from "@/components/preview/nationalPreview";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  archiveOnePager,
  deleteOnePager,
  restoreOnePager,
} from "@/redux/landingSlice";
import { isCurrentUserOwner } from "@/redux/userSlice";
import { exportOnePagerPpt } from "@/services/exportOnePagerPpt";
import {
  getOnePagerById,
  type OnePagerByIdRecord,
} from "@/services/onePagerApi";

function composeViewTitle(record: OnePagerByIdRecord) {
  if (record.pager_type === "retailer") {
    return composeRetailerPreviewTitle(record.payload);
  }
  return composeNationalPreviewTitle(record.payload);
}

/**
 * Landing card click: GET-by-id, then the published/document view.
 * Active / Draft / Archive all open this page (no sticky Publish bar).
 *
 * TODO: Swap only getOnePagerById to GET /api/one-pagers/:id
 * (GetOnePagerApiResponse). Keep mapGetOnePagerResponse + OnePagerByIdRecord.
 * Keep rendering NationalPreviewDocument from the record payload (retailer
 * shows Target Retailer when present). Do not route through create/preview.
 * Back → /home. More Options → Edit still uses /edit/:id (owner-only);
 * published Edit opens EditPublishedOnePagerModal (createAsNew on save).
 * Archive / Restore / Delete navigate to /home after a successful mock call
 * until FastAPI endpoints exist.
 * More Options → Track uses /track/:id for PUBLISHED only.
 * More Options → Export downloads a one-slide PPT from this GET record
 * (not a server export file). Omit Export on DRAFT.
 * Delete → confirm modal + deleteOnePager(pager_id) → Redux remove → /home.
 */
export function ViewOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [record, setRecord] = useState<OnePagerByIdRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
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
      setHeaderTitle("View One-Pager");
      return;
    }
    setHeaderTitle(composeViewTitle(record));
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
      setRecord(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [pagerId]);

  const viewTitle = record ? composeViewTitle(record) : "";
  const isOwner = record
    ? isCurrentUserOwner(record.created_by, currentUser.id)
    : false;

  const goEditCreateAsNew = () => {
    if (!record) return;
    navigate(`/edit/${record.id}`, { state: { createAsNew: true } });
  };

  const handleConfirmDelete = async () => {
    if (!record || !isOwner) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await dispatch(deleteOnePager(record.id)).unwrap();
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
      await dispatch(archiveOnePager(record.id)).unwrap();
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

  const handleConfirmRestore = async () => {
    if (!record || !isOwner) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      await dispatch(restoreOnePager(record.id)).unwrap();
      setRestoreOpen(false);
      navigate("/home");
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : "Failed to restore one-pager",
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleArchiveAndEdit = async () => {
    if (!record || !isOwner) return;
    setEditPublishedBusy(true);
    setEditPublishedError(null);
    try {
      await dispatch(archiveOnePager(record.id)).unwrap();
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
          <Loading label="Loading one-pager…" />
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
              if (record.list_status === "PUBLISHED") {
                setEditPublishedError(null);
                setEditPublishedOpen(true);
                return;
              }
              navigate(`/edit/${record.id}`);
            }}
            onTrack={
              record.list_status === "PUBLISHED"
                ? () => navigate(`/track/${record.id}`)
                : undefined
            }
            onExport={
              record.list_status === "DRAFT"
                ? undefined
                : () => {
                    void exportOnePagerPpt({
                      pagerType: record.pager_type,
                      payload: record.payload,
                    });
                  }
            }
            onArchive={
              record.list_status === "PUBLISHED"
                ? () => {
                    setArchiveError(null);
                    setArchiveOpen(true);
                  }
                : undefined
            }
            onRestore={
              record.list_status === "ARCHIVED"
                ? () => {
                    setRestoreError(null);
                    setRestoreOpen(true);
                  }
                : undefined
            }
            onDelete={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        )}
      </PageContainer>

      <DeleteOnePagerModal
        open={deleteOpen}
        title={viewTitle}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        deleting={deleting}
        error={deleteError}
      />
      <ArchiveOnePagerModal
        open={archiveOpen}
        title={viewTitle}
        onOpenChange={setArchiveOpen}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
        archiving={archiving}
        error={archiveError}
      />
      <RestoreOnePagerModal
        open={restoreOpen}
        title={viewTitle}
        onOpenChange={setRestoreOpen}
        onConfirm={() => {
          void handleConfirmRestore();
        }}
        restoring={restoring}
        error={restoreError}
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
    </div>
  );
}
