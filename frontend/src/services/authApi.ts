const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export type LoginWithSsoResult = { ok: true };

/**
 * TODO: Replace with real SSO (MSAL loginRedirect / loginPopup).
 * Temporary: delay then success — no token, no sessionStorage / localStorage.
 * Keep loginWithSso() → Promise<LoginWithSsoResult> so Login.tsx can stay:
 *   await loginWithSso(); navigate("/home").
 * Do not persist a token until MSAL lands; this mock does not gate refresh.
 */
export async function loginWithSso(): Promise<LoginWithSsoResult> {
  await delay();
  return { ok: true };
}

/**
 * TODO: Replace with real MSAL logout (msalInstance.logoutRedirect).
 * Temporary: no-op — this mock never stores a token.
 * Keep logout() → Promise<void>; AppHeader navigates to /login after this.
 */
export async function logout(): Promise<void> {
  // No token to clear in this mock.
}
