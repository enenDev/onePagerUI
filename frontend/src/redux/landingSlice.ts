import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { getMetadata, unionMarketScopedOptions } from "@/services/metadataApi";
import {
  deleteOnePager as deleteOnePagerRequest,
  submitOnePagerSearch,
} from "@/services/onePagerApi";
import {
  createEmptyFilters,
  type FilterKey,
  type FilterMetadata,
  type FilterOption,
  type FilterPayload,
  type OnePagerListItem,
  type ScopeTab,
  type StatusTab,
} from "@/types/onePager";

const DEPENDENT_FILTER_KEYS = [
  "retailer",
  "channel",
  "category",
  "campaign",
] as const satisfies ReadonlyArray<Exclude<FilterKey, "market">>;

interface LandingState {
  metadata: FilterMetadata | null;
  filters: FilterPayload;
  items: OnePagerListItem[];
  statusTab: StatusTab;
  scopeTab: ScopeTab;
  metadataLoading: boolean;
  listLoading: boolean;
  error: string | null;
}

const initialState: LandingState = {
  metadata: null,
  filters: createEmptyFilters(),
  items: [],
  statusTab: "active",
  scopeTab: "my",
  metadataLoading: false,
  listLoading: false,
  error: null,
};

export const fetchMetadata = createAsyncThunk(
  "landing/fetchMetadata",
  async () => getMetadata(),
);

export const fetchOnePagers = createAsyncThunk(
  "landing/fetchOnePagers",
  async (filters: FilterPayload) => submitOnePagerSearch(filters),
);

/**
 * Mock delete → remove from landing.items on success.
 * TODO: Swap deleteOnePagerRequest for real DELETE; keep pager_id arg and
 * fulfilled removal from landing.items (or refetch list if product prefers).
 */
export const deleteOnePager = createAsyncThunk(
  "landing/deleteOnePager",
  async (pagerId: string) => {
    const result = await deleteOnePagerRequest(pagerId);
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.pager_id;
  },
);

/** When markets change: clear dependents if empty; else drop values not in the union. */
function syncDependentFilters(state: LandingState) {
  const markets = state.filters.market;
  if (markets.length === 0) {
    state.filters.retailer = [];
    state.filters.channel = [];
    state.filters.category = [];
    state.filters.campaign = [];
    return;
  }

  if (!state.metadata) return;

  for (const key of DEPENDENT_FILTER_KEYS) {
    const allowed = new Set(
      unionMarketScopedOptions(state.metadata, markets, key).map(
        (option) => option.value,
      ),
    );
    state.filters[key] = state.filters[key].filter((value) =>
      allowed.has(value),
    );
  }
}

const landingSlice = createSlice({
  name: "landing",
  initialState,
  reducers: {
    toggleFilterValue(
      state,
      action: PayloadAction<{ key: FilterKey; value: string }>,
    ) {
      const { key, value } = action.payload;
      const current = state.filters[key];
      state.filters[key] = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      if (key === "market") {
        syncDependentFilters(state);
      }
    },
    clearFilters(state) {
      // Fresh arrays so Clear all always resets UI selection state.
      state.filters = createEmptyFilters();
    },
    setStatusTab(state, action: PayloadAction<StatusTab>) {
      state.statusTab = action.payload;
    },
    setScopeTab(state, action: PayloadAction<ScopeTab>) {
      state.scopeTab = action.payload;
    },
    /**
     * After POST add-campaign succeeds: append to the shared catalog in-place.
     * Do not refetch getMetadata — the new option is already in the POST result.
     */
    appendCampaignOption(
      state,
      action: PayloadAction<{ market: string; campaign: FilterOption }>,
    ) {
      if (!state.metadata) return;
      const { market, campaign } = action.payload;
      const scoped = state.metadata.optionsByMarket[market];
      if (!scoped) {
        state.metadata.optionsByMarket[market] = {
          retailer: [],
          channel: [],
          category: [],
          campaign: [campaign],
        };
        return;
      }
      const exists = scoped.campaign.some(
        (item) => item.value.toLowerCase() === campaign.value.toLowerCase(),
      );
      if (exists) return;
      scoped.campaign.push(campaign);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetadata.pending, (state) => {
        state.metadataLoading = true;
        state.error = null;
      })
      .addCase(fetchMetadata.fulfilled, (state, action) => {
        state.metadataLoading = false;
        state.metadata = action.payload;
        // Re-prune in case filters were set before metadata loaded.
        syncDependentFilters(state);
      })
      .addCase(fetchMetadata.rejected, (state, action) => {
        state.metadataLoading = false;
        state.error = action.error.message ?? "Failed to load metadata";
      })
      .addCase(fetchOnePagers.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchOnePagers.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchOnePagers.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.error.message ?? "Failed to load one-pagers";
      })
      .addCase(deleteOnePager.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.pager_id !== action.payload,
        );
        state.error = null;
      })
      .addCase(deleteOnePager.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to delete one-pager";
      });
  },
});

export const {
  toggleFilterValue,
  clearFilters,
  setStatusTab,
  setScopeTab,
  appendCampaignOption,
} = landingSlice.actions;

export default landingSlice.reducer;
