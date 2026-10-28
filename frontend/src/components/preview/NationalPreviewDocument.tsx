import {
  Archive,
  Copy,
  Info,
  MoreVertical,
  Pencil,
  RotateCcw,
  Share2,
  Target,
  Trash2,
} from "lucide-react";

import {
  PillarBoard,
  type PillarBoardTrack,
} from "@/components/preview/PillarBoard";
import { PreviewWrappedText } from "@/components/preview/PreviewWrappedText";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { RetailerOnePagerCreatePayload } from "@/services/retailerCreateFormApi";
import type { OnePagerStatus } from "@/types/onePager";
import { cn } from "@/lib/utils";
import { formatPublishedAt } from "./nationalPreview";

const STATUS_BADGE: Record<
  OnePagerStatus,
  { label: string; className: string }
> = {
  PUBLISHED: {
    label: "Active",
    className:
      "bg-preview-active text-preview-priority-fg hover:bg-preview-active",
  },
  DRAFT: {
    label: "Draft",
    className: "bg-slate-200 text-slate-800 hover:bg-slate-200",
  },
  ARCHIVED: {
    label: "Archive",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  DELETED: {
    label: "Deleted",
    className: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  },
};

/** National payload shape, or retailer payload (includes target_retailer). */
type PreviewDocumentPayload = Omit<
  RetailerOnePagerCreatePayload,
  "target_retailer"
> & {
  target_retailer?: string;
};

type NationalPreviewDocumentProps = {
  payload: PreviewDocumentPayload;
  owner: string;
  publishedAt: string;
  onEdit?: () => void;
  /** Published only: leave the active one-pager and edit a new copy. */
  onCreateCopy?: () => void;
  /** Opens /track/:id. Omit on drafts, archive, and pre-publish preview. */
  onTrack?: () => void;
  /** Downloads the one-slide PPT. Omit on drafts and pre-publish preview. */
  onExport?: () => void;
  /** Opens delete confirm; only called when canDelete is true. */
  onDelete?: () => void;
  /** Opens archive confirm (published). Owner-gated via canEdit. */
  onArchive?: () => void;
  /** Opens restore confirm (archived). Owner-gated via canEdit. */
  onRestore?: () => void;
  /** Track/Export/Archive/Edit/Delete — off in create Preview, on after publish. */
  moreOptionsEnabled?: boolean;
  /** Edit stays visible for non-owners but is disabled. */
  canEdit?: boolean;
  /** Delete stays visible for non-owners but is disabled. */
  canDelete?: boolean;
  /**
   * Read-only role gate (user_type_3). When false, archive / restore / edit /
   * delete are hidden entirely; Track + Export stay available. Defaults true.
   */
  canModify?: boolean;
  /** Landing / GET list status. Create-publish preview stays Active. */
  status?: OnePagerStatus;
  /** When set, pillar board shows owner-gated RAG dots (Track page). */
  track?: PillarBoardTrack;
};

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block sm:px-4 sm:first:pl-0">
      <p className="shrink-0 text-xs font-medium text-muted-foreground">{label}</p>
      <PreviewWrappedText
        text={value || "—"}
        className="min-w-0 flex-1 text-right text-sm font-semibold text-foreground sm:mt-0.5 sm:flex-none sm:text-left"
      />
    </div>
  );
}

export function NationalPreviewDocument({
  payload,
  owner,
  publishedAt,
  onEdit,
  onCreateCopy,
  onTrack,
  onExport,
  onDelete,
  onArchive,
  onRestore,
  moreOptionsEnabled = false,
  canEdit = true,
  canDelete = true,
  canModify = true,
  status = "PUBLISHED",
  track,
}: NationalPreviewDocumentProps) {
  const statusBadge = moreOptionsEnabled
    ? STATUS_BADGE[status]
    : {
        label: "STATUS",
        className: "bg-slate-200 text-slate-600 hover:bg-slate-200",
      };
  const showArchive = canModify && status === "PUBLISHED" && Boolean(onArchive);
  const showRestore = canModify && status === "ARCHIVED" && Boolean(onRestore);
  const showEdit = canModify && (status === "PUBLISHED" || status === "DRAFT");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <dl className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-y-2 sm:divide-x sm:divide-border">
            {payload.target_retailer ? (
              <PreviewField
                label="Target Retailer"
                value={payload.target_retailer}
              />
            ) : null}
            <PreviewField label="Channel" value={payload.channel} />
            <PreviewField
              label="Business Group"
              value={payload.business_group ?? ""}
            />
            <PreviewField label="Category" value={payload.category} />
            <PreviewField label="Campaign Focus" value={payload.campaign} />
            <PreviewField label="Market / Geography" value={payload.market} />
            <PreviewField label="Year" value={payload.year ?? ""} />
          </dl>
          <PreviewWrappedText
            text={payload.business_outcome_statement || "—"}
            className="mt-4 text-sm leading-relaxed text-foreground/85"
          />
        </div>

        <div className="flex w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-left sm:w-auto sm:flex-col sm:flex-nowrap sm:items-end sm:gap-1 sm:text-right">
          <div className="order-2 ml-auto sm:order-none sm:ml-0">
          {moreOptionsEnabled ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                >
                  More Options
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40 p-0">
                {onTrack ? (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={onTrack}
                    >
                      <Target className="size-4" />
                      Track
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
                {onExport ? (
                  <>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={onExport}
                    >
                      <Share2 className="size-4" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
                {showArchive ? (
                  <>
                    <DropdownMenuItem
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? undefined
                          : "Only the owner can archive this one-pager"
                      }
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={() => {
                        if (!canEdit) return;
                        onArchive?.();
                      }}
                    >
                      <Archive className="size-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
                {showRestore ? (
                  <>
                    <DropdownMenuItem
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? undefined
                          : "Only the owner can restore this one-pager"
                      }
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={() => {
                        if (!canEdit) return;
                        onRestore?.();
                      }}
                    >
                      <RotateCcw className="size-4" />
                      Restore
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
                {showEdit && status === "PUBLISHED" ? (
                  <>
                    <DropdownMenuItem
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? undefined
                          : "Only the owner can edit this one-pager"
                      }
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={() => {
                        if (!canEdit) return;
                        onEdit?.();
                      }}
                    >
                      <Pencil className="size-4" />
                      Edit &amp; Replace
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? undefined
                          : "Only the owner can edit this one-pager"
                      }
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={() => {
                        if (!canEdit) return;
                        onCreateCopy?.();
                      }}
                    >
                      <Copy className="size-4" />
                      Create a copy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
                {showEdit && status === "DRAFT" ? (
                  <>
                    <DropdownMenuItem
                      disabled={!canEdit}
                      title={
                        canEdit
                          ? undefined
                          : "Only the owner can edit this one-pager"
                      }
                      className="cursor-pointer rounded-none px-3 py-2"
                      onClick={() => {
                        if (!canEdit) return;
                        onEdit?.();
                      }}
                    >
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                  </>
                ) : null}
                {/* TODO: Real FastAPI DELETE is dispatched by parents via onDelete.
                    Keep destructive styling + owner-disabled behavior. */}
                {canModify ? (
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={!canDelete}
                    title={
                      canDelete
                        ? undefined
                        : "Only the owner can delete this one-pager"
                    }
                    className="cursor-pointer rounded-none px-3 py-2"
                    onClick={() => {
                      if (!canDelete) return;
                      onDelete?.();
                    }}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1 text-sm font-medium text-muted-foreground opacity-50"
            >
              More Options
              <MoreVertical className="size-4" />
            </span>
          )}
          </div>

          <Badge
            className={cn(
              "order-1 w-fit rounded-full px-2.5 sm:order-none sm:mt-1",
              statusBadge.className,
            )}
          >
            {statusBadge.label}
          </Badge>
          {status === "PUBLISHED" && (
            <p className="order-3 w-full text-xs text-muted-foreground sm:order-none sm:w-auto">
              <span className="font-semibold text-foreground">Published:</span>{" "}
              {moreOptionsEnabled
                ? formatPublishedAt(new Date(publishedAt))
                : "NA"}
            </p>
          )}
          <p className="order-4 w-full text-xs text-muted-foreground sm:order-none sm:w-auto">
            <span className="font-semibold text-foreground">Owner:</span>{" "}
            {owner}
          </p>
          {payload.scoring_mode === "WEIGHTED" ? (
            <p className="order-5 w-full text-xs text-muted-foreground sm:order-none sm:w-auto">
              <span className="font-semibold text-foreground">Total :</span>{" "}
              100pts
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {!moreOptionsEnabled &&
        payload.pillars.some((pillar) => pillar.initiatives.length === 0) ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-medium font-medium text-amber-950">
            <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
            <p className="text-[#b03800]">
              No initiatives added for the pillars
            </p>
          </div>
        ) : null}
        <h2 className="text-sm font-semibold text-foreground">
          Five Category Execution Pillars & Directives
        </h2>

        <PillarBoard
          pillars={payload.pillars}
          scoringMode={payload.scoring_mode}
          track={track}
        />
      </div>
    </div>
  );
}
