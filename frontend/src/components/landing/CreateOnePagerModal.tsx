import { MapPin, Store } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CreateOnePagerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const OPTIONS = [
  {
    id: "national",
    label: "National One-Pager",
    icon: MapPin,
  },
  {
    id: "retailer",
    label: "Retailer One-Pager",
    icon: Store,
  },
] as const;

export function CreateOnePagerModal({
  open,
  onOpenChange,
}: CreateOnePagerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-6 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New One-Pager</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-white p-6 text-center transition-colors",
                  "hover:border-primary hover:bg-accent",
                )}
                // Wiring to National / Retailer flows comes later
                onClick={() => onOpenChange(false)}
              >
                <Icon className="size-8 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
