import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

import { FormActionBar } from "@/components/form/FormActionBar";
import { buildNationalFormSample } from "@/components/form/fillNationalFormSample";
import { FormToast } from "@/components/form/FormToast";
import { hydrateNationalFormFromPayload } from "@/components/form/hydrateFromPayload";
import {
  emptyNationalFormValues,
  getNationalSubmitBlockers,
  type NationalFormValues,
} from "@/components/form/nationalForm";
import { NationalStrategyForm } from "@/components/form/NationalStrategyForm";
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
import type { NationalPreviewLocationState } from "@/pages/PreviewNationalOnePager";
import {
  buildNationalOnePagerPayload,
  saveNationalDraft,
} from "@/services/createFormApi";
import { isNationalEditState } from "@/services/onePagerApi";

function isFormDirty(
  values: NationalFormValues,
  scoringMode: ScoringMode,
  pillars: PillarDraft[],
) {
  const strategyDirty =
    values.market.trim() !== "" ||
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
  values: NationalFormValues,
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
): value is NationalPreviewLocationState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<NationalPreviewLocationState>;
  return Boolean(state.values && state.pillars && state.payload);
}

export function CreateNationalOnePager() {
  // Edit: `/edit/:id` calls getOnePagerById then navigates here with editRecord.
  // TODO: Keep hydrating from OnePagerByIdRecord.payload.
  // createAsNew (published Keep Active / Archive & Edit): hydrate only —
  // recordId stays null so Save Draft / Publish creates a new pager id.
  // Image fields: API URLs go into coverImageUrl + initiative blobUrl; File is
  // null until the user replaces an image.
  const navigate = useNavigate();
  const location = useLocation();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();

  const restored = isPreviewReturnState(location.state) ? location.state : null;
  const edited =
    !restored && isNationalEditState(location.state) ? location.state : null;
  const editedForm = edited
    ? hydrateNationalFormFromPayload(edited.editRecord.payload)
    : null;
  const shouldFillSample =
    import.meta.env.DEV &&
    !restored &&
    !edited &&
    new URLSearchParams(location.search).get("fill") === "1";
  const initialSample = shouldFillSample ? buildNationalFormSample() : null;

  const [isEditing] = useState(() => Boolean(edited));
  const [values, setValues] = useState<NationalFormValues>(
    () =>
      restored?.values ??
      editedForm?.values ??
      initialSample?.values ??
      emptyNationalFormValues,
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
              buildNationalOnePagerPayload(
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
    const sample = buildNationalFormSample();
    setValues(sample.values);
    setScoringMode(sample.scoringMode);
    setPillars(sample.pillars);
    setSaveError(null);
  };

  useEffect(() => {
    // Consume one-time restore / edit / ?fill=1 so refresh doesn't keep rehydrating.
    if (restored || edited || shouldFillSample) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // Only on mount for return-from-preview, edit handoff, and dev fill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    setHeaderTitle("Edit National One-Pager");
    return () => setHeaderTitle(null);
  }, [isEditing, setHeaderTitle]);

  const payloadFingerprint = useMemo(
    () =>
      JSON.stringify(
        buildNationalOnePagerPayload(values, scoringMode, pillars),
      ),
    [values, scoringMode, pillars],
  );

  const dirty =
    savedFingerprint === null
      ? isFormDirty(values, scoringMode, pillars)
      : payloadFingerprint !== savedFingerprint;

  const submitBlockedReason = getNationalSubmitBlockers(
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
    const payload = buildNationalOnePagerPayload(values, scoringMode, pillars);
    // TODO: When backend is live, `saveNationalDraft` becomes the real HTTP call.
    // Keep toast + homepage redirect UX for action-bar Save Draft; only swap service.
    const result = await saveNationalDraft(payload, recordId);
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
    const payload = buildNationalOnePagerPayload(values, scoringMode, pillars);
    // TODO: Preview route is FE-only handoff via location.state today.
    // Next: persist draft (or preview snapshot) then open /create/national/preview/:id
    // from backend id. Keep NationalPreviewLocationState field names until then.
    // Publish itself happens on the preview page (not here).
    const previewState: NationalPreviewLocationState = {
      values,
      scoringMode,
      pillars,
      recordId,
      payload,
    };
    navigate("/create/national/preview", { state: previewState });
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
        <NationalStrategyForm
          values={values}
          onChange={setValues}
          catalog={catalog}
          catalogLoading={catalogLoading}
        />
        <PillarsSection
          scoringMode={scoringMode}
          pillars={pillars}
          onScoringModeChange={setScoringMode}
          onPillarsChange={setPillars}
          catalog={catalog}
        />
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
