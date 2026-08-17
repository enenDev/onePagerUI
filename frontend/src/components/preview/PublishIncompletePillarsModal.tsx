import { Info, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PublishIncompletePillarsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirmPublish: () => void;
  publishing?: boolean;
};

export function PublishIncompletePillarsModal({
  open,
  onOpenChange,
  onCancel,
  onConfirmPublish,
  publishing = false,
}: PublishIncompletePillarsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-4 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6 font-semibold text-foreground">
            Some pillars are incomplete
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <p>
            You haven&apos;t added an initiative to every pillar. Do you still
            want to publish?
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-full border-primary text-primary hover:bg-accent hover:text-primary"
            onClick={onCancel}
            disabled={publishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-full"
            onClick={onConfirmPublish}
            disabled={publishing}
          >
            <Send className="size-4" />
            {publishing ? "Publishing..." : "Yes, Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
