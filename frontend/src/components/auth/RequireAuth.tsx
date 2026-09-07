import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Loading } from "@/components/common/Loading";

import { useAuth } from "./AuthProvider";

type RequireAuthProps = {
  children: ReactNode;
};

/** Sends unauthenticated users to /login. Login stays outside this gate. */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading className="min-h-svh" label="Loading…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
