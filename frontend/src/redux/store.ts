import { configureStore } from "@reduxjs/toolkit";

import appReducer from "./appSlice";
import landingReducer from "./landingSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    landing: landingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
