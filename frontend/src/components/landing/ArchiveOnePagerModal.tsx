import { Archive } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ArchiveOnePagerModalProps = {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  archiving?: boolean;
  error?: string | null;
};

export function ArchiveOnePagerModal({
  open,
  title,
  onOpenChange,
  onConfirm,
  archiving = false,
  error = null,
}: ArchiveOnePagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 font-semibold text-foreground">
            Archive One-Pager
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <span
            aria-hidden
            className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white"
          >
            i
          </span>
          <p>
            You are trying to archive{" "}
            <span className="font-semibold">&apos;{title}&apos;</span>. Once
            confirmed, it will be unpublished and moved to archive.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-rose-500 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => onOpenChange(false)}
            disabled={archiving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg bg-primary text-primary-foreground"
            onClick={onConfirm}
            disabled={archiving}
          >
            <Archive className="size-4" />
            {archiving ? "Archiving…" : "Archive"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
