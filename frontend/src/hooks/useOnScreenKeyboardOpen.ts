import { useEffect, useState } from "react";

const NO_KEYBOARD_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function opensOnScreenKeyboard(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.isContentEditable) return true;
  if (element instanceof HTMLTextAreaElement) return !element.readOnly;
  if (element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLInputElement) {
    return !element.readOnly && !NO_KEYBOARD_INPUT_TYPES.has(element.type);
  }
  return false;
}

/**
 * True on touch devices while a field that raises the on-screen keyboard (or
 * the native date wheel) has focus. iOS Safari does not shrink the layout
 * viewport for the keyboard, so `fixed`/`sticky` bottom bars end up floating
 * mid-screen until the keyboard closes.
 */
export function useOnScreenKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    let pending: number | undefined;

    const sync = () => {
      setOpen(
        coarsePointer.matches && opensOnScreenKeyboard(document.activeElement),
      );
    };
    // focusout fires before focus lands on the next field.
    const syncAfterFocusMoves = () => {
      window.clearTimeout(pending);
      pending = window.setTimeout(sync, 0);
    };

    document.addEventListener("focusin", sync);
    document.addEventListener("focusout", syncAfterFocusMoves);
    return () => {
      window.clearTimeout(pending);
      document.removeEventListener("focusin", sync);
      document.removeEventListener("focusout", syncAfterFocusMoves);
    };
  }, []);

  return open;
}
