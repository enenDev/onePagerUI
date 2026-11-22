import { useRef, useState, type KeyboardEvent } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type InitiativeActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

const itemClass =
  "flex w-full cursor-pointer items-center gap-1.5 px-3 py-2.5 text-left text-sm outline-none focus-visible:bg-accent hover:bg-accent";

/**
 * Edit / Delete menu for an initiative card.
 *
 * Popover (not DropdownMenu): its trigger opens on a plain click, like the
 * searchable selects. A non-modal DropdownMenu treats focus or a tap on its
 * own trigger as "outside" and closed itself on iOS before it was visible.
 * `modal` also ignores any focus outside the menu while it is open.
 */
export function InitiativeActionsMenu({
  onEdit,
  onDelete,
}: InitiativeActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Run the action only once the menu has fully unmounted (Radix fires
  // onCloseAutoFocus after removal), so the Edit dialog never overlaps it.
  const runAfterClose = (action: () => void) => {
    pendingActionRef.current = action;
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]',
      ),
    );
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = current < 0 ? 0 : (current + 1) % items.length;
        break;
      case "ArrowUp":
        next =
          current < 0
            ? items.length - 1
            : (current - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    items[next].focus();
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="-mt-2 -mr-2 flex size-9 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Initiative actions"
          aria-haspopup="menu"
        >
          <MoreVertical className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={8}
        role="menu"
        aria-label="Initiative actions"
        className="w-auto min-w-36 overflow-hidden p-0"
        onKeyDown={handleKeyDown}
        onCloseAutoFocus={(event) => {
          const action = pendingActionRef.current;
          if (!action) return;
          pendingActionRef.current = null;
          event.preventDefault();
          action();
        }}
      >
        <button
          type="button"
          role="menuitem"
          className={itemClass}
          onClick={() => runAfterClose(onEdit)}
        >
          <Pencil className="size-4" />
          Edit
        </button>
        <div role="separator" className="h-px bg-border" />
        <button
          type="button"
          role="menuitem"
          className={cn(
            itemClass,
            "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10",
          )}
          onClick={() => runAfterClose(onDelete)}
        >
          <Trash2 className="size-4" />
          Delete
        </button>
      </PopoverContent>
    </Popover>
  );
}
