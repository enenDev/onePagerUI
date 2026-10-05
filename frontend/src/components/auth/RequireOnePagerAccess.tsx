import { Navigate, Outlet } from "react-router-dom";

import { useAppSelector } from "@/redux/hooks";

/** Analyst-only users never see one-pager screens. Other roles are unchanged. */
export function RequireOnePagerAccess() {
  const isAnalystOnly = useAppSelector(
    (state) => state.user.currentUser.isAnalystOnly,
  );

  if (isAnalystOnly) {
    return <Navigate to="/user-adoption" replace />;
  }

  return <Outlet />;
}
