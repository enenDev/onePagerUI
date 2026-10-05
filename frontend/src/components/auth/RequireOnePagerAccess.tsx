import { Navigate, Outlet, useOutletContext } from "react-router-dom";

import type { FormLayoutContext } from "@/layouts/MainLayout";
import { useAppSelector } from "@/redux/hooks";

/** Analyst-only users never see one-pager screens. Other roles are unchanged. */
export function RequireOnePagerAccess() {
  // MainLayout passes setBackHandler / setHeaderTitle on its Outlet.
  // This gate is the nearest Outlet for create, edit, view, track, and preview,
  // so those pages only see the context if we forward it.
  const outletContext = useOutletContext<FormLayoutContext>();
  const isAnalystOnly = useAppSelector(
    (state) => state.user.currentUser.isAnalystOnly,
  );

  if (isAnalystOnly) {
    return <Navigate to="/user-adoption" replace />;
  }

  return <Outlet context={outletContext} />;
}
