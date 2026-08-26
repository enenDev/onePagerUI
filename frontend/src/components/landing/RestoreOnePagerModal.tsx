import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RestoreOnePagerModalProps = {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  restoring?: boolean;
  error?: string | null;
};

export function RestoreOnePagerModal({
  open,
  title,
  onOpenChange,
  onConfirm,
  restoring = false,
  error = null,
}: RestoreOnePagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 font-semibold text-foreground">
            Restore One-Pager
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
            You are trying to restore{" "}
            <span className="font-semibold">&apos;{title}&apos;</span>. Once
            confirmed, it will be moved to{" "}
            <span className="font-semibold">drafts</span> and can be modified
            and published from there.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-rose-500 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            onClick={() => onOpenChange(false)}
            disabled={restoring}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg bg-primary text-primary-foreground"
            onClick={onConfirm}
            disabled={restoring}
          >
            <RotateCcw className="size-4" />
            {restoring ? "Restoring…" : "Restore"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
