import { auth } from "@/config/firebaseConfig";
import { setCurrentUserId } from "@/services/currentUserRef";
import type { CurrentUser, UserType } from "@/redux/userSlice";

/** Two-letter avatar initials from a display name, falling back to the email. */
function computeInitials(name: string, email: string): string {
  const parts = name.split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const local = email.split("@")[0] ?? "";
  return (local.slice(0, 2) || "U").toUpperCase();
}

/** Prettify an email local part (e.g. "gowtham.gunasekaran") into a name. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  if (!local) return "User";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toUserType(claim: unknown): UserType {
  if (
    claim === "user_type_1" ||
    claim === "user_type_2" ||
    claim === "user_type_3"
  ) {
    return claim;
  }
  // TODO: Map real AD/backend role strings → UserType here once the role source
  // is finalized (e.g. "CSP" → user_type_1, "retailer" → user_type_2,
  // "read-only" → user_type_3). Until then we fall back to the default below.
  return "user_type_1";
}

/**
 * Builds the app's CurrentUser from the signed-in Firebase user.
 *
 * TODO: Role/user_type is read from Firebase ID-token custom claims
 * (`user_type` / `role`) if present, otherwise defaulted to user_type_1.
 * Replace with GET /api/me via ApiBase once the backend owns the profile +
 * role. Keep the returned shape { id, name, email, initials, user_type } and
 * the fetchCurrentUser thunk stable when swapping.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const firebaseUser = auth.currentUser;

  const email = firebaseUser?.email?.trim() || "unknown@unilever.com";
  const name = firebaseUser?.displayName?.trim() || nameFromEmail(email);
  const id = firebaseUser?.uid || email;
  const initials = computeInitials(name, email);

  let userType: UserType = "user_type_1";
  if (firebaseUser) {
    try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      userType = toUserType(
        tokenResult.claims.user_type ?? tokenResult.claims.role,
      );
    } catch {
      // Keep the default user_type if claims can't be read.
    }
  }

  // Keep the decoupled ref in sync so mock stores can read the id without
  // importing the Redux store (avoids a circular import).
  setCurrentUserId(id);

  return { id, name, email, initials, user_type: userType };
}
