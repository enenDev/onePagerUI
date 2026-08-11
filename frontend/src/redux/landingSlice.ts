import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { getMetadata } from "@/services/metadataApi";
import { submitOnePagerSearch } from "@/services/onePagerApi";
import {
  emptyFilters,
  type FilterKey,
  type FilterMetadata,
  type FilterPayload,
  type OnePagerListItem,
  type ScopeTab,
  type StatusTab,
} from "@/types/onePager";

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
  filters: { ...emptyFilters },
  items: [],
  statusTab: "active",
  scopeTab: "all",
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

const landingSlice = createSlice({
  name: "landing",
  initialState,
  reducers: {
    setFilter(
      state,
      action: PayloadAction<{ key: FilterKey; value: string }>,
    ) {
      state.filters[action.payload.key] = action.payload.value;
    },
    clearFilters(state) {
      state.filters = { ...emptyFilters };
    },
    setStatusTab(state, action: PayloadAction<StatusTab>) {
      state.statusTab = action.payload;
    },
    setScopeTab(state, action: PayloadAction<ScopeTab>) {
      state.scopeTab = action.payload;
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
      });
  },
});

export const { setFilter, clearFilters, setStatusTab, setScopeTab } =
  landingSlice.actions;

export default landingSlice.reducer;
