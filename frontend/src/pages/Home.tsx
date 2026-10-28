import { Download, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Loading } from "@/components/common/Loading";
import { CreateOnePagerModal } from "@/components/landing/CreateOnePagerModal";
import { FilterBar } from "@/components/landing/FilterBar";
import { OnePagerCard } from "@/components/landing/OnePagerCard";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  clearFilters,
  fetchMetadata,
  fetchOnePagers,
  setFilters,
  setScopeTab,
  setStatusTab,
} from "@/redux/landingSlice";

import { loadPersistedFilters } from "@/lib/homeFilterStorage";
import {
  canCreateAnyOnePager,
  canSeeDraftsTab,
  canSeeMyOnePagersTab,
} from "@/redux/userSlice";
import { createEmptyFilters, type StatusTab } from "@/types/onePager";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { exportMultipleOnePagersAsZip } from "@/services/multiExportApi";

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

const MAX_MULTI_EXPORT_COUNT = 10;

export const Home = () => {
  const dispatch = useAppDispatch();
  const { items, statusTab, scopeTab, listLoading, error } = useAppSelector(
    (state) => state.landing,
  );
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPagerIds, setSelectedPagerIds] = useState<string[]>([]);
  const [exportingSelection, setExportingSelection] = useState(false);

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
    // Restore the last *applied* dropdown filters from sessionStorage so they
    // survive reloads / navigating back to Home. Fetch the list with the same
    // filters so the results match the restored dropdown selections (avoids the
    // old "dropdowns say X but list is unfiltered" mismatch). When nothing is
    // stored, fall back to the previous clear-and-load-all behavior.
    const persisted = loadPersistedFilters();
    dispatch(persisted ? setFilters(persisted) : clearFilters());
    void dispatch(fetchMetadata());
    void dispatch(fetchOnePagers(persisted ?? createEmptyFilters()));
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

  const selectedCount = selectedPagerIds.length;
  const exportCountLabel =
    selectedCount > 0
      ? `${selectedCount}/${MAX_MULTI_EXPORT_COUNT}`
      : `${MAX_MULTI_EXPORT_COUNT}`;
  const showMultiExportControls = statusTab !== "drafts";
  const bulkExportDisabled =
    !showMultiExportControls ||
    selectedCount === 0 ||
    selectedCount > MAX_MULTI_EXPORT_COUNT ||
    exportingSelection;

  const exportTooltip = !showMultiExportControls
    ? undefined
    : selectedCount === 0
      ? "Select one or more One-Pagers to export them as a ZIP file"
      : selectedCount > MAX_MULTI_EXPORT_COUNT
        ? `Please select up to ${MAX_MULTI_EXPORT_COUNT} One-Pagers for ZIP export.`
        : "Export selected One-Pagers as a ZIP file.";

  // handler for clearing the one pager selections on tab change
  const handleStatusTabChange = (tab: StatusTab) => {
    setSelectedPagerIds([]);
    dispatch(setStatusTab(tab));
  };

  const toggleSelectedPager = (pagerId: string) => {
    if (!showMultiExportControls) return;

    setSelectedPagerIds((current) => {
      if (current.includes(pagerId)) {
        return current.filter((item) => item !== pagerId);
      }
      if (current.length >= MAX_MULTI_EXPORT_COUNT) {
        return current;
      }
      return [...current, pagerId];
    });
  };

  const handleBulkExport = async () => {
    if (bulkExportDisabled) return;
    setExportingSelection(true);
    try {
      await exportMultipleOnePagersAsZip(selectedPagerIds);
      setSelectedPagerIds([]);
    } catch (error) {
      console.error("Bulk export failed.", error);
    } finally {
      setExportingSelection(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-20 sm:pb-0">
      <div className="flex justify-center">
        <div className="flex w-full items-center rounded-full bg-brand-soft p-1 sm:w-auto">
          {visibleStatusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleStatusTabChange(tab.id)}
              className={cn(
                "min-w-0 flex-1 cursor-pointer rounded-full px-2.5 py-1.5 text-center text-sm font-medium transition-colors sm:flex-none sm:px-4",
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

      <div className="sm:flex sm:flex-col sm:gap-6 max-sm:grid max-sm:grid-cols-[minmax(0,1fr)_auto] max-sm:items-end max-sm:gap-x-3">
        <div className="max-sm:col-start-2 max-sm:row-start-1">
          <FilterBar />
        </div>

        {listLoading ? null : (
          <div className="flex flex-col gap-3 border-b border-border max-sm:col-start-1 max-sm:row-start-1 max-sm:min-w-0 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="flex gap-6">
              {showMyTab && (
                <button
                  type="button"
                  onClick={() => dispatch(setScopeTab("my"))}
                  className={cn(
                    "relative cursor-pointer pb-3 text-sm font-medium whitespace-nowrap transition-colors",
                    effectiveScope === "my"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  My
                  <span className="hidden sm:inline"> One-Pagers</span>
                  <span className="sr-only sm:hidden"> One-Pagers</span>
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
                    "relative cursor-pointer pb-3 text-sm font-medium whitespace-nowrap transition-colors",
                    effectiveScope === "all"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                  <span className="hidden sm:inline"> One-Pagers</span>
                  <span className="sr-only sm:hidden"> One-Pagers</span>
                  <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-soft text-xs text-primary">
                    {allCount}
                  </span>
                  {effectiveScope === "all" && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                  )}
                </button>
              )}
            </div>

            <div className="fixed right-4 bottom-8 z-30 flex items-center gap-2 sm:static sm:z-auto sm:mb-2">
              {showMultiExportControls && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      <Button
                        type="button"
                        onClick={() => void handleBulkExport()}
                        disabled={bulkExportDisabled}
                        className="relative h-9 w-9 shrink-0 cursor-pointer rounded-lg bg-primary px-0 text-primary-foreground shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-4 sm:shadow-none"
                      >
                        <Download className="size-4 sm:hidden" aria-hidden />
                        <span className="max-sm:sr-only">
                          {exportingSelection
                            ? "Exporting..."
                            : `Export (${exportCountLabel})`}
                        </span>
                        <span
                          aria-hidden
                          className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] leading-none font-semibold text-primary ring-1 ring-primary sm:hidden"
                        >
                          {exportCountLabel}
                        </span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{exportTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {showCreate && (
                <Button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg bg-primary px-0 text-primary-foreground shadow-md sm:w-auto sm:px-4 sm:shadow-none"
                >
                  <Plus className="size-4" />
                  <span className="max-sm:sr-only">Create New</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {listLoading ? (
        <Loading label="Loading one-pagers…" />
      ) : (
        <>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[80px] w-full gap-[24px]">
              {/* Stacked documents illustration */}
              <svg
                width="188"
                height="140"
                viewBox="0 0 188 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36 0.75H156C161.109 0.75 165.25 4.89137 165.25 10V130C165.25 135.109 161.109 139.25 156 139.25H36C30.8914 139.25 26.75 135.109 26.75 130V10C26.75 4.89137 30.8914 0.75 36 0.75Z"
                  fill="#CCDAFA"
                  stroke="#7EA2F1"
                  strokeWidth="1.5"
                />
                <path
                  d="M48 54.75H183C184.127 54.75 185.208 55.1981 186.005 55.9951C186.802 56.7921 187.25 57.8728 187.25 59V84C187.25 85.1272 186.802 86.2079 186.005 87.0049C185.208 87.8019 184.127 88.25 183 88.25H48C46.8728 88.25 45.7921 87.8019 44.9951 87.0049C44.1981 86.2079 43.75 85.1272 43.75 84V59C43.75 57.8728 44.1981 56.7921 44.9951 55.9951C45.7921 55.1981 46.8728 54.75 48 54.75Z"
                  fill="#F1F5FE"
                  stroke="#7EA2F1"
                  strokeWidth="1.5"
                />
                <rect
                  x="50.5"
                  y="62"
                  width="57"
                  height="6"
                  rx="3"
                  fill="#CCDAFA"
                />
                <rect
                  x="51"
                  y="75"
                  width="88"
                  height="6"
                  rx="3"
                  fill="#CCDAFA"
                />
                <path
                  d="M5 97.75H140C141.127 97.75 142.208 98.1981 143.005 98.9951C143.802 99.7921 144.25 100.873 144.25 102V127C144.25 128.127 143.802 129.208 143.005 130.005C142.208 130.802 141.127 131.25 140 131.25H5C3.87283 131.25 2.79215 130.802 1.99512 130.005C1.19809 129.208 0.75 128.127 0.75 127V102C0.75 100.873 1.19809 99.7921 1.99512 98.9951C2.79215 98.1981 3.87283 97.75 5 97.75Z"
                  fill="#F1F5FE"
                  stroke="#7EA2F1"
                  strokeWidth="1.5"
                />
                <rect
                  x="10.5"
                  y="105"
                  width="57"
                  height="6"
                  rx="3"
                  fill="#CCDAFA"
                />
                <rect
                  x="10.5"
                  y="118"
                  width="88"
                  height="6"
                  rx="3"
                  fill="#CCDAFA"
                />
                <path
                  d="M5 11.75H140C142.347 11.75 144.25 13.6528 144.25 16V41C144.25 43.3472 142.347 45.25 140 45.25H5C2.65279 45.25 0.75 43.3472 0.75 41V16C0.75 13.6528 2.65279 11.75 5 11.75Z"
                  fill="#F1F5FE"
                  stroke="#7EA2F1"
                  strokeWidth="1.5"
                />
                <rect
                  x="7"
                  y="20"
                  width="57"
                  height="6"
                  rx="3"
                  fill="#CCDAFA"
                />
                <rect
                  x="7"
                  y="32"
                  width="88"
                  height="6"
                  rx="3"
                  fill="#CCDAFA"
                />
              </svg>

              <p className="font-bold text-[#262626] text-[15px] text-center tracking-[0.1px]">
                No Results for the selected filter combinations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item, index) => (
                <OnePagerCard
                  key={`${item.title}-${item.created_by}-${item.status}-${index}`}
                  item={item}
                  selected={
                    showMultiExportControls &&
                    selectedPagerIds.includes(item.pager_id)
                  }
                  onSelectToggle={
                    showMultiExportControls ? toggleSelectedPager : undefined
                  }
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
