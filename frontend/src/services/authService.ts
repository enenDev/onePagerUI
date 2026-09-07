import {
  browserPopupRedirectResolver,
  signInWithPopup,
  signOut,
  SAMLAuthProvider,
} from "firebase/auth";

import { auth } from "@/config/firebaseConfig";

export const FIREBASE_TOKEN_KEY = "firebaseToken";

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
  await signOut(auth);
  localStorage.removeItem(FIREBASE_TOKEN_KEY);
}

export function getFirebaseUser() {
  return auth.currentUser;
}
