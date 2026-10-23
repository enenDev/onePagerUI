import { useRef, type RefObject } from "react";
import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { displayToIso, isoToDisplay } from "@/lib/displayDate";

type DateFieldProps = {
  label: string;
  required?: boolean;
  /** Visible value in mm/dd/yyyy. */
  value: string;
  onChange: (value: string) => void;
  pickerRef?: RefObject<HTMLInputElement | null>;
  /** ISO yyyy-mm-dd lower bound for the native date picker. */
  minIso?: string;
};

export function DateField({
  label,
  required,
  value,
  onChange,
  pickerRef,
  minIso,
}: DateFieldProps) {
  const localRef = useRef<HTMLInputElement>(null);
  const ref = pickerRef ?? localRef;

  const openPicker = () => {
    const picker = ref.current;
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
          className="absolute top-1/2 right-2 z-20 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={openPicker}
          aria-label={`Pick ${label}`}
        >
          <CalendarDays className="size-4" />
        </button>
        {/*
          Native date pickers anchor to this input's box. `sr-only` left a 1px
          hit-target on the right, so the popup opened at the far right.
          Match the visible field so the calendar opens under the input.
        */}
        <input
          ref={ref}
          type="date"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          value={displayToIso(value)}
          min={minIso}
          onChange={(event) => onChange(isoToDisplay(event.target.value))}
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </div>
  );
}
