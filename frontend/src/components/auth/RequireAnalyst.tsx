import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAppSelector } from "@/redux/hooks";

type RequireAnalystProps = {
  children: ReactNode;
};

/** User Adoption is only for a token whose role array includes analyst. */
export function RequireAnalyst({ children }: RequireAnalystProps) {
  const isAnalyst = useAppSelector(
    (state) => state.user.currentUser.isAnalyst,
  );

  if (!isAnalyst) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
