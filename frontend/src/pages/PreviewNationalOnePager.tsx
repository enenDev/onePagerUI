import { useCallback, useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Pencil, Send } from "lucide-react";

import type { NationalFormValues } from "@/components/form/nationalForm";
import { FormToast } from "@/components/form/FormToast";
import type { PillarDraft, ScoringMode } from "@/components/form/pillars";
import { DeleteOnePagerModal } from "@/components/landing/DeleteOnePagerModal";
import { NationalPreviewDocument } from "@/components/preview/NationalPreviewDocument";
import { PublishIncompletePillarsModal } from "@/components/preview/PublishIncompletePillarsModal";
import {
  composeNationalPreviewTitle,
  formatPublishedAt,
} from "@/components/preview/nationalPreview";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import { useAppDispatch } from "@/redux/hooks";
import { deleteOnePager } from "@/redux/landingSlice";
import {
  publishNationalOnePager,
  type NationalOnePagerCreatePayload,
} from "@/services/createFormApi";
import { CURRENT_USER_ID, isCurrentUserOwner } from "@/types/onePager";

export type NationalPreviewLocationState = {
  values: NationalFormValues;
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
  recordId: string | null;
  payload: NationalOnePagerCreatePayload;
};

function isPreviewState(value: unknown): value is NationalPreviewLocationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<NationalPreviewLocationState>;
  return Boolean(state.values && state.pillars && state.payload);
}

export function PreviewNationalOnePager() {
  // TODO: Replace location.state preview handoff with a real preview route keyed by id.
  // Temporary: create form navigates here with NationalPreviewLocationState in memory.
  // Next: GET /api/national-one-pagers/:id (or draft snapshot) and render read-only preview;
  // Confirm Publish calls POST publish. Keep payload field names + on-page toast UX.
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const state = isPreviewState(location.state) ? location.state : null;
  const owner = CURRENT_USER_ID;
  const payload = state?.payload ?? null;
  const composedTitle = payload ? composeNationalPreviewTitle(payload) : "";
  const isOwner = isCurrentUserOwner(owner);

  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(
    () => state?.recordId ?? null,
  );
  const [publishedAt, setPublishedAt] = useState(() =>
    formatPublishedAt(new Date()),
  );
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const goBackToEdit = useCallback(() => {
    // After publish, Edit is the same GET-by-id flow as landing ⋯ Edit.
    // Pre-publish Edit still restores in-memory form state (not a GET).
    if (published) {
      const id = recordId ?? state?.recordId;
      if (id) {
        navigate(`/edit/${id}`);
        return;
      }
    }
    if (!state) {
      navigate("/create/national");
      return;
    }
    navigate("/create/national", { state });
  }, [navigate, published, recordId, state]);

  useEffect(() => {
    setBackHandler(goBackToEdit);
    return () => setBackHandler(null);
  }, [goBackToEdit, setBackHandler]);

  useEffect(() => {
    if (!composedTitle) {
      setHeaderTitle(null);
      return;
    }
    setHeaderTitle(published ? composedTitle : `(Preview) ${composedTitle}`);
    return () => setHeaderTitle(null);
  }, [composedTitle, published, setHeaderTitle]);

  if (!state || !payload) {
    return <Navigate to="/create/national" replace />;
  }

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    // TODO: Confirm Publish → real FastAPI POST /api/national-one-pagers/publish.
    // Temporary: publishNationalOnePager mock upsert with NationalOnePagerCreatePayload + optional id.
    // Keep response { id, status: "published" }. Stay on this page (no home redirect).
    const result = await publishNationalOnePager(payload, recordId ?? state.recordId);
    setPublishing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setRecordId(result.id);
    setPublished(true);
    setPublishedAt(formatPublishedAt(new Date()));
    setToastMessage(`"${composedTitle}" is now published`);
    setToastOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = recordId ?? state.recordId;
    if (!id) {
      setDeleteError("Missing one-pager id.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await dispatch(deleteOnePager(id)).unwrap();
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
        <NationalPreviewDocument
          payload={payload}
          owner={owner}
          publishedAt={publishedAt}
          onEdit={goBackToEdit}
          moreOptionsEnabled={published}
          canEdit={isOwner}
          canDelete={isOwner}
          onTrack={
            published
              ? () => {
                  const id = recordId ?? state.recordId;
                  if (id) navigate(`/track/${id}`);
                }
              : undefined
          }
          onDelete={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        />
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      </PageContainer>

      {!published ? (
        <div className="sticky bottom-0 z-20 w-full border-t border-border bg-white/95 backdrop-blur-sm">
          <PageContainer className="flex items-center justify-end gap-2 py-3">
            <Button
              type="button"
              variant="outline"
              className="h-9 cursor-pointer rounded-lg border-primary px-4 text-primary hover:bg-accent hover:text-primary"
              onClick={goBackToEdit}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              type="button"
              disabled={publishing}
              className="h-9 cursor-pointer rounded-lg bg-primary px-5 text-primary-foreground"
              onClick={() => {
                const hasEmptyPillar = payload.pillars.some(
                  (pillar) => pillar.initiatives.length === 0,
                );
                if (hasEmptyPillar) {
                  setPublishConfirmOpen(true);
                  return;
                }
                void handlePublish();
              }}
            >
              <Send className="size-4" />
              {publishing ? "Publishing..." : "Publish"}
            </Button>
          </PageContainer>
        </div>
      ) : null}

      <PublishIncompletePillarsModal
        open={publishConfirmOpen}
        publishing={publishing}
        onOpenChange={setPublishConfirmOpen}
        onCancel={() => setPublishConfirmOpen(false)}
        onConfirmPublish={() => {
          setPublishConfirmOpen(false);
          void handlePublish();
        }}
      />

      <DeleteOnePagerModal
        open={deleteOpen}
        title={composedTitle}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        deleting={deleting}
        error={deleteError}
      />

      <FormToast
        open={toastOpen}
        message={toastMessage}
        onOpenChange={setToastOpen}
      />
    </div>
  );
}
