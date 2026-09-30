import ApiBase from "@/components/auth/apiBase";
import { API_ENDPOINTS } from "@/config/apiEndpoints";
import { store } from "@/redux/store";
import { userTypeLabel } from "@/redux/userSlice";

export type PagerActivityAction = "view" | "export" | "draft" | "track";

type PagerActivityRequest = {
  pager_id: string;
  user_email: string;
  role: string;
  market: string;
  datetime: string;
  action: PagerActivityAction;
};

/**
 * TODO: POST user-tracking/action-log.
 * Keep the body fields pager_id, user_email, role, market, datetime, action.
 * action stays "view" | "export" | "draft" | "track".
 * Callers fire this after the user action succeeds and must not wait on it.
 * A failure here must not block Track, the PPT download, Save Draft, or a status update.
 *
 * TODO: market stays "dummy" and role stays the token label only until
 * GET user-tracking/user-details has been stored on the user reducer. After that,
 * send userDetails.market and userDetails.role. Keep those field names.
 */
const PAGER_ACTIVITY_PATH = API_ENDPOINTS.actionLog;
const DUMMY_USER_MARKET = "dummy";

/** Fire-and-forget. Swallows errors so a missing endpoint cannot break the action. */
export function logPagerActivity(payload: {
  pager_id: string;
  action: PagerActivityAction;
}): void {
  const pagerId = payload.pager_id.trim();
  if (!pagerId) return;

  const { currentUser, userDetails } = store.getState().user;
  const body: PagerActivityRequest = {
    pager_id: pagerId,
    user_email: currentUser.email,
    role: userDetails?.role || userTypeLabel(currentUser.user_type),
    market: userDetails?.market || DUMMY_USER_MARKET,
    datetime: new Date().toISOString(),
    action: payload.action,
  };

  void ApiBase.post(PAGER_ACTIVITY_PATH, body, { skipAuthRedirect: true }).catch(
    () => {
      // Dummy endpoint may 404 until the activity API exists.
    },
  );
}
