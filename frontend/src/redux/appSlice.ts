import { createSlice } from "@reduxjs/toolkit";

interface AppState {
  appName: string;
}

const initialState: AppState = {
  appName: import.meta.env.VITE_APP_NAME?.trim() || "One Category Pager",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {},
});

export default appSlice.reducer;
