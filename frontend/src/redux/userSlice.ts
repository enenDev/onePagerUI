import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser } from "@/services/userApi";

/**
 * TODO: currentUser is populated from the signed-in Firebase user via
 * fetchCurrentUser → getCurrentUser (name/email/id/initials real; role from
 * ID-token claims or defaulted). initialState below is only a neutral
 * placeholder shown for the brief moment before that fetch resolves — do NOT
 * put real user data here. Replace getCurrentUser with GET /api/me later and
 * keep CurrentUser + UserType + this thunk shape stable.
 * Temporary labels: user_type_1 CSP, user_type_2 retailer, user_type_3 read-only.
 */
export type UserType = "user_type_1" | "user_type_2" | "user_type_3";

export type CurrentUser = {
  id: string;
  /** Display name in the header profile menu. */
  name: string;
  email: string;
  initials: string;
  user_type: UserType;
};

interface UserState {
  currentUser: CurrentUser;
}

// Neutral placeholder until fetchCurrentUser populates the real Firebase user.
const initialState: UserState = {
  currentUser: {
    id: "",
    email: "",
    name: "User",
    initials: "U",
    user_type: "user_type_1",
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

/** Temporary display labels for the header profile badge. */
export function userTypeLabel(userType: UserType) {
  switch (userType) {
    case "user_type_1":
      return "CSP";
    case "user_type_2":
      return "Retailer";
    case "user_type_3":
      return "Read-only";
  }
}

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
