import { createSlice } from "@reduxjs/toolkit";

interface AppState {
  appName: string;
}

const initialState: AppState = {
  appName: "One Category Page",
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {},
});

export default appSlice.reducer;
