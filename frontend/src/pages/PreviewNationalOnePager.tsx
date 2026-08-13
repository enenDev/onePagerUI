import { useEffect, useMemo, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";

import type { NationalFormValues } from "@/components/form/nationalForm";
import type { PillarDraft, ScoringMode } from "@/components/form/pillars";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import {
  buildNationalOnePagerPayload,
  publishNationalOnePager,
  type NationalOnePagerCreatePayload,
} from "@/services/createFormApi";

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
  // Confirm Publish calls POST publish. Keep payload field names + toast/home redirect UX.
  const location = useLocation();
  const navigate = useNavigate();
  const { setBackHandler } = useOutletContext<FormLayoutContext>();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = isPreviewState(location.state) ? location.state : null;

  const summary = useMemo(() => {
    if (!state) return null;
    const payload = state.payload;
    return {
      title: payload.title,
      market: payload.market,
      category: payload.category,
      campaign: payload.campaign,
      channel: payload.channel,
      outcome: payload.business_outcome_statement,
      scoringMode: payload.scoring_mode,
      pillars: payload.pillars.map((pillar) => ({
        name: pillar.pillar_name,
        initiativeCount: pillar.initiatives.length,
      })),
    };
  }, [state]);

  useEffect(() => {
    setBackHandler(() => {
      if (!state) {
        navigate("/create/national");
        return;
      }
      navigate("/create/national", { state });
    });
    return () => setBackHandler(null);
  }, [navigate, setBackHandler, state]);

  if (!state || !summary) {
    return <Navigate to="/create/national" replace />;
  }

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    const payload =
      state.payload ??
      buildNationalOnePagerPayload(
        state.values,
        state.scoringMode,
        state.pillars,
      );
    // TODO: Confirm Publish → real FastAPI publish endpoint.
    // Temporary: publishNationalOnePager mock upsert, then redirect home.
    // Keep NationalOnePagerCreatePayload + { id, status: "published" } response.
    const result = await publishNationalOnePager(payload, state.recordId);
    setPublishing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate("/home", { replace: true });
  };

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] w-full flex-col">
      <PageContainer className="flex flex-1 flex-col gap-6 py-6">
        <div className="rounded-xl border border-border bg-white/90 p-6">
          <p className="text-sm font-medium text-muted-foreground">Preview</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">
            {summary.title || "Untitled one-pager"}
          </h1>
          <p className="mt-3 text-sm text-foreground/80">{summary.outcome}</p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Market</dt>
              <dd className="text-sm text-foreground">{summary.market || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Category</dt>
              <dd className="text-sm text-foreground">{summary.category || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Campaign</dt>
              <dd className="text-sm text-foreground">{summary.campaign || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Channel</dt>
              <dd className="text-sm text-foreground">{summary.channel || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Scoring
              </dt>
              <dd className="text-sm text-foreground">{summary.scoringMode}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-foreground">Pillars</p>
            <ul className="space-y-1.5">
              {summary.pillars.map((pillar) => (
                <li
                  key={pillar.name}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span>{pillar.name}</span>
                  <span className="text-muted-foreground">
                    {pillar.initiativeCount} initiative
                    {pillar.initiativeCount === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </PageContainer>

      <div className="sticky bottom-0 z-20 border-t border-border bg-white/95 px-6 py-3 backdrop-blur lg:px-8">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 cursor-pointer rounded-full"
            onClick={() => navigate("/create/national", { state })}
          >
            Back to edit
          </Button>
          <Button
            type="button"
            disabled={publishing}
            className="h-9 cursor-pointer rounded-full bg-primary px-5 text-primary-foreground"
            onClick={() => {
              void handlePublish();
            }}
          >
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
