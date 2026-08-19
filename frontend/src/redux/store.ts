import { configureStore } from "@reduxjs/toolkit";

import appReducer from "./appSlice";
import landingReducer from "./landingSlice";
import userReducer from "./userSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    landing: landingReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
