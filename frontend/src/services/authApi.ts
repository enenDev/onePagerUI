import { loginUser, logoutUser } from "@/services/authService";

export type LoginWithSsoResult = { ok: true };

/**
 * TODO: FE SSO is Firebase SAML (Azure AD), not POST /api/auth/sso.
 * Temporary: redirect only; token is stored in AuthProvider.
 * Keep loginWithSso() → Promise<{ ok: true }> for Login.tsx.
 * Add a backend handshake here only if FastAPI owns the SSO exchange.
 * Login-log is not called here. MainLayout posts it once per signed-in load
 * so a restored Firebase session is tracked without a fresh SSO click.
 */
export async function loginWithSso(): Promise<LoginWithSsoResult> {
  await loginUser();
  return { ok: true };
}

/**
 * TODO: Firebase signOut only. Call a FastAPI logout only if the backend
 * keeps its own session. Keep logout() → Promise<void> for AppHeader.
 */
export async function logout(): Promise<void> {
  await logoutUser();
}
