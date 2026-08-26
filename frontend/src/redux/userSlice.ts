import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser } from "@/services/userApi";

/**
 * Temporary role labels until GET /api/me returns real role codes.
 * Change `user_type` in initialState below to locally test each role.
 * - user_type_1: full access (CSP)
 * - user_type_2: retailer create / import only
 * - user_type_3: read-only (no create, no My tab, no Drafts)
 */
export type UserType = "user_type_1" | "user_type_2" | "user_type_3";

export type CurrentUser = {
  id: string;
  email: string;
  initials: string;
  user_type: UserType;
};

interface UserState {
  currentUser: CurrentUser;
}

const initialState: UserState = {
  currentUser: {
    id: "user-001",
    email: "nitesh@example.com",
    initials: "NN",
    // TODO: Replace seed with GET /api/me role. Keep UserType union until
    // backend names are final; map server role → these three FE behaviors.
    user_type: "user_type_3",
  },
};

export const fetchCurrentUser = createAsyncThunk("user/fetchCurrentUser", () =>
  getCurrentUser(),
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.currentUser = action.payload;
    });
  },
});

export function isCurrentUserOwner(createdBy: string, userId: string) {
  return createdBy === userId;
}

export function canCreateAnyOnePager(userType: UserType) {
  return userType === "user_type_1" || userType === "user_type_2";
}

export function canCreateNationalOnePager(userType: UserType) {
  return userType === "user_type_1";
}

export function canCreateRetailerOnePager(userType: UserType) {
  return userType === "user_type_1" || userType === "user_type_2";
}

/** Home “My One-Pagers” scope tab (hidden for read-only). */
export function canSeeMyOnePagersTab(userType: UserType) {
  return userType !== "user_type_3";
}

/** Home Drafts status tab (hidden for read-only — they never own drafts). */
export function canSeeDraftsTab(userType: UserType) {
  return userType !== "user_type_3";
}

export default userSlice.reducer;
