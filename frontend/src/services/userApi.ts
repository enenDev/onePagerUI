import type { CurrentUser } from "@/redux/userSlice";

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * TODO: Replace with GET /api/me (or the auth session after login).
 * Temporary: delay then the mock user from userSlice initialState.
 * No login API yet — do not keep a second copy of id / email / initials here.
 * Keep { id, email, initials }: id is created_by / owner checks, email is
 * header + Track PATCH updated_by, initials are the header avatar.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  await delay();
  const { userSlice } = await import("@/redux/userSlice");
  return userSlice.getInitialState().currentUser;
}
