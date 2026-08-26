import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { FormActionBar } from "@/components/form/FormActionBar";
import { buildRetailerFormSample } from "@/components/form/fillRetailerFormSample";
import { FormToast } from "@/components/form/FormToast";
import {
  hydrateRetailerFormFromNationalPayload,
  hydrateRetailerFormFromPayload,
} from "@/components/form/hydrateFromPayload";
import {
  emptyRetailerFormValues,
  getRetailerSubmitBlockers,
  type RetailerFormValues,
} from "@/components/form/retailerForm";
import { RetailerStrategyForm } from "@/components/form/RetailerStrategyForm";
import { PillarsSection } from "@/components/form/PillarsSection";
import {
  createDefaultPillars,
  revokeInitiativeImageUrls,
  type PillarDraft,
  type ScoringMode,
} from "@/components/form/pillars";
import { UnsavedChangesModal } from "@/components/form/UnsavedChangesModal";
import { useCreateFormCatalog } from "@/components/form/useCreateFormCatalog";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import type { RetailerPreviewLocationState } from "@/pages/PreviewRetailerOnePager";
import {
  buildRetailerOnePagerPayload,
  saveRetailerDraft,
} from "@/services/retailerCreateFormApi";
import { getNationalOnePager } from "@/services/createFormApi";
import { isRetailerEditState } from "@/services/onePagerApi";
import type { OnePagerListItem } from "@/types/onePager";

/**
 * Create-modal Import From National handoff.
 * Distinct from RetailerPreviewLocationState (which includes `payload`).
 */
export type RetailerImportLocationState = {
  importFrom: "national";
  source: OnePagerListItem;
};

function isImportLocationState(
  value: unknown,
): value is RetailerImportLocationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<RetailerImportLocationState>;
  return (
    state.importFrom === "national" &&
    Boolean(state.source && state.source.pager_id)
  );
}

function isFormDirty(
  values: RetailerFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
) {
  const strategyDirty =
    values.market.trim() !== "" ||
    values.targetRetailer.trim() !== "" ||
    values.category.trim() !== "" ||
    values.campaign.trim() !== "" ||
    values.channel.trim() !== "" ||
    values.title.trim() !== "" ||
    values.businessOutcome.trim() !== "" ||
    values.coverImageUrl !== "";
  const pillarsDirty =
    scoringMode !== "UNWEIGHTED" ||
    pillars.some(
      (pillar) =>
        pillar.pillar_description.trim() !== "" ||
        pillar.pillar_weight !== 20 ||
        pillar.initiatives.length > 0,
    );
  return strategyDirty || pillarsDirty;
}

function revokeFormImageUrls(
  values: RetailerFormValues,
  pillars: PillarDraft[],
) {
  if (values.coverImageUrl.startsWith("blob:")) {
    URL.revokeObjectURL(values.coverImageUrl);
  }
  pillars.forEach((pillar) => {
    pillar.initiatives.forEach((initiative) => {
      revokeInitiativeImageUrls(initiative.images);
    });
  });
}

function isPreviewReturnState(
  value: unknown,
): value is RetailerPreviewLocationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<RetailerPreviewLocationState>;
  return Boolean(state.values && state.pillars && state.payload);
}

export function CreateRetailerOnePager() {
  // Edit: `/edit/:id` calls getOnePagerById then navigates here with editRecord.
  // Import-from-National: picker passes pager_id; this page calls
  // getNationalOnePager(id) and hydrates from that one record.
  // TODO: Swap getOnePagerById (edit) and getNationalOnePager (import) only.
  // createAsNew (published Keep Active / Archive & Edit): hydrate only —
  // recordId stays null so Save Draft / Publish creates a new pager id.
  // recordId stays null on import (new retailer draft). Scope stays locked on import.
  const navigate = useNavigate();
  const location = useLocation();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();

  const restored = isPreviewReturnState(location.state) ? location.state : null;
  const edited =
    !restored && isRetailerEditState(location.state) ? location.state : null;
  const editedForm = edited
    ? hydrateRetailerFormFromPayload(edited.editRecord.payload)
    : null;
  const imported =
    !restored && !edited && isImportLocationState(location.state)
      ? location.state
      : null;
  const shouldFillSample =
    import.meta.env.DEV &&
    !restored &&
    !edited &&
    !imported &&
    new URLSearchParams(location.search).get("fill") === "1";
  const initialSample = shouldFillSample ? buildRetailerFormSample() : null;

  const [isEditing] = useState(() => Boolean(edited));
  const [importPagerId] = useState(() => imported?.source.pager_id ?? null);
  const [scopeLocked, setScopeLocked] = useState(
    () => Boolean(imported) || Boolean(restored?.scopeLocked),
  );
  const [importLoading, setImportLoading] = useState(() => Boolean(imported));

  const [values, setValues] = useState<RetailerFormValues>(
    () =>
      restored?.values ??
      editedForm?.values ??
      initialSample?.values ??
      emptyRetailerFormValues,
  );
  const [scoringMode, setScoringMode] = useState<ScoringMode>(
    () =>
      restored?.scoringMode ??
      editedForm?.scoringMode ??
      initialSample?.scoringMode ??
      "UNWEIGHTED",
  );
  const [pillars, setPillars] = useState<PillarDraft[]>(
    () =>
      restored?.pillars ??
      editedForm?.pillars ??
      initialSample?.pillars ??
      createDefaultPillars(),
  );
  const [recordId, setRecordId] = useState<string | null>(
    () =>
      restored?.recordId ??
      (edited?.createAsNew ? null : edited?.editRecord.id ?? null),
  );
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(
    () =>
      restored
        ? JSON.stringify(restored.payload)
        : editedForm
          ? JSON.stringify(
              buildRetailerOnePagerPayload(
                editedForm.values,
                editedForm.scoringMode,
                editedForm.pillars,
              ),
            )
          : null,
  );
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { catalog, catalogLoading } = useCreateFormCatalog();

  const applySampleData = () => {
    revokeFormImageUrls(values, pillars);
    const sample = buildRetailerFormSample();
    setValues(sample.values);
    setScoringMode(sample.scoringMode);
    setPillars(sample.pillars);
    setSaveError(null);
  };

  useEffect(() => {
    if (restored || edited || imported || shouldFillSample) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    setHeaderTitle("Edit Retailer One-Pager");
    return () => setHeaderTitle(null);
  }, [isEditing, setHeaderTitle]);

  useEffect(() => {
    if (!importPagerId) return;
    let cancelled = false;

    void (async () => {
      // TODO: Real FastAPI — swap getNationalOnePager to GET /api/national-one-pagers/:id.
      const record = await getNationalOnePager(importPagerId);
      if (cancelled) return;
      if (!record) {
        setSaveError("Could not load the national one-pager.");
        setImportLoading(false);
        return;
      }
      const next = hydrateRetailerFormFromNationalPayload(record.payload);
      setValues(next.values);
      setScoringMode(next.scoringMode);
      setPillars(next.pillars);
      setScopeLocked(true);
      setSaveError(null);
      setImportLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [importPagerId]);

  const payloadFingerprint = useMemo(
    () =>
      JSON.stringify(
        buildRetailerOnePagerPayload(values, scoringMode, pillars),
      ),
    [values, scoringMode, pillars],
  );

  const dirty =
    savedFingerprint === null
      ? isFormDirty(values, scoringMode, pillars)
      : payloadFingerprint !== savedFingerprint;

  const submitBlockedReason = getRetailerSubmitBlockers(
    values,
    pillars,
    scoringMode,
  );
  const canSubmit = submitBlockedReason === null;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  const requestLeave = () => {
    if (dirty) {
      setUnsavedOpen(true);
      return;
    }
    navigate("/home");
  };

  const handleSaveDraft = async (options?: { redirectHome?: boolean }) => {
    setSavingDraft(true);
    setSaveError(null);
    const payload = buildRetailerOnePagerPayload(values, scoringMode, pillars);
    // TODO: When backend is live, saveRetailerDraft becomes the real HTTP call.
    // Keep toast + homepage redirect UX for action-bar Save Draft; only swap service.
    const result = await saveRetailerDraft(payload, recordId);
    setSavingDraft(false);

    if (!result.ok) {
      setSaveError(result.error);
      return false;
    }

    setRecordId(result.id);
    setSavedFingerprint(JSON.stringify(payload));
    setSaveError(null);

    if (options?.redirectHome !== false) {
      navigate("/home", { replace: true });
      return true;
    }

    showToast("Draft saved successfully.");
    return true;
  };

  const handlePreviewPublish = () => {
    if (!canSubmit) {
      setSaveError(submitBlockedReason);
      return;
    }

    setSaveError(null);
    const payload = buildRetailerOnePagerPayload(values, scoringMode, pillars);
    // TODO: Preview route is FE-only handoff via location.state today.
    // Next: persist draft then open /create/retailer/preview/:id from backend id.
    // Publish happens on the preview page (not here).
    const previewState: RetailerPreviewLocationState = {
      values,
      scoringMode,
      pillars,
      recordId,
      payload,
      scopeLocked,
    };
    navigate("/create/retailer/preview", { state: previewState });
  };

  useEffect(() => {
    setBackHandler(() => {
      if (dirty) {
        setUnsavedOpen(true);
        return;
      }
      navigate("/home");
    });
    return () => setBackHandler(null);
  }, [dirty, navigate, setBackHandler]);

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] w-full flex-col">
      <PageContainer className="flex flex-1 flex-col gap-6 py-6">
        {importLoading ? (
          <Loading label="Loading national one-pager…" />
        ) : (
          <>
            <RetailerStrategyForm
              values={values}
              onChange={setValues}
              catalog={catalog}
              catalogLoading={catalogLoading}
              lockScope={scopeLocked}
            />
            <PillarsSection
              scoringMode={scoringMode}
              pillars={pillars}
              onScoringModeChange={setScoringMode}
              onPillarsChange={setPillars}
              catalog={catalog}
            />
          </>
        )}
        {saveError ? (
          <p className="text-sm text-destructive">{saveError}</p>
        ) : null}
      </PageContainer>

      <FormActionBar
        savingDraft={savingDraft}
        publishing={false}
        canSubmit={canSubmit}
        submitBlockedReason={submitBlockedReason}
        onCancel={requestLeave}
        onFillSample={import.meta.env.DEV ? applySampleData : undefined}
        onSaveDraft={() => {
          void handleSaveDraft({ redirectHome: true });
        }}
        onPreviewPublish={handlePreviewPublish}
      />

      <UnsavedChangesModal
        open={unsavedOpen}
        saving={savingDraft}
        canSaveDraft={true}
        saveBlockedReason={null}
        onOpenChange={setUnsavedOpen}
        onDiscard={() => {
          revokeFormImageUrls(values, pillars);
          setUnsavedOpen(false);
          navigate("/home");
        }}
        onSaveDraft={() => {
          void (async () => {
            const ok = await handleSaveDraft({ redirectHome: true });
            if (ok) {
              setUnsavedOpen(false);
            }
          })();
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
