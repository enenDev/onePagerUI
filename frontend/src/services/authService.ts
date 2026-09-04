import {
  getRedirectResult,
  signInWithRedirect,
  signOut,
  SAMLAuthProvider,
} from "firebase/auth";

import { auth } from "@/config/firebaseConfig";

export const FIREBASE_TOKEN_KEY = "firebaseToken";
export const SSO_PENDING_KEY = "ssoRedirectPending";

// TODO: Default is the dev SAML provider id. Set
// VITE_REACT_APP_FIREBASE_SAML_PROVIDER_ID for prod; keep SAMLAuthProvider.
const samlProviderId =
  import.meta.env.VITE_REACT_APP_FIREBASE_SAML_PROVIDER_ID?.trim() ||
  "saml.onepage-unileversso-dev";

const samlProvider = new SAMLAuthProvider(samlProviderId);

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Login failed. Please try again.";
}

export function markSsoRedirectPending() {
  sessionStorage.setItem(SSO_PENDING_KEY, "1");
}

export function isSsoRedirectPending() {
  return sessionStorage.getItem(SSO_PENDING_KEY) === "1";
}

export function clearSsoRedirectPending() {
  sessionStorage.removeItem(SSO_PENDING_KEY);
}

/**
 * Starts Azure AD SAML via Firebase. The page leaves; do not read the
 * result here. `completeSsoRedirect` + AuthProvider handle the return.
 */
export async function loginUser(): Promise<void> {
  markSsoRedirectPending();
  await signInWithRedirect(auth, samlProvider);
}

// StrictMode mounts twice; Firebase gives the redirect result only once.
let redirectResultPromise: Promise<string | null> | null = null;

/**
 * TODO: App-load only (AuthProvider). Not a FastAPI call.
 * Keep string | null so Login can show redirect errors.
 */
export function completeSsoRedirect(): Promise<string | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = readRedirectResult();
  }
  return redirectResultPromise;
}

async function readRedirectResult(): Promise<string | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const token = await result.user.getIdToken();
      localStorage.setItem(FIREBASE_TOKEN_KEY, token);
    }
    return null;
  } catch (error) {
    console.error("SSO redirect failed:", error);
    return errorMessage(error);
  }
}

export async function logoutUser(): Promise<void> {
  clearSsoRedirectPending();
  await signOut(auth);
  localStorage.removeItem(FIREBASE_TOKEN_KEY);
}

export function getFirebaseUser() {
  return auth.currentUser;
}
