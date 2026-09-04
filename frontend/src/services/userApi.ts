import type { CurrentUser } from "@/redux/userSlice";

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO: Replace mock with GET /api/me via ApiBase after Firebase SSO.
 * Temporary: delay + userSlice initialState (not the Firebase user).
 * Next: ApiBase.get("/api/me") with the Bearer token already on ApiBase.
 * Keep { id, name, email, initials, user_type }; map server role → UserType.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  await delay();
  const { userSlice } = await import("@/redux/userSlice");
  return userSlice.getInitialState().currentUser;
}
