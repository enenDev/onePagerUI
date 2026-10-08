import { auth } from "@/config/firebaseConfig";
import { getHighestPrivilegeRole } from "@/lib/utils";
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
  // if (
  //   claim === "user_type_1" ||
  //   claim === "user_type_2" ||
  //   claim === "user_type_3"
  // ) {
  //   return claim;
  // }
  switch (String(claim ?? "").toLocaleLowerCase()) {
    case "csp":
      return "user_type_1";
    case "cbd":
      return "user_type_2";
    case "general":
      return "user_type_3";
    default:
      return "user_type_3"; // safe default
  }
  // TODO: Map real AD/backend role strings → UserType here once the role source
  // is finalized (e.g. "CSP" → user_type_1, "retailer" → user_type_2,
  // "read-only" → user_type_3). Until then we fall back to the default below.
  // return "user_type_1";
}

type FirebaseCustomClaims = {
  firebase?: {
    sign_in_attributes?: {
      role?: string | string[];
      group?: string[];
    };
  };
};

const PRIVILEGE_ROLES = new Set(["CSP", "CBD", "GENERAL"]);

function roleList(role: unknown): string[] {
  if (Array.isArray(role)) {
    return role.flatMap((item) => roleList(item));
  }
  if (typeof role === "string") {
    const trimmed = role.trim();
    return trimmed ? [trimmed.toUpperCase()] : [];
  }
  return [];
}

/**
 * Analyst is stripped before the CSP / CBD / General hierarchy runs.
 * Analyst alone stays dashboard-only. Any other role with no CSP / CBD /
 * General match falls back to General, including when analyst is also present.
 */
function resolveRoles(role: unknown): {
  userType: UserType;
  isAnalyst: boolean;
  isAnalystOnly: boolean;
} {
  const roles = roleList(role);
  const isAnalyst = roles.includes("ANALYST");
  const otherRoles = roles.filter((value) => value !== "ANALYST");
  const privilegeRoles = otherRoles.filter((value) => PRIVILEGE_ROLES.has(value));

  if (privilegeRoles.length === 0) {
    return {
      userType: "user_type_3",
      isAnalyst,
      isAnalystOnly: isAnalyst && otherRoles.length === 0,
    };
  }

  return {
    userType: toUserType(getHighestPrivilegeRole(privilegeRoles)),
    isAnalyst,
    isAnalystOnly: false,
  };
}

/**
 * Builds the app's CurrentUser from the signed-in Firebase user.
 *
 * TODO: Role/user_type is read from Firebase ID-token custom claims
 * (`user_type` / `role`) if present, otherwise defaulted to user_type_3.
 * Analyst stays a separate flag on that same role array, not a user_type.
 * Replace with GET /api/me via ApiBase once the backend owns the profile +
 * role. Keep the returned shape
 * { id, name, email, initials, user_type, isAnalyst, isAnalystOnly } and
 * the fetchCurrentUser thunk stable when swapping.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const firebaseUser = auth.currentUser;

  const email = firebaseUser?.email?.trim() || "unknown@unilever.com";
  const name = firebaseUser?.displayName?.trim() || nameFromEmail(email);
  /**
   * Owner key: MUST equal what the backend stores/returns as `created_by`
   * (and what create sends via payload.created_by = currentUser.email). The
   * whole app uses email as the identity for created_by / updated_by / owner
   * checks, so id = email keeps "My One-Pagers" and owner gating working.
   * */
  const id = email;
  const initials = computeInitials(name, email);

  let userType: UserType = "user_type_3";
  let isAnalyst = false;
  let isAnalystOnly = false;
  if (firebaseUser) {
    try {
      const tokenResult = await firebaseUser.getIdTokenResult();
      const claims = tokenResult.claims as FirebaseCustomClaims;
      const resolved = resolveRoles(
        claims.firebase?.sign_in_attributes?.role,
      );
      userType = resolved.userType;
      isAnalyst = resolved.isAnalyst;
      isAnalystOnly = resolved.isAnalystOnly;
      // enable in case we need conditioning based on groups
      // const groups = claims.firebase?.sign_in_attributes?.group;
    } catch {
      // Keep the default user_type if claims can't be read.
    }
  }

  return {
    id,
    name,
    email,
    initials,
    user_type: userType,
    isAnalyst,
    isAnalystOnly,
  };
}
