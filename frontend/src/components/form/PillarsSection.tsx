import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  Scale,
  Store,
  Megaphone,
  ShoppingBag,
  MonitorSmartphone,
  PackageCheck,
  Trash2,
} from "lucide-react";

import { AddInitiativeModal } from "@/components/form/AddInitiativeModal";
import { CharCount } from "@/components/form/CharCount";
import { FIELD_LIMITS } from "@/components/form/fieldLimits";
import {
  MAX_INITIATIVES_PER_PILLAR,
  nextPriorityLevel,
  revokeInitiativeImageUrls,
  type InitiativeDraft,
  type PillarDraft,
  type ScoringMode,
} from "@/components/form/pillars";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CreateFormMetadata } from "@/services/createFormApi";

const PILLAR_META = [
  {
    pillar_number: 1,
    pillar_name: "Category Leadership",
    icon: Megaphone,
    iconClass: "bg-red-100 text-red-600",
  },
  {
    pillar_number: 2,
    pillar_name: "Unmissable Retail Theater",
    icon: Store,
    iconClass: "bg-violet-100 text-violet-600",
  },
  {
    pillar_number: 3,
    pillar_name: "More Stores Better Stores",
    icon: ShoppingBag,
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    pillar_number: 4,
    pillar_name: "Frictionless Digital",
    icon: MonitorSmartphone,
    iconClass: "bg-sky-100 text-sky-600",
  },
  {
    pillar_number: 5,
    pillar_name: "Always Available",
    icon: PackageCheck,
    iconClass: "bg-amber-100 text-amber-700",
  },
] as const;

type PillarsSectionProps = {
  scoringMode: ScoringMode;
  pillars: PillarDraft[];
  onScoringModeChange: (mode: ScoringMode) => void;
  onPillarsChange: (pillars: PillarDraft[]) => void;
  /** Shared create-form catalog (initiative dropdowns). */
  catalog: CreateFormMetadata | null;
};

export function PillarsSection({
  scoringMode,
  pillars,
  onScoringModeChange,
  onPillarsChange,
  catalog,
}: PillarsSectionProps) {
  const [expanded, setExpanded] = useState<number[]>([1]);
  const [activePillarNumber, setActivePillarNumber] = useState<number | null>(
    null,
  );
  const [editingInitiative, setEditingInitiative] =
    useState<InitiativeDraft | null>(null);

  const totalWeight = useMemo(
    () => pillars.reduce((sum, pillar) => sum + pillar.pillar_weight, 0),
    [pillars],
  );

  const isWeighted = scoringMode === "WEIGHTED";
  const activePillar = pillars.find(
    (pillar) => pillar.pillar_number === activePillarNumber,
  );
  const activePriority = editingInitiative
    ? editingInitiative.priority_level
    : activePillar
      ? nextPriorityLevel(activePillar.initiatives.length)
      : null;

  const closeInitiativeModal = () => {
    setActivePillarNumber(null);
    setEditingInitiative(null);
  };

  const toggleExpanded = (pillarNumber: number) => {
    setExpanded((prev) =>
      prev.includes(pillarNumber)
        ? prev.filter((item) => item !== pillarNumber)
        : [...prev, pillarNumber],
    );
  };

  const updatePillar = (
    pillarNumber: number,
    partial: Partial<PillarDraft>,
  ) => {
    onPillarsChange(
      pillars.map((pillar) =>
        pillar.pillar_number === pillarNumber
          ? { ...pillar, ...partial }
          : pillar,
      ),
    );
  };

  const addInitiative = (
    pillarNumber: number,
    initiative: Omit<InitiativeDraft, "initiative_number">,
  ) => {
    onPillarsChange(
      pillars.map((pillar) => {
        if (pillar.pillar_number !== pillarNumber) return pillar;
        if (pillar.initiatives.length >= MAX_INITIATIVES_PER_PILLAR) {
          return pillar;
        }
        return {
          ...pillar,
          initiatives: [
            ...pillar.initiatives,
            {
              ...initiative,
              initiative_number: pillar.initiatives.length + 1,
            },
          ],
        };
      }),
    );
  };

  const updateInitiative = (
    pillarNumber: number,
    initiativeNumber: number,
    initiative: Omit<InitiativeDraft, "initiative_number">,
  ) => {
    onPillarsChange(
      pillars.map((pillar) => {
        if (pillar.pillar_number !== pillarNumber) return pillar;
        return {
          ...pillar,
          initiatives: pillar.initiatives.map((item) =>
            item.initiative_number === initiativeNumber
              ? { ...initiative, initiative_number: initiativeNumber }
              : item,
          ),
        };
      }),
    );
  };

  const deleteInitiative = (pillarNumber: number, initiativeNumber: number) => {
    onPillarsChange(
      pillars.map((pillar) => {
        if (pillar.pillar_number !== pillarNumber) return pillar;
        const removed = pillar.initiatives.find(
          (item) => item.initiative_number === initiativeNumber,
        );
        if (removed) revokeInitiativeImageUrls(removed.images);
        const remaining = pillar.initiatives.filter(
          (item) => item.initiative_number !== initiativeNumber,
        );
        return {
          ...pillar,
          initiatives: remaining.map((item, index) => ({
            ...item,
            initiative_number: index + 1,
            priority_level:
              `P${index + 1}` as InitiativeDraft["priority_level"],
          })),
        };
      }),
    );
  };

  const adjustWeight = (pillarNumber: number, delta: number) => {
    if (!isWeighted) return;
    onPillarsChange(
      pillars.map((pillar) => {
        if (pillar.pillar_number !== pillarNumber) return pillar;
        const next = Math.max(0, Math.min(100, pillar.pillar_weight + delta));
        return { ...pillar, pillar_weight: next };
      }),
    );
  };

  const resetEqualWeights = () => {
    onPillarsChange(
      pillars.map((pillar) => ({
        ...pillar,
        pillar_weight: 20,
      })),
    );
  };

  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-foreground">
          The 5 Category Execution Pillars
        </h2>

        <div className="flex items-center rounded-full bg-brand-soft p-1">
          <button
            type="button"
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              !isWeighted
                ? "bg-primary text-primary-foreground"
                : "text-primary hover:bg-white/50",
            )}
            onClick={() => onScoringModeChange("UNWEIGHTED")}
          >
            <Scale className="size-3.5" />
            Unweighted Pillar
          </button>
          <button
            type="button"
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isWeighted
                ? "bg-primary text-primary-foreground"
                : "text-primary hover:bg-white/50",
            )}
            onClick={() => onScoringModeChange("WEIGHTED")}
          >
            <Scale className="size-3.5" />
            Weighted Pillar
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {isWeighted
          ? "Select weighing scheme: Use weighted scoring to assign individual score across each of the 5 pillars (summing to 100 points) or use unweighted scoring."
          : "Select weighing scheme: Use weighted scoring to assign individual score across each of the 5 pillars (summing to 100 points) or use unweighted scoring. Pillar scores are currently disabled (Unweighted Pillar mode active). All pillars carry equal weight."}
      </div>

      {isWeighted && (
        <div
          className={cn(
            "mb-4 flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between",
            totalWeight === 100
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900",
          )}
        >
          <p>
            Total Pillar weight: {totalWeight}/100.
            {totalWeight === 100
              ? " Excellent! The 5 pillar weights sum up to exactly 100 points."
              : " Adjust pillar scores so they sum to 100."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer rounded-lg border-primary text-primary hover:bg-white hover:text-primary"
            onClick={resetEqualWeights}
          >
            Reset Equal Weights
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {pillars.map((pillar) => {
          const meta = PILLAR_META.find(
            (item) => item.pillar_number === pillar.pillar_number,
          );
          const Icon = meta?.icon ?? Megaphone;
          const isOpen = expanded.includes(pillar.pillar_number);
          const initiativeCount = pillar.initiatives.length;
          const nextPriority = nextPriorityLevel(initiativeCount);
          const canAdd = Boolean(nextPriority);

          return (
            <div
              key={pillar.pillar_number}
              className="rounded-xl border border-border bg-white"
            >
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    meta?.iconClass ?? "bg-muted",
                  )}
                >
                  <Icon className="size-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pillar {pillar.pillar_number}
                  </p>
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {pillar.pillar_name}
                  </h3>
                </div>

                {initiativeCount > 0 ? (
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-primary">
                    {initiativeCount} Initiative
                    {initiativeCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-amber-600">
                    Atleast 1 initiative is recommended
                  </span>
                )}

                {isWeighted && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Pillar Score
                    </span>
                    <div className="flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        className="cursor-pointer px-2 py-1 text-primary hover:bg-accent"
                        onClick={() => adjustWeight(pillar.pillar_number, -5)}
                        aria-label="Decrease pillar score"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">
                        {pillar.pillar_weight}
                      </span>
                      <button
                        type="button"
                        className="cursor-pointer px-2 py-1 text-primary hover:bg-accent"
                        onClick={() => adjustWeight(pillar.pillar_number, 5)}
                        aria-label="Increase pillar score"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
                  onClick={() => toggleExpanded(pillar.pillar_number)}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? "Collapse pillar" : "Expand pillar"}
                >
                  {isOpen ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </button>
              </div>

              {isOpen && (
                <div className="space-y-4 border-t border-border px-4 py-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Pillar Description</Label>
                      <CharCount
                        value={pillar.pillar_description}
                        max={FIELD_LIMITS.pillarDescription}
                      />
                    </div>
                    <Textarea
                      value={pillar.pillar_description}
                      maxLength={FIELD_LIMITS.pillarDescription}
                      onChange={(event) =>
                        updatePillar(pillar.pillar_number, {
                          pillar_description: event.target.value,
                        })
                      }
                      placeholder="Define goal of the pillar"
                      className="min-h-10 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {pillar.initiatives.map((initiative) => (
                      <article
                        key={`${pillar.pillar_number}-${initiative.initiative_number}`}
                        className="relative flex min-h-[148px] flex-col rounded-lg border border-border bg-[#f3f4f6] p-3 text-left"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="rounded-md bg-[#ffe4e6] px-1.5 py-0.5 text-xs font-semibold text-[#e11d48]">
                              {initiative.priority_level}
                            </span>
                            <h4 className="truncate text-sm font-semibold text-foreground">
                              {initiative.accountable_function_department}
                            </h4>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                aria-label="Initiative actions"
                              >
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-36 p-0"
                            >
                              <DropdownMenuItem
                                className="cursor-pointer rounded-none px-3 py-2"
                                onClick={() => {
                                  setActivePillarNumber(pillar.pillar_number);
                                  setEditingInitiative(initiative);
                                }}
                              >
                                <Pencil className="size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="m-0" />
                              <DropdownMenuItem
                                variant="destructive"
                                className="cursor-pointer rounded-none px-3 py-2"
                                onClick={() =>
                                  deleteInitiative(
                                    pillar.pillar_number,
                                    initiative.initiative_number,
                                  )
                                }
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground">
                          {initiative.initiative_description}
                        </p>
                        <span className="inline-flex w-fit rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-primary">
                          Target {initiative.success_target}
                          {initiative.unit}
                          {initiative.kpi_metric
                            ? ` (${initiative.kpi_metric})`
                            : ""}
                        </span>
                      </article>
                    ))}

                    {canAdd && (
                      <button
                        type="button"
                        className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-[#f3f4f6] px-4 py-5 text-center transition-colors hover:border-primary hover:bg-accent"
                        onClick={() => {
                          setEditingInitiative(null);
                          setActivePillarNumber(pillar.pillar_number);
                        }}
                      >
                        {initiativeCount === 0 && (
                          <p className="px-6 text-center text-xs leading-relaxed text-muted-foreground">
                            No initiatives added for this pillar yet. Click
                            &quot;+ Add Initiative&quot; to add one.
                          </p>
                        )}
                        <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <Plus className="size-5" />
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          Add Initiative ({nextPriority})
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activePillar && activePriority && (
        <AddInitiativeModal
          key={
            editingInitiative
              ? `edit-${activePillar.pillar_number}-${editingInitiative.initiative_number}`
              : `new-${activePillar.pillar_number}-${activePillar.initiatives.length}`
          }
          open={activePillarNumber !== null}
          pillarName={activePillar.pillar_name}
          priorityLevel={activePriority}
          accountableOptions={catalog?.accountableDepartments ?? []}
          kpiOptions={
            catalog?.kpisByPillarNumber[activePillar.pillar_number] ?? []
          }
          initialInitiative={editingInitiative}
          onOpenChange={(open) => {
            if (!open) closeInitiativeModal();
          }}
          onSave={(initiative) => {
            if (editingInitiative) {
              updateInitiative(
                activePillar.pillar_number,
                editingInitiative.initiative_number,
                initiative,
              );
            } else {
              addInitiative(activePillar.pillar_number, initiative);
            }
            closeInitiativeModal();
          }}
        />
      )}
    </section>
  );
}
