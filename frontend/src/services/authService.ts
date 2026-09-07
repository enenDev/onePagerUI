import { FirebaseError } from "firebase/app";
import {
  browserPopupRedirectResolver,
  signInWithPopup,
  signOut,
  SAMLAuthProvider,
} from "firebase/auth";

import { auth } from "@/config/firebaseConfig";

export const FIREBASE_TOKEN_KEY = "firebaseToken";

// The user intentionally aborted the popup — not a real failure, show nothing.
const SILENT_AUTH_CODES = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/user-cancelled",
]);

// Friendly, actionable copy for the auth errors we expect from SSO.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/popup-blocked":
    "Your browser blocked the sign-in pop-up. Please allow pop-ups for this site and try again.",
  "auth/unauthorized-domain":
    "This site isn't authorized for sign-in yet. Please contact your administrator.",
  "auth/operation-not-allowed":
    "SSO sign-in isn't enabled for this app. Please contact your administrator.",
  "auth/network-request-failed":
    "Network error during sign-in. Please check your connection and try again.",
  "auth/timeout": "Sign-in timed out. Please try again.",
  "auth/web-storage-unsupported":
    "Your browser is blocking the storage needed for sign-in. Enable cookies / site data (or try another browser) and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with a different sign-in method. Please contact your administrator.",
  "auth/user-disabled":
    "Your account has been disabled. Please contact your administrator.",
  "auth/internal-error": "We couldn't sign you in. Please try again.",
};

/**
 * Maps an auth/login error to a user-friendly message.
 * Returns null when the user simply closed/cancelled the popup (show nothing).
 */
export function getAuthErrorMessage(error: unknown): string | null {
  if (error instanceof FirebaseError) {
    if (SILENT_AUTH_CODES.has(error.code)) return null;
    const mapped = AUTH_ERROR_MESSAGES[error.code];
    if (mapped) return mapped;
    // Unknown Firebase code: log the real one for debugging, show generic copy.
    console.error("Unhandled auth error:", error.code, error.message);
    return "We couldn't sign you in. Please try again.";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Login failed. Please try again.";
}

// TODO: Default is the dev SAML provider id. Set
// VITE_REACT_APP_FIREBASE_SAML_PROVIDER_ID for prod; keep SAMLAuthProvider.
const samlProviderId =
  import.meta.env.VITE_REACT_APP_FIREBASE_SAML_PROVIDER_ID?.trim() ||
  "saml.onepage-unileversso-dev";

const samlProvider = new SAMLAuthProvider(samlProviderId);

/**
 * Starts Azure AD SAML via Firebase using a popup.
 *
 * Why popup and not signInWithRedirect: this app is served from a different
 * domain (Cloud Run *.run.app) than the Firebase authDomain (*.firebaseapp.com).
 * signInWithRedirect hands the session back across those domains via third-party
 * cookies, which Chrome/Edge/Safari now block — so the redirect came back with
 * no user. signInWithPopup runs the handshake in a first-party firebaseapp.com
 * window and returns the credential via postMessage, so it works cross-domain.
 *
 * On success, onAuthStateChanged (AuthProvider) also fires with the user and
 * stores the token; we store it here too so it is available immediately after
 * this promise resolves. Popup errors (blocked / closed) throw and are shown by
 * the Login page.
 */
export async function loginUser(): Promise<void> {
  const result = await signInWithPopup(
    auth,
    samlProvider,
    browserPopupRedirectResolver,
  );
  const token = await result.user.getIdToken();
  localStorage.setItem(FIREBASE_TOKEN_KEY, token);
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } finally {
    // Clear the local token even if signOut fails, so the user is signed out
    // locally regardless.
    localStorage.removeItem(FIREBASE_TOKEN_KEY);
  }
}

export function getFirebaseUser() {
  return auth.currentUser;
}
