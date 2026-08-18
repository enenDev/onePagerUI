import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { DeleteOnePagerModal } from "@/components/landing/DeleteOnePagerModal";
import { NationalPreviewDocument } from "@/components/preview/NationalPreviewDocument";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
} from "@/components/preview/nationalPreview";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import { useAppDispatch } from "@/redux/hooks";
import { deleteOnePager } from "@/redux/landingSlice";
import {
  getOnePagerById,
  type OnePagerByIdRecord,
} from "@/services/onePagerApi";
import { isCurrentUserOwner } from "@/types/onePager";

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
 * TODO: Swap only getOnePagerById to GET /api/one-pagers/:id.
 * Keep rendering NationalPreviewDocument from the record payload (retailer
 * shows Target Retailer when present). Do not route through create/preview.
 * Back → /home. More Options → Edit still uses /edit/:id (owner-only).
 * More Options → Track uses /track/:id for PUBLISHED only.
 * Delete → confirm modal + deleteOnePager(pager_id) → Redux remove → /home.
 */
export function ViewOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [record, setRecord] = useState<OnePagerByIdRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
  const isOwner = record ? isCurrentUserOwner(record.created_by) : false;

  const handleConfirmDelete = async () => {
    if (!record) return;
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
            onEdit={() => navigate(`/edit/${record.id}`)}
            onTrack={
              record.list_status === "PUBLISHED"
                ? () => navigate(`/track/${record.id}`)
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
    </div>
  );
}
