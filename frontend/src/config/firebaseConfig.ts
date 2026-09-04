import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_REACT_APP_FIREBASE_API_KEY,
  // REVERT WHEN: production UI proxies /__/auth (same-origin). Then always use
  // VITE_REACT_APP_FIREBASE_AUTH_DOMAIN (the UI host), including in prod builds.
  // Temporary (local only): DEV uses window.location.host with Vite proxy.
  // Do not use localhost authDomain in production. Keep apiKey/projectId/appId from .env.
  authDomain: import.meta.env.DEV
    ? window.location.host
    : import.meta.env.VITE_REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_REACT_APP_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_REACT_APP_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  // KEEP: popupRedirectResolver is required for signInWithRedirect.
  // Without it, getRedirectResult throws auth/argument-error.
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
