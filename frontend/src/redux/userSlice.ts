import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser } from "@/services/userApi";

export type CurrentUser = {
  id: string;
  email: string;
  initials: string;
};

interface UserState {
  currentUser: CurrentUser;
}

const initialState: UserState = {
  currentUser: {
    id: "user-001",
    email: "nitesh@example.com",
    initials: "NN",
  },
};

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  () => getCurrentUser(),
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

export default userSlice.reducer;
