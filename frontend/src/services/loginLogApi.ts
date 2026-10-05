import ApiBase from "@/components/auth/apiBase";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { store } from "@/redux/store";
import { profileRoleLabel } from "@/redux/userSlice";
import { getCurrentUser } from "@/services/userApi";

/**
 * TODO: POST user-tracking/login-log after each SSO sign-in.
 * Keep the body { email, role }. Do not call this on refresh or navigation.
 * Use user-details role when it is already stored for this email; otherwise
 * the token role. A failure must not block entering the app or sign the user out.
 */
export function logUserLogin(): void {
  void (async () => {
    const signedIn = await getCurrentUser();
    const email = signedIn.email.trim();
    if (!email) return;

    const details = store.getState().user.userDetails;
    const storedForThisUser =
      details?.email.trim().toLowerCase() === email.toLowerCase()
        ? details.role.trim()
        : "";
    const role = storedForThisUser || profileRoleLabel(signedIn);

    await ApiBase.post(
      API_ENDPOINTS.loginLog,
      { email, role },
      { skipAuthRedirect: true },
    );
  })().catch(() => {
    // Login already succeeded. This log must not change that.
  });
}
