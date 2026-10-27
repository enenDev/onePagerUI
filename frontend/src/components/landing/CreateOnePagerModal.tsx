import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, MapPin, Store, FileInput } from "lucide-react";

import { ImportFromNationalPicker } from "@/components/landing/ImportFromNationalPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/redux/hooks";
import { canCreateNationalOnePager } from "@/redux/userSlice";
import type { RetailerImportLocationState } from "@/pages/CreateRetailerOnePager";
import type { OnePagerListItem } from "@/types/onePager";

type CreateStep = "type" | "retailer" | "import";

type CreateOnePagerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const NATIONAL_CREATE_CSP_ONLY_TOOLTIP =
  "National one pager creation is only accessible for the CSP users";

/** The import filter sheet and its menus are portaled outside this dialog. */
function isImportFilterLayer(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "[data-import-filter-sheet], [data-slot=popover-content]",
      ),
    )
  );
}

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
  const userType = useAppSelector((state) => state.user.currentUser.user_type);
  const nationalAllowed = canCreateNationalOnePager(userType);
  const [step, setStep] = useState<CreateStep>("type");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep("type");
    }
    onOpenChange(nextOpen);
  };

  const closeFlow = () => handleOpenChange(false);

  const handleImportSubmit = (item: OnePagerListItem) => {
    const state: RetailerImportLocationState = {
      importFrom: "national",
      source: item,
    };
    closeFlow();
    navigate("/create/retailer", { state });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col",
          step === "import"
            ? "h-[min(36rem,85vh)] gap-4 overflow-hidden sm:max-w-5xl"
            : "max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto sm:h-[18rem] sm:max-w-xl sm:overflow-hidden",
        )}
        onPointerDownOutside={(event) => {
          if (isImportFilterLayer(event.target)) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isImportFilterLayer(event.target)) event.preventDefault();
        }}
        onFocusOutside={(event) => {
          if (isImportFilterLayer(event.target)) event.preventDefault();
        }}
      >
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
              {step === "import" ? (
                <>
                  <button
                    type="button"
                    className="cursor-pointer text-primary underline-offset-2 hover:underline"
                    onClick={() => setStep("retailer")}
                  >
                    Retailer One Pager
                  </button>
                  <span className="text-muted-foreground">&gt;</span>
                  <span className="text-foreground">
                    Import from National One Pager
                  </span>
                </>
              ) : (
                <span className="text-foreground">Retailer One Pager</span>
              )}
            </DialogTitle>
          )}
        </DialogHeader>

        {step === "import" ? (
          <ImportFromNationalPicker onSubmit={handleImportSubmit} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:min-h-0 sm:flex-1 sm:grid-cols-2">
            {(step === "type" ? TYPE_OPTIONS : RETAILER_OPTIONS).map(
              (option) => {
                const Icon = option.icon;
                const isRetailerStep = step === "retailer";
                const nationalDisabled =
                  !isRetailerStep &&
                  option.id === "national" &&
                  !nationalAllowed;

                const card = (
                  <button
                    type="button"
                    disabled={nationalDisabled}
                    className={cn(
                      "flex h-full min-h-36 w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-white p-6 text-center transition-colors",
                      nationalDisabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer hover:border-primary hover:bg-accent",
                    )}
                    onClick={() => {
                      if (nationalDisabled) return;

                      if (!isRetailerStep && option.id === "retailer") {
                        setStep("retailer");
                        return;
                      }

                      if (!isRetailerStep && option.id === "national") {
                        closeFlow();
                        navigate("/create/national");
                        return;
                      }

                      if (isRetailerStep && option.id === "scratch") {
                        closeFlow();
                        navigate("/create/retailer");
                        return;
                      }

                      if (isRetailerStep && option.id === "import") {
                        setStep("import");
                      }
                    }}
                  >
                    <Icon
                      className={cn(
                        "size-8",
                        nationalDisabled
                          ? "text-muted-foreground"
                          : "text-primary",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        nationalDisabled
                          ? "text-muted-foreground"
                          : isRetailerStep
                            ? "text-primary"
                            : "text-foreground",
                      )}
                    >
                      {option.label}
                    </span>
                  </button>
                );

                if (!nationalDisabled) {
                  return <div key={option.id}>{card}</div>;
                }

                return (
                  <Tooltip key={option.id}>
                    <TooltipTrigger asChild>
                      <span className="flex h-full min-h-36">{card}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{NATIONAL_CREATE_CSP_ONLY_TOOLTIP}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              },
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
