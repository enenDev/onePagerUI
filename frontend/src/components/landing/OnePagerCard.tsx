import { useState, type ReactNode } from "react";
import {
  Archive,
  MoreVertical,
  Pencil,
  RotateCcw,
  Share2,
  Target,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ArchiveOnePagerModal } from "@/components/landing/ArchiveOnePagerModal";
import { DeleteOnePagerModal } from "@/components/landing/DeleteOnePagerModal";
import { EditPublishedOnePagerModal } from "@/components/landing/EditPublishedOnePagerModal";
import { RestoreOnePagerModal } from "@/components/landing/RestoreOnePagerModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  archiveOnePager,
  deleteOnePager,
  restoreOnePager,
} from "@/redux/landingSlice";
import { isCurrentUserOwner } from "@/redux/userSlice";
import { exportOnePagerById } from "@/services/exportOnePagerPpt";
import type { OnePagerListItem, OnePagerStatus } from "@/types/onePager";

type OnePagerCardProps = {
  item: OnePagerListItem;
};

type CardMenuAction =
  | "track"
  | "export"
  | "archive"
  | "restore"
  | "edit"
  | "delete";

function menuActionsForStatus(status: OnePagerStatus): CardMenuAction[] {
  if (status === "PUBLISHED") {
    return ["track", "export", "archive", "edit", "delete"];
  }
  if (status === "DRAFT") {
    return ["edit", "delete"];
  }
  // ARCHIVED (and DELETED if ever listed): export / restore / delete
  return ["export", "restore", "delete"];
}

export function OnePagerCard({ item }: OnePagerCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const scoringLabel =
    item.scoring_mode === "WEIGHTED" ? "Weighted" : "Unweighted";
  const isOwner = isCurrentUserOwner(item.created_by, currentUser.id);
  const viewPath = `/view/${item.pager_id}`;
  const actions = menuActionsForStatus(item.status);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [editPublishedOpen, setEditPublishedOpen] = useState(false);
  const [editPublishedBusy, setEditPublishedBusy] = useState(false);
  const [editPublishedError, setEditPublishedError] = useState<string | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  const goEditCreateAsNew = () => {
    navigate(`/edit/${item.pager_id}`, { state: { createAsNew: true } });
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportOnePagerById(item.pager_id);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isOwner) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await dispatch(deleteOnePager(item.pager_id)).unwrap();
      setDeleteOpen(false);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete one-pager",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmArchive = async () => {
    if (!isOwner) return;
    setArchiving(true);
    setArchiveError(null);
    try {
      await dispatch(archiveOnePager(item.pager_id)).unwrap();
      setArchiveOpen(false);
    } catch (err) {
      setArchiveError(
        err instanceof Error ? err.message : "Failed to archive one-pager",
      );
    } finally {
      setArchiving(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!isOwner) return;
    setRestoring(true);
    setRestoreError(null);
    try {
      await dispatch(restoreOnePager(item.pager_id)).unwrap();
      setRestoreOpen(false);
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : "Failed to restore one-pager",
      );
    } finally {
      setRestoring(false);
    }
  };

  const handleArchiveAndEdit = async () => {
    if (!isOwner) return;
    setEditPublishedBusy(true);
    setEditPublishedError(null);
    try {
      await dispatch(archiveOnePager(item.pager_id)).unwrap();
      setEditPublishedOpen(false);
      goEditCreateAsNew();
    } catch (err) {
      setEditPublishedError(
        err instanceof Error ? err.message : "Failed to archive one-pager",
      );
    } finally {
      setEditPublishedBusy(false);
    }
  };

  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-card-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute top-5 right-5 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer rounded-full bg-brand-soft text-primary hover:bg-brand-soft-hover"
              aria-label="Card actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40 p-0">
            {actions.map((action, index) => (
              <CardMenuItem
                key={action}
                action={action}
                isOwner={isOwner}
                showSeparator={index < actions.length - 1}
                onEdit={() => {
                  if (!isOwner) return;
                  if (item.status === "PUBLISHED") {
                    setEditPublishedError(null);
                    setEditPublishedOpen(true);
                    return;
                  }
                  navigate(`/edit/${item.pager_id}`);
                }}
                onTrack={() => {
                  navigate(`/track/${item.pager_id}`);
                }}
                onExport={() => {
                  void handleExport();
                }}
                exporting={exporting}
                onArchive={() => {
                  if (!isOwner) return;
                  setArchiveError(null);
                  setArchiveOpen(true);
                }}
                onRestore={() => {
                  if (!isOwner) return;
                  setRestoreError(null);
                  setRestoreOpen(true);
                }}
                onDelete={() => {
                  if (!isOwner) return;
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link
        to={viewPath}
        className="block cursor-pointer text-inherit no-underline outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        aria-label={`Open ${item.title}`}
      >
        {/* Cover inset — grey card bg forms the border around it */}
        <div className="px-3 pt-3">
          <div className="relative h-36 overflow-hidden rounded-lg bg-white">
            {item.cover_image_url ? (
              <img
                src={item.cover_image_url}
                alt=""
                className="size-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4 text-left">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="rounded-full bg-brand-soft text-accent-foreground hover:bg-brand-soft"
            >
              {item.pager_type === "retailer" ? "Retailer" : "National"}
            </Badge>
            <Badge
              variant="secondary"
              className="rounded-full bg-brand-soft text-accent-foreground hover:bg-brand-soft"
            >
              {scoringLabel}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground md:text-base">
            {item.title}
          </h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {item.business_outcome_statement}
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Published:</span>{" "}
              {item.published_at}
            </p>
            <p>
              <span className="font-semibold text-foreground">Owner:</span>{" "}
              {item.created_by}
            </p>
          </div>
        </div>
      </Link>

      <DeleteOnePagerModal
        open={deleteOpen}
        title={item.title}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        deleting={deleting}
        error={deleteError}
      />
      <ArchiveOnePagerModal
        open={archiveOpen}
        title={item.title}
        onOpenChange={setArchiveOpen}
        onConfirm={() => {
          void handleConfirmArchive();
        }}
        archiving={archiving}
        error={archiveError}
      />
      <RestoreOnePagerModal
        open={restoreOpen}
        title={item.title}
        onOpenChange={setRestoreOpen}
        onConfirm={() => {
          void handleConfirmRestore();
        }}
        restoring={restoring}
        error={restoreError}
      />
      <EditPublishedOnePagerModal
        open={editPublishedOpen}
        onOpenChange={setEditPublishedOpen}
        busy={editPublishedBusy}
        error={editPublishedError}
        onKeepActiveAndEdit={() => {
          setEditPublishedOpen(false);
          goEditCreateAsNew();
        }}
        onArchiveAndEdit={() => {
          void handleArchiveAndEdit();
        }}
      />
    </article>
  );
}

function CardMenuItem({
  action,
  isOwner,
  showSeparator,
  onEdit,
  onTrack,
  onExport,
  exporting,
  onArchive,
  onRestore,
  onDelete,
}: {
  action: CardMenuAction;
  isOwner: boolean;
  showSeparator: boolean;
  onEdit: () => void;
  onTrack: () => void;
  onExport: () => void;
  exporting: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const itemClassName = "cursor-pointer rounded-none px-3 py-2";

  let menuItem: ReactNode;

  switch (action) {
    case "track":
      menuItem = (
        <DropdownMenuItem className={itemClassName} onClick={onTrack}>
          <Target className="size-4" />
          Track
        </DropdownMenuItem>
      );
      break;
    case "export":
      menuItem = (
        <DropdownMenuItem
          className={itemClassName}
          disabled={exporting}
          onClick={onExport}
        >
          <Share2 className="size-4" />
          {exporting ? "Exporting…" : "Export"}
        </DropdownMenuItem>
      );
      break;
    case "archive":
      menuItem = (
        <DropdownMenuItem
          disabled={!isOwner}
          title={
            isOwner
              ? undefined
              : "Only the owner can archive this one-pager"
          }
          className={itemClassName}
          onClick={() => {
            if (!isOwner) return;
            onArchive();
          }}
        >
          <Archive className="size-4" />
          Archive
        </DropdownMenuItem>
      );
      break;
    case "restore":
      menuItem = (
        <DropdownMenuItem
          disabled={!isOwner}
          title={
            isOwner
              ? undefined
              : "Only the owner can restore this one-pager"
          }
          className={itemClassName}
          onClick={() => {
            if (!isOwner) return;
            onRestore();
          }}
        >
          <RotateCcw className="size-4" />
          Restore
        </DropdownMenuItem>
      );
      break;
    case "edit":
      menuItem = (
        <DropdownMenuItem
          disabled={!isOwner}
          title={
            isOwner ? undefined : "Only the owner can edit this one-pager"
          }
          className={itemClassName}
          onClick={onEdit}
        >
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
      );
      break;
    case "delete":
      menuItem = (
        <DropdownMenuItem
          variant="destructive"
          disabled={!isOwner}
          title={
            isOwner
              ? undefined
              : "Only the owner can delete this one-pager"
          }
          className={itemClassName}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      );
      break;
  }

  return (
    <>
      {menuItem}
      {showSeparator ? <DropdownMenuSeparator className="m-0" /> : null}
    </>
  );
}
