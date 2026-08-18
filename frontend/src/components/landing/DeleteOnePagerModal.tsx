import { Info, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DeleteOnePagerModalProps = {
  open: boolean;
  title: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  deleting?: boolean;
  error?: string | null;
};

export function DeleteOnePagerModal({
  open,
  title,
  onOpenChange,
  onConfirm,
  deleting = false,
  error = null,
}: DeleteOnePagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 font-semibold text-foreground">
            Delete One-Pager
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-950">
          <Info className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <p>
            You are trying to delete{" "}
            <span className="font-semibold">&apos;{title}&apos;</span>. Once
            confirmed, it will be deleted permanently.{" "}
            <span className="font-semibold">Are you sure?</span>
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-primary text-primary hover:bg-accent hover:text-primary"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="cursor-pointer rounded-lg"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 className="size-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
