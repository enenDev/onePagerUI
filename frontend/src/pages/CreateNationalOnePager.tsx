import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { FormActionBar } from "@/components/form/FormActionBar";
import {
  emptyNationalFormValues,
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

export function CreateNationalOnePager() {
  const navigate = useNavigate();
  const { setBackHandler } = useOutletContext<FormLayoutContext>();
  const [values, setValues] = useState<NationalFormValues>(
    emptyNationalFormValues,
  );
  const [scoringMode, setScoringMode] = useState<ScoringMode>("UNWEIGHTED");
  const [pillars, setPillars] = useState<PillarDraft[]>(createDefaultPillars);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty = useMemo(
    () => isFormDirty(values, scoringMode, pillars),
    [values, scoringMode, pillars],
  );

  const requestLeave = () => {
    if (dirty) {
      setUnsavedOpen(true);
      return;
    }
    navigate("/home");
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setSaveError(null);
    const payload = buildNationalOnePagerPayload(values, scoringMode, pillars);
    const result = await saveNationalDraft(payload);
    setSaving(false);

    if (!result.ok) {
      setSaveError(result.error);
      return false;
    }

    setSaveError(null);
    return true;
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
        onCancel={requestLeave}
        onSaveDraft={() => {
          void handleSaveDraft();
        }}
        onPreviewPublish={() => {
          // Preview uses the same blob-url payload shape once the screen exists.
          void buildNationalOnePagerPayload(values, scoringMode, pillars);
        }}
      />

      <UnsavedChangesModal
        open={unsavedOpen}
        onOpenChange={setUnsavedOpen}
        onDiscard={() => {
          revokeFormImageUrls(values, pillars);
          setUnsavedOpen(false);
          navigate("/home");
        }}
        onSaveDraft={() => {
          void (async () => {
            const ok = await handleSaveDraft();
            if (ok) {
              setUnsavedOpen(false);
            }
          })();
        }}
      />

      {saving ? (
        <span className="sr-only" aria-live="polite">
          Saving draft
        </span>
      ) : null}
    </div>
  );
}
