import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";

import { FormActionBar } from "@/components/form/FormActionBar";
import { buildNationalFormSample } from "@/components/form/fillNationalFormSample";
import { FormToast } from "@/components/form/FormToast";
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
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import type { NationalPreviewLocationState } from "@/pages/PreviewNationalOnePager";
import {
  buildNationalOnePagerPayload,
  saveNationalDraft,
} from "@/services/createFormApi";

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
  // TODO: Edit-from-home prepopulation
  // - Add route param (e.g. /create/national/:id) or /edit/national/:id.
  // - On mount, GET one-pager by id from backend (mock getById first if needed).
  // - Hydrate values / pillars / scoringMode / recordId from response payload.
  // - Image fields: if API returns permanent URLs, set coverImageUrl + initiative blobUrl
  //   (or rename to url) and note File may be null in edit mode until user replaces image.
  const navigate = useNavigate();
  const location = useLocation();
  const { setBackHandler } = useOutletContext<FormLayoutContext>();

  const restored = isPreviewReturnState(location.state) ? location.state : null;
  const shouldFillSample =
    import.meta.env.DEV &&
    !restored &&
    new URLSearchParams(location.search).get("fill") === "1";
  const initialSample = shouldFillSample ? buildNationalFormSample() : null;

  const [values, setValues] = useState<NationalFormValues>(
    () => restored?.values ?? initialSample?.values ?? emptyNationalFormValues,
  );
  const [scoringMode, setScoringMode] = useState<ScoringMode>(
    () => restored?.scoringMode ?? initialSample?.scoringMode ?? "UNWEIGHTED",
  );
  const [pillars, setPillars] = useState<PillarDraft[]>(
    () => restored?.pillars ?? initialSample?.pillars ?? createDefaultPillars(),
  );
  const [recordId, setRecordId] = useState<string | null>(
    () => restored?.recordId ?? null,
  );
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(
    () => (restored ? JSON.stringify(restored.payload) : null),
  );
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const applySampleData = () => {
    revokeFormImageUrls(values, pillars);
    const sample = buildNationalFormSample();
    setValues(sample.values);
    setScoringMode(sample.scoringMode);
    setPillars(sample.pillars);
    setSaveError(null);
  };

  useEffect(() => {
    // Consume one-time restore / ?fill=1 so refresh doesn't keep rehydrating.
    if (restored || shouldFillSample) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // Only on mount for return-from-preview and dev fill handoff.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const submitBlockedReason = getNationalSubmitBlockers(values, pillars);
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
    if (!canSubmit) {
      setSaveError(submitBlockedReason);
      return false;
    }

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
        <NationalStrategyForm values={values} onChange={setValues} />
        <PillarsSection
          scoringMode={scoringMode}
          pillars={pillars}
          onScoringModeChange={setScoringMode}
          onPillarsChange={setPillars}
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
        canSaveDraft={canSubmit}
        saveBlockedReason={submitBlockedReason}
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
