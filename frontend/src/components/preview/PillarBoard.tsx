import type { ReactNode } from "react";
import { Info } from "lucide-react";

import {
  formatPreviewDateRange,
  formatSuccessTarget,
} from "@/components/preview/nationalPreview";
import { TrackStatusDot } from "@/components/track/TrackStatusDot";
import { PILLAR_ICON_BY_NUMBER } from "@/assets/pillars/pillarIcons";
import type { ScoringMode } from "@/components/form/pillars";
import type {
  NationalInitiativePayload,
  NationalPillarPayload,
} from "@/services/createFormApi";
import {
  initiativeTrackKey,
  type OnePagerTrackState,
  type TrackRagStatus,
} from "@/services/trackApi";
import { cn } from "@/lib/utils";

const PILLAR_THEME: Record<number, { card: string; title: string }> = {
  1: { card: "bg-preview-pillar-1", title: "text-preview-pillar-1-title" },
  2: { card: "bg-preview-pillar-2", title: "text-preview-pillar-2-title" },
  3: { card: "bg-preview-pillar-3", title: "text-preview-pillar-3-title" },
  4: { card: "bg-preview-pillar-4", title: "text-preview-pillar-4-title" },
  5: { card: "bg-preview-pillar-5", title: "text-preview-pillar-5-title" },
};

const PRIORITY_CLASS: Record<string, string> = {
  P1: "bg-preview-priority-p1 text-preview-priority-fg",
  P2: "bg-preview-priority-p2 text-preview-priority-fg",
  P3: "bg-preview-priority-p3 text-preview-priority-fg",
};

export type PillarBoardTrack = {
  canUpdate: boolean;
  statuses: OnePagerTrackState;
  onPillarChange: (pillarNumber: number, status: TrackRagStatus) => void;
  onInitiativeChange: (
    pillarNumber: number,
    initiativeNumber: number,
    status: TrackRagStatus,
  ) => void;
};

function PreviewSection({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-semibold text-primary">{label}</p>
      <p className="text-sm leading-snug break-all text-foreground/90 [overflow-wrap:anywhere]">
        {children || "—"}
      </p>
    </div>
  );
}

function InitiativeBlock({
  initiative,
  statusDot,
}: {
  initiative: NationalInitiativePayload;
  statusDot?: ReactNode;
}) {
  const dateLabel = formatPreviewDateRange(
    initiative.week_start,
    initiative.week_end,
  );
  const images = (initiative.image_signed_url ?? []).filter(Boolean);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex max-w-full flex-wrap items-center gap-1.5">
        {statusDot}
        <span
          className={cn(
            "shrink-0 rounded-preview-badge px-1.5 py-0.5 text-xs font-semibold",
            PRIORITY_CLASS[initiative.priority_level] ?? PRIORITY_CLASS.P1,
          )}
        >
          {initiative.priority_level}
        </span>
        <span className="inline-flex max-w-full truncate rounded-preview-badge bg-preview-dept px-1.5 py-0.5 text-xs font-medium text-preview-priority-fg">
          {initiative.accountable_function_department || "—"}
        </span>
      </div>

      <PreviewSection label="Initiative">
        {initiative.initiative_description}
      </PreviewSection>
      <PreviewSection label="Success Target">
        {formatSuccessTarget(initiative)}
      </PreviewSection>
      <PreviewSection label="Guidelines">
        {initiative.guidelines}
      </PreviewSection>

      {dateLabel ? (
        <span className="inline-flex w-fit rounded-full bg-preview-date px-2.5 py-0.5 text-xs font-medium text-preview-date-fg">
          {dateLabel}
        </span>
      ) : null}

      {images.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">
            Photo Blueprint
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {images.slice(0, 3).map((src) => (
              <img
                key={src}
                src={src}
                alt="Initiative photo"
                className="h-14 w-full rounded-md object-cover"
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type PillarBoardProps = {
  pillars: NationalPillarPayload[];
  scoringMode?: ScoringMode;
  track?: PillarBoardTrack;
};

export function PillarBoard({ pillars, scoringMode, track }: PillarBoardProps) {
  const showWeight = scoringMode === "WEIGHTED";
  return (
    <div className="overflow-x-auto p-1.5">
      <div className="grid min-w-[72rem] grid-cols-5 gap-2">
        {pillars.map((pillar) => {
          // const targetCount = pillar.initiatives.length;
          const theme = PILLAR_THEME[pillar.pillar_number] ?? PILLAR_THEME[1];
          const pillarStatus =
            track?.statuses.pillars[pillar.pillar_number] ?? "clear";

          return (
            <article
              key={pillar.pillar_number}
              className={cn(
                "flex min-w-0 flex-col gap-4 overflow-hidden rounded-preview-card px-2 py-4 shadow-preview-card",
                theme.card,
              )}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  {track ? (
                    <span className="inline-flex shrink-0">
                      <TrackStatusDot
                        value={pillarStatus}
                        canUpdate={track.canUpdate}
                        ariaLabel={`${pillar.pillar_name} status`}
                        onChange={(status) =>
                          track.onPillarChange(pillar.pillar_number, status)
                        }
                      />
                    </span>
                  ) : null}
                  {PILLAR_ICON_BY_NUMBER[pillar.pillar_number] ? (
                    <img
                      src={PILLAR_ICON_BY_NUMBER[pillar.pillar_number]}
                      alt=""
                      className="size-9 shrink-0 object-contain"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h3
                      className={cn(
                        "text-xs font-bold leading-snug break-words",
                        theme.title,
                      )}
                    >
                      {pillar.pillar_name}
                    </h3>
                    {showWeight ? (
                      <p
                        className={cn(
                          "mt-0.5 whitespace-nowrap text-[10px] font-medium leading-none",
                          theme.title,
                        )}
                      >
                        {pillar.pillar_weight}pts
                      </p>
                    ) : null}
                  </div>
                </div>
                {pillar.pillar_description.trim() ? (
                  <p className="text-[10px] leading-snug text-foreground/70">
                    {pillar.pillar_description}
                  </p>
                ) : null}
              </div>

              {pillar.initiatives.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {pillar.initiatives.map((initiative, index) => {
                    const initiativeStatus =
                      track?.statuses.initiatives[
                        initiativeTrackKey(
                          pillar.pillar_number,
                          initiative.initiative_number,
                        )
                      ] ?? "clear";

                    return (
                      <div
                        key={`${pillar.pillar_number}-${initiative.initiative_number}`}
                        className={cn(
                          "min-w-0",
                          index > 0
                            ? "border-t border-preview-divider pt-4"
                            : "",
                        )}
                      >
                        <InitiativeBlock
                          initiative={initiative}
                          statusDot={
                            track ? (
                              <TrackStatusDot
                                value={initiativeStatus}
                                canUpdate={track.canUpdate}
                                ariaLabel={`Pillar ${pillar.pillar_number} initiative ${initiative.initiative_number} status`}
                                onChange={(status) =>
                                  track.onInitiativeChange(
                                    pillar.pillar_number,
                                    initiative.initiative_number,
                                    status,
                                  )
                                }
                              />
                            ) : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-sm font-medium text-amber-950">
                  <Info className="size-3.5 shrink-0 text-amber-700" />
                  <p className="text-[#b03800]">No initiatives added.</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
