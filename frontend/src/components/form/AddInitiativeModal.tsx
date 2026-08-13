import { useEffect, useRef, useState, type RefObject } from "react";
import { CalendarDays, CloudUpload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_INITIATIVE_IMAGES,
  type InitiativeDraft,
  type InitiativeImage,
} from "@/components/form/pillars";

function isImageFile(file: File) {
  if (file.type.startsWith("image/")) return true;
  // Some OS/browser combos leave type empty for valid images.
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(file.name);
}

const ACCOUNTABLE_OPTIONS = [
  "CSP & Brand Operations",
  "Trade Marketing / Merchandising",
  "CBD Accounts Team",
  "Digital Commerce Team",
  "Supply Chain Operations",
  "Customer Business Development (CBD)",
  "Human Resources",
  "Sales",
];

const KPI_OPTIONS = [
  "Value Sales",
  "Training Completion Rate",
  "Process Compliance",
  "Product Availability",
  "Sales Conversion Rate",
  "Digital Adoption",
];

type AddInitiativeModalProps = {
  open: boolean;
  pillarName: string;
  priorityLevel: InitiativeDraft["priority_level"];
  initialInitiative?: InitiativeDraft | null;
  onOpenChange: (open: boolean) => void;
  onSave: (initiative: Omit<InitiativeDraft, "initiative_number">) => void;
};

type FormState = {
  accountable_function_department: string;
  initiative_description: string;
  kpi_metric: string;
  success_target: string;
  unit: string;
  week_start: string;
  week_end: string;
  guidelines: string;
  checklist_compliance_notes: string;
  images: InitiativeImage[];
};

const emptyForm = (): FormState => ({
  accountable_function_department: "",
  initiative_description: "",
  kpi_metric: "",
  success_target: "",
  unit: "",
  week_start: "",
  week_end: "",
  guidelines: "",
  checklist_compliance_notes: "",
  images: [],
});

function initiativeToForm(initiative: InitiativeDraft): FormState {
  return {
    accountable_function_department:
      initiative.accountable_function_department,
    initiative_description: initiative.initiative_description,
    kpi_metric: initiative.kpi_metric,
    success_target: initiative.success_target,
    unit: initiative.unit,
    week_start: initiative.week_start,
    week_end: initiative.week_end,
    guidelines: initiative.guidelines,
    checklist_compliance_notes: initiative.checklist_compliance_notes,
    images: initiative.images,
  };
}

const DATE_PATTERN = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

function isoToDisplay(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${month}/${day}/${year}`;
}

function displayToIso(display: string) {
  if (!DATE_PATTERN.test(display)) return "";
  const [month, day, year] = display.split("/");
  return `${year}-${month}-${day}`;
}

function isValidDisplayDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [month, day, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Compare mm/dd/yyyy display dates via ISO (yyyy-mm-dd) lexicographic order. */
function isDisplayDateBefore(a: string, b: string) {
  if (!isValidDisplayDate(a) || !isValidDisplayDate(b)) return false;
  return displayToIso(a) < displayToIso(b);
}

export function AddInitiativeModal({
  open,
  pillarName,
  priorityLevel,
  initialInitiative = null,
  onOpenChange,
  onSave,
}: AddInitiativeModalProps) {
  const [form, setForm] = useState<FormState>(() =>
    initialInitiative ? initiativeToForm(initialInitiative) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const startPickerRef = useRef<HTMLInputElement>(null);
  const endPickerRef = useRef<HTMLInputElement>(null);
  const retainedImageIdsRef = useRef(
    new Set(initialInitiative?.images.map((image) => image.id) ?? []),
  );
  const atImageLimit = form.images.length >= MAX_INITIATIVE_IMAGES;

  // Radix can leave body pointer-events stuck after the dialog unmounts
  // (especially after a native file picker). Only repair on teardown.
  useEffect(() => {
    return () => {
      document.body.style.pointerEvents = "";
    };
  }, []);

  // After the OS file dialog closes, ensure the modal content still accepts clicks
  // so the next one-by-one upload can be started.
  useEffect(() => {
    if (!open) return;

    const repairDialogPointerEvents = () => {
      const content = document.querySelector(
        '[data-slot="dialog-content"]',
      ) as HTMLElement | null;
      if (content) content.style.pointerEvents = "auto";
    };

    window.addEventListener("focus", repairDialogPointerEvents);
    return () => {
      window.removeEventListener("focus", repairDialogPointerEvents);
    };
  }, [open]);

  const patch = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const dismiss = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm((prev) => {
        prev.images.forEach((image) => {
          if (!retainedImageIdsRef.current.has(image.id)) {
            URL.revokeObjectURL(image.blobUrl);
          }
        });
        return emptyForm();
      });
      setError(null);
      document
        .querySelectorAll("[data-initiative-file-picker='true']")
        .forEach((node) => node.remove());
      // Defer so Radix can finish its close cleanup first, then clear a stuck lock.
      requestAnimationFrame(() => {
        document.body.style.pointerEvents = "";
      });
    }
    onOpenChange(nextOpen);
  };

  const handleUnitChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      patch({ unit: value });
    }
  };

  const handleFiles = (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;

    // Snapshot immediately — FileList from a removed <input> is live and can clear
    // before the setState updater runs (breaks multi-select / sequential picks).
    const selected = Array.from(fileList);

    setForm((prev) => {
      const remaining = MAX_INITIATIVE_IMAGES - prev.images.length;
      if (remaining <= 0) return prev;

      const nextImages = [...prev.images];
      for (const file of selected.slice(0, remaining)) {
        if (!isImageFile(file)) continue;
        nextImages.push({
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          name: file.name,
          // TODO: On Save/Publish with real backend, upload `file` and replace blobUrl
          // with the permanent URL before/while building NationalOnePagerCreatePayload.
          blobUrl: URL.createObjectURL(file),
          file,
        });
      }
      return { ...prev, images: nextImages };
    });
  };

  /** Fresh input per pick — avoids Radix/dialog file-input getting stuck after the first OS picker. */
  const openImagePicker = () => {
    if (atImageLimit) return;

    document
      .querySelectorAll("[data-initiative-file-picker='true']")
      .forEach((node) => node.remove());

    const input = document.createElement("input");
    input.type = "file";
    input.accept =
      "image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml";
    input.multiple = true;
    input.dataset.initiativeFilePicker = "true";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "0";
    input.tabIndex = -1;

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      input.remove();
      const content = document.querySelector(
        '[data-slot="dialog-content"]',
      ) as HTMLElement | null;
      if (content) content.style.pointerEvents = "auto";
    };

    input.addEventListener("change", () => {
      const files = input.files ? Array.from(input.files) : [];
      handleFiles(files);
      settle();
    });
    input.addEventListener("cancel", settle);

    document.body.appendChild(input);
    input.click();
  };

  const removeImage = (id: string) => {
    setForm((prev) => {
      const target = prev.images.find((image) => image.id === id);
      if (target?.blobUrl.startsWith("blob:")) {
        URL.revokeObjectURL(target.blobUrl);
      }
      retainedImageIdsRef.current.delete(id);
      return {
        ...prev,
        images: prev.images.filter((image) => image.id !== id),
      };
    });
  };

  const handleSave = () => {
    if (!form.accountable_function_department) {
      setError("Accountable Function / Department is required.");
      return;
    }
    if (!form.initiative_description.trim()) {
      setError("Initiative Description is required.");
      return;
    }
    if (!form.kpi_metric) {
      setError("KPI Metric is required.");
      return;
    }
    if (!form.success_target.trim()) {
      setError("Success Target is required.");
      return;
    }
    if (!isValidDisplayDate(form.week_start)) {
      setError("Week Start must be a valid date in mm/dd/yyyy format.");
      return;
    }
    if (!isValidDisplayDate(form.week_end)) {
      setError("Week End must be a valid date in mm/dd/yyyy format.");
      return;
    }
    if (isDisplayDateBefore(form.week_end, form.week_start)) {
      setError("Week End must be on or after Week Start.");
      return;
    }
    if (!form.guidelines.trim()) {
      setError("Guidelines are required.");
      return;
    }

    setError(null);
    onSave({
      priority_level: priorityLevel,
      accountable_function_department: form.accountable_function_department,
      initiative_description: form.initiative_description.trim(),
      kpi_metric: form.kpi_metric,
      success_target: form.success_target.trim(),
      unit: form.unit.trim(),
      week_start: form.week_start,
      week_end: form.week_end,
      guidelines: form.guidelines.trim(),
      checklist_compliance_notes: form.checklist_compliance_notes.trim(),
      images: form.images,
    });
    setForm(emptyForm());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={dismiss}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl gap-4 overflow-y-auto sm:max-w-3xl"
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          // Native file picker focus loss can look like an outside interact.
          const target = event.target as HTMLElement | null;
          if (target?.closest?.('input[type="file"]')) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>
              {initialInitiative ? "Edit Initiative" : "Add New Initiative"}
            </span>
            <span className="rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-xs font-medium text-[#5b21b6]">
              {pillarName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Priority Level</Label>
            <div className="inline-flex h-9 items-center rounded-lg bg-[#ffe4e6] px-3 text-sm font-semibold text-[#e11d48]">
              {priorityLevel}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Accountable Function / Department{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.accountable_function_department || undefined}
              onValueChange={(value) =>
                patch({ accountable_function_department: value ?? "" })
              }
            >
              <SelectTrigger className="h-9 w-full cursor-pointer bg-white">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTABLE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="cursor-pointer"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Initiative Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={form.initiative_description}
            onChange={(event) =>
              patch({ initiative_description: event.target.value })
            }
            placeholder="Enter Description"
            className="min-h-20 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.2fr_1fr_0.6fr]">
          <div className="space-y-2">
            <Label>
              KPI Metric <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.kpi_metric || undefined}
              onValueChange={(value) => patch({ kpi_metric: value ?? "" })}
            >
              <SelectTrigger className="h-9 w-full cursor-pointer bg-white">
                <SelectValue placeholder="Select KPI Metric" />
              </SelectTrigger>
              <SelectContent>
                {KPI_OPTIONS.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="cursor-pointer"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>
              Success Target <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.success_target}
              onChange={(event) =>
                patch({ success_target: event.target.value })
              }
              placeholder="Enter Value"
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Input
              value={form.unit}
              onChange={(event) => handleUnitChange(event.target.value)}
              placeholder="%"
              inputMode="decimal"
              className="bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            label="Week Start"
            required
            value={form.week_start}
            pickerRef={startPickerRef}
            onChange={(value) => {
              // If start moves past end, clear end so it cannot stay invalid.
              const next: Partial<FormState> = { week_start: value };
              if (
                form.week_end &&
                isValidDisplayDate(value) &&
                isDisplayDateBefore(form.week_end, value)
              ) {
                next.week_end = "";
              }
              patch(next);
            }}
          />
          <DateField
            label="Week End"
            required
            value={form.week_end}
            pickerRef={endPickerRef}
            minIso={
              isValidDisplayDate(form.week_start)
                ? displayToIso(form.week_start)
                : undefined
            }
            onChange={(value) => patch({ week_end: value })}
          />
        </div>

        <div className="space-y-2">
          <Label>
            Guidelines <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={form.guidelines}
            onChange={(event) => patch({ guidelines: event.target.value })}
            placeholder="Enter instructions regarding execution of initiative/visual guidelines"
            className="min-h-20 bg-white"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Photo Guideline & Checklist</Label>

            <div className="flex h-16 items-center gap-2 overflow-x-auto rounded-lg border border-dashed border-border bg-[#f8fafc] px-2">
              {form.images.length === 0 ? (
                <p className="w-full text-center text-xs text-muted-foreground">
                  Image preview
                </p>
              ) : (
                form.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-white"
                  >
                    <img
                      src={image.blobUrl}
                      alt={image.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 cursor-pointer rounded-full bg-black/60 p-0.5 text-white"
                      onClick={() => removeImage(image.id)}
                      aria-label={`Remove ${image.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full cursor-pointer rounded-lg border-primary text-primary hover:bg-accent hover:text-primary"
              disabled={atImageLimit}
              onClick={openImagePicker}
            >
              <CloudUpload className="size-4" />
              Upload Image (max. {MAX_INITIATIVE_IMAGES})
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Checklist Compliance Notes</Label>
            <Textarea
              value={form.checklist_compliance_notes}
              onChange={(event) =>
                patch({ checklist_compliance_notes: event.target.value })
              }
              placeholder="Enter Description"
              className="min-h-[7.75rem] bg-white"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer rounded-lg border-[#f0a8a0] text-[#e11d48] hover:bg-red-50 hover:text-[#e11d48]"
            onClick={() => dismiss(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="cursor-pointer rounded-lg"
            onClick={handleSave}
          >
            {initialInitiative ? "Update Initiative" : "Save Initiative"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DateField({
  label,
  required,
  value,
  onChange,
  pickerRef,
  minIso,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  pickerRef: RefObject<HTMLInputElement | null>;
  /** ISO yyyy-mm-dd lower bound for the native date picker (e.g. week end ≥ start). */
  minIso?: string;
}) {
  const openPicker = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      try {
        picker.showPicker();
        return;
      } catch {
        // Fall through to focus/click for browsers that block showPicker.
      }
    }
    picker.focus();
    picker.click();
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="relative">
        <Input
          value={value}
          readOnly
          placeholder="mm/dd/yyyy"
          className="cursor-pointer bg-white pr-10"
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          aria-label={`${label}, open calendar`}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={openPicker}
          aria-label={`Pick ${label}`}
        >
          <CalendarDays className="size-4" />
        </button>
        <input
          ref={pickerRef}
          type="date"
          className="sr-only"
          value={displayToIso(value)}
          min={minIso}
          onChange={(event) => onChange(isoToDisplay(event.target.value))}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
