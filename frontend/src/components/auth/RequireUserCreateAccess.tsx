import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { useAppSelector } from "@/redux/hooks";
import {
  canCreateNationalOnePager,
  canCreateRetailerOnePager,
} from "@/redux/userSlice";

type CreateKind = "national" | "retailer";

type RequireUserCreateAccessProps = {
  kind: CreateKind;
  children: ReactNode;
};

/**
 * FE-only create/preview route gate.
 *
 * - user_type_3: no /create/* (read-only)
 * - user_type_2: no /create/national* (retailer create/import only)
 */
export function RequireUserCreateAccess({
  kind,
  children,
}: RequireUserCreateAccessProps) {
  const navigate = useNavigate();
  const userType = useAppSelector((state) => state.user.currentUser.user_type);

  const allowed =
    kind === "retailer"
      ? canCreateRetailerOnePager(userType)
      : canCreateNationalOnePager(userType);

  useEffect(() => {
    if (!allowed) {
      navigate("/home", { replace: true });
    }
  }, [allowed, navigate]);

  if (!allowed) {
    return <Loading label="Redirecting…" />;
  }

  return children;
}
