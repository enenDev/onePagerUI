import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser } from "@/services/userApi";
import { getUserDetails, type UserDetails } from "@/services/userDetailsApi";

/**
 * TODO: currentUser is populated from the signed-in Firebase user via
 * fetchCurrentUser → getCurrentUser (name/email/id/initials real; role from
 * ID-token claims or defaulted). initialState below is only a neutral
 * placeholder shown for the brief moment before that fetch resolves — do NOT
 * put real user data here. Replace getCurrentUser with GET /api/me later and
 * keep CurrentUser + UserType + isAnalyst + isAnalystOnly + this thunk shape stable.
 * Temporary labels: user_type_1 CSP, user_type_2 CBD, user_type_3 General.
 * Analyst is not a user_type. isAnalystOnly users have no one-pager access.
 */
export type UserType = "user_type_1" | "user_type_2" | "user_type_3";

export type CurrentUser = {
  id: string;
  /** Display name in the header profile menu. */
  name: string;
  email: string;
  initials: string;
  /**
   * CSP / CBD / General privilege. Unused for access when isAnalystOnly is
   * true — those users are not General and never reach one-pager screens.
   */
  user_type: UserType;
  /** Token role array includes analyst, including mixed CSP/CBD/General users. */
  isAnalyst: boolean;
  /** Analyst is the only role. No one-pager routes, no dashboard menu item. */
  isAnalystOnly: boolean;
};

interface UserState {
  currentUser: CurrentUser;
  /** Null until GET user-tracking/user-details succeeds for this signed-in session. */
  userDetails: UserDetails | null;
}

// Neutral placeholder until fetchCurrentUser populates the real Firebase user.
const initialState: UserState = {
  currentUser: {
    id: "",
    email: "",
    name: "User",
    initials: "U",
    user_type: "user_type_1",
    isAnalyst: false,
    isAnalystOnly: false,
  },
  userDetails: null,
};

export const fetchCurrentUser = createAsyncThunk("user/fetchCurrentUser", () =>
  getCurrentUser(),
);

/** Once per signed-in app load. Email is the only request field. */
export const fetchUserDetails = createAsyncThunk(
  "user/fetchUserDetails",
  async () => {
    const { email } = await getCurrentUser();
    return getUserDetails(email);
  },
);

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.currentUser = action.payload;
    });
    builder.addCase(fetchUserDetails.pending, (state) => {
      state.userDetails = null;
    });
    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.userDetails = action.payload;
    });
  },
});

/** Temporary display labels for the header profile badge. */
export function userTypeLabel(userType: UserType) {
  switch (userType) {
    case "user_type_1":
      return "CSP";
    case "user_type_2":
      return "CBD";
    case "user_type_3":
      return "General";
  }
}

/** Badge and login-log label. Analyst-only is not shown as General. */
export function profileRoleLabel(
  user: Pick<CurrentUser, "user_type" | "isAnalystOnly">,
) {
  if (user.isAnalystOnly) return "Analyst";
  return userTypeLabel(user.user_type);
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

/**
 * Read-only users (user_type_3) can only view + export one-pagers — never
 * archive / restore / edit / delete. Modify actions stay owner-gated on top of
 * this for the other roles.
 */
export function canModifyOnePagers(userType: UserType) {
  return userType !== "user_type_3";
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
