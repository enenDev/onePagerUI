import { MoreVertical, Pencil, Share2, Target, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OnePagerListItem } from "@/types/onePager";

type OnePagerCardProps = {
  item: OnePagerListItem;
};

export function OnePagerCard({ item }: OnePagerCardProps) {
  const scoringLabel =
    item.scoring_mode === "WEIGHTED" ? "Weighted" : "Unweighted";

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card-surface shadow-sm">
      {/* White preview inset — grey card bg forms the border around it */}
      <div className="px-3 pt-3">
        <div className="relative h-36 rounded-lg bg-white">
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer rounded-full bg-brand-soft text-primary hover:bg-brand-soft-hover"
                  aria-label="Card actions"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40 p-0">
                <DropdownMenuItem className="cursor-pointer rounded-none px-3 py-2">
                  <Target className="size-4" />
                  Track
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem className="cursor-pointer rounded-none px-3 py-2">
                  <Share2 className="size-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem className="cursor-pointer rounded-none px-3 py-2">
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="m-0" />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer rounded-none px-3 py-2"
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 text-left">
        <h3 className="text-sm font-semibold text-foreground md:text-base">
          {item.title}
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {item.business_outcome_statement}
        </p>
        <Badge
          variant="secondary"
          className="rounded-full bg-brand-soft text-accent-foreground hover:bg-brand-soft"
        >
          {scoringLabel}
        </Badge>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Published:</span>{" "}
            {item.published_at}
          </p>
          <p>
            <span className="font-semibold text-foreground">Owner:</span>{" "}
            {item.created_by}
          </p>
        </div>
      </div>
    </article>
  );
}
