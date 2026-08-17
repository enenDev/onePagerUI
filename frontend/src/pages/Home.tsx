import { useEffect, useMemo, useState } from "react";

import { Loading } from "@/components/common/Loading";
import { CreateOnePagerModal } from "@/components/landing/CreateOnePagerModal";
import { FilterBar } from "@/components/landing/FilterBar";
import { OnePagerCard } from "@/components/landing/OnePagerCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearFilters,
  fetchMetadata,
  fetchOnePagers,
  setScopeTab,
} from "@/redux/landingSlice";
import { CURRENT_USER_ID, createEmptyFilters } from "@/types/onePager";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  active: "ACTIVE",
  drafts: "DRAFT",
  archive: "ARCHIVE",
} as const;

export const Home = () => {
  const dispatch = useAppDispatch();
  const { items, statusTab, scopeTab, listLoading, error } = useAppSelector(
    (state) => state.landing,
  );
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    // List always reloads unfiltered; reset dropdown UI to match.
    // Redux filters persist across create/edit, so coming back would
    // otherwise show old selections on an empty-filter result set.
    dispatch(clearFilters());
    void dispatch(fetchMetadata());
    void dispatch(fetchOnePagers(createEmptyFilters()));
  }, [dispatch]);

  const visibleItems = useMemo(() => {
    const byStatus = items.filter(
      (item) => item.status === STATUS_MAP[statusTab],
    );

    if (scopeTab === "my") {
      return byStatus.filter((item) => item.created_by === CURRENT_USER_ID);
    }

    return byStatus;
  }, [items, scopeTab, statusTab]);

  const allCount = useMemo(
    () => items.filter((item) => item.status === STATUS_MAP[statusTab]).length,
    [items, statusTab],
  );

  const myCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === STATUS_MAP[statusTab] &&
          item.created_by === CURRENT_USER_ID,
      ).length,
    [items, statusTab],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <FilterBar onCreateNew={() => setCreateOpen(true)} />

      {listLoading ? (
        <Loading label="Loading one-pagers…" />
      ) : (
        <>
          <div className="border-b border-border">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => dispatch(setScopeTab("all"))}
                className={cn(
                  "relative cursor-pointer pb-3 text-sm font-medium transition-colors",
                  scopeTab === "all"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                All One-Pagers
                <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-soft text-xs text-primary">
                  {allCount}
                </span>
                {scopeTab === "all" && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                )}
              </button>

              <button
                type="button"
                onClick={() => dispatch(setScopeTab("my"))}
                className={cn(
                  "relative cursor-pointer pb-3 text-sm font-medium transition-colors",
                  scopeTab === "my"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                My One-Pagers
                <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-soft text-xs text-primary">
                  {myCount}
                </span>
                {scopeTab === "my" && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {visibleItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No one-pagers found for this view.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {visibleItems.map((item, index) => (
                <OnePagerCard
                  key={`${item.title}-${item.created_by}-${item.status}-${index}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateOnePagerModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};
