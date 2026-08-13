import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, MapPin, Store, FileInput } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CreateStep = "type" | "retailer";

type CreateOnePagerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TYPE_OPTIONS = [
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

const RETAILER_OPTIONS = [
  {
    id: "scratch",
    label: "Build from Scratch",
    icon: LayoutGrid,
  },
  {
    id: "import",
    label: "Import From National",
    icon: FileInput,
  },
] as const;

export function CreateOnePagerModal({
  open,
  onOpenChange,
}: CreateOnePagerModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<CreateStep>("type");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("type");
    }
    onOpenChange(nextOpen);
  };

  const closeFlow = () => handleOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[18rem] max-w-xl flex-col gap-6 overflow-hidden sm:max-w-xl">
        <DialogHeader className="min-h-10 shrink-0 justify-center pr-8">
          {step === "type" ? (
            <DialogTitle>Create New One-Pager</DialogTitle>
          ) : (
            <DialogTitle className="flex flex-wrap items-center gap-1.5 text-base font-semibold">
              <button
                type="button"
                className="cursor-pointer text-primary underline-offset-2 hover:underline"
                onClick={() => setStep("type")}
              >
                Create New One-Pager
              </button>
              <span className="text-muted-foreground">&gt;</span>
              <span className="text-foreground">Retailer One Pager</span>
            </DialogTitle>
          )}
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          {(step === "type" ? TYPE_OPTIONS : RETAILER_OPTIONS).map((option) => {
            const Icon = option.icon;
            const isRetailerStep = step === "retailer";

            return (
              <button
                key={option.id}
                type="button"
                className={cn(
                  "flex h-full min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-border bg-white p-6 text-center transition-colors",
                  "hover:border-primary hover:bg-accent",
                )}
                onClick={() => {
                  if (!isRetailerStep && option.id === "retailer") {
                    setStep("retailer");
                    return;
                  }

                  if (!isRetailerStep && option.id === "national") {
                    closeFlow();
                    navigate("/create/national");
                    return;
                  }

                  // Build from Scratch / Import From National wiring comes later
                  closeFlow();
                }}
              >
                <Icon className="size-8 text-primary" />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isRetailerStep ? "text-primary" : "text-foreground",
                  )}
                >
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
