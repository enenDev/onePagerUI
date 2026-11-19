import { useEffect, useState } from "react";

/** Height the keyboard must take before we treat the viewport as covered. */
const KEYBOARD_MIN_HEIGHT_PX = 120;

export type KeyboardSafeFrame = {
  /** Px from the top of the layout viewport to the middle of the visible area. */
  centerY: number;
  /** Visible height above the on-screen keyboard, in px. */
  height: number;
};

/**
 * On touch devices, returns the part of the screen left visible above the
 * on-screen keyboard; null when no keyboard is open (or on desktop).
 * Phone keyboards cover the layout viewport instead of shrinking it, so
 * anything centred with `position: fixed` ends up half behind the keyboard.
 */
export function useKeyboardSafeFrame() {
  const [frame, setFrame] = useState<KeyboardSafeFrame | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const coarsePointer = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      const coveredPx =
        window.innerHeight - viewport.height * viewport.scale;
      if (!coarsePointer.matches || coveredPx < KEYBOARD_MIN_HEIGHT_PX) {
        setFrame(null);
        return;
      }
      setFrame({
        centerY: viewport.offsetTop + viewport.height / 2,
        height: viewport.height,
      });
    };

    sync();
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);

  return frame;
}
