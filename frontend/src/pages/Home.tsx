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
  setStatusTab,
} from "@/redux/landingSlice";
import {
  canCreateAnyOnePager,
  canSeeDraftsTab,
  canSeeMyOnePagersTab,
} from "@/redux/userSlice";
import { createEmptyFilters, type StatusTab } from "@/types/onePager";
import { cn } from "@/lib/utils";

const STATUS_MAP = {
  active: "PUBLISHED",
  drafts: "DRAFT",
  archive: "ARCHIVED",
} as const;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "drafts", label: "Drafts" },
  { id: "archive", label: "Archive" },
];

export const Home = () => {
  const dispatch = useAppDispatch();
  const { items, statusTab, scopeTab, listLoading, error } = useAppSelector(
    (state) => state.landing,
  );
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [createOpen, setCreateOpen] = useState(false);

  const showCreate = canCreateAnyOnePager(currentUser.user_type);
  const showMyTab = canSeeMyOnePagersTab(currentUser.user_type);
  const showDraftsTab = canSeeDraftsTab(currentUser.user_type);
  /** Drafts: My only. Active/Archive: All always (My when allowed). */
  const showAllTab = statusTab !== "drafts";

  const visibleStatusTabs = useMemo(
    () => STATUS_TABS.filter((tab) => tab.id !== "drafts" || showDraftsTab),
    [showDraftsTab],
  );

  // Drafts → only My. Read-only → only All (and never Drafts).
  useEffect(() => {
    if (!showDraftsTab && statusTab === "drafts") {
      dispatch(setStatusTab("active"));
      return;
    }

    if (!showMyTab && scopeTab === "my") {
      dispatch(setScopeTab("all"));
      return;
    }

    if (statusTab === "drafts" && scopeTab !== "my") {
      dispatch(setScopeTab("my"));
    }
  }, [dispatch, scopeTab, showDraftsTab, showMyTab, statusTab]);

  useEffect(() => {
    // List always reloads unfiltered; reset dropdown UI to match.
    // Redux filters persist across create/edit, so coming back would
    // otherwise show old selections on an empty-filter result set.
    dispatch(clearFilters());
    void dispatch(fetchMetadata());
    void dispatch(fetchOnePagers(createEmptyFilters()));
  }, [dispatch]);

  const effectiveScope =
    statusTab === "drafts" ? "my" : !showMyTab ? "all" : scopeTab;

  const visibleItems = useMemo(() => {
    const byStatus = items.filter(
      (item) => item.status === STATUS_MAP[statusTab],
    );

    if (effectiveScope === "my") {
      return byStatus.filter((item) => item.created_by === currentUser.id);
    }

    return byStatus;
  }, [currentUser.id, effectiveScope, items, statusTab]);

  const allCount = useMemo(
    () => items.filter((item) => item.status === STATUS_MAP[statusTab]).length,
    [items, statusTab],
  );

  const myCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === STATUS_MAP[statusTab] &&
          item.created_by === currentUser.id,
      ).length,
    [currentUser.id, items, statusTab],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex justify-center">
        <div className="flex items-center rounded-full bg-brand-soft p-1">
          {visibleStatusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => dispatch(setStatusTab(tab.id))}
              className={cn(
                "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                statusTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-primary hover:bg-white/50",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <FilterBar
        onCreateNew={() => setCreateOpen(true)}
        showCreateNew={showCreate}
      />

      {listLoading ? (
        <Loading label="Loading one-pagers…" />
      ) : (
        <>
          <div className="border-b border-border">
            <div className="flex gap-6">
              {showMyTab && (
                <button
                  type="button"
                  onClick={() => dispatch(setScopeTab("my"))}
                  className={cn(
                    "relative cursor-pointer pb-3 text-sm font-medium transition-colors",
                    effectiveScope === "my"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  My One-Pagers
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-soft text-xs text-primary">
                    {myCount}
                  </span>
                  {effectiveScope === "my" && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                  )}
                </button>
              )}

              {showAllTab && (
                <button
                  type="button"
                  onClick={() => dispatch(setScopeTab("all"))}
                  className={cn(
                    "relative cursor-pointer pb-3 text-sm font-medium transition-colors",
                    effectiveScope === "all"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All One-Pagers
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-soft text-xs text-primary">
                    {allCount}
                  </span>
                  {effectiveScope === "all" && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                  )}
                </button>
              )}
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

      {showCreate && (
        <CreateOnePagerModal open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  );
};
