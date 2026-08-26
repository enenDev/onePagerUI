import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import { useAppSelector } from "@/redux/hooks";
import {
  canCreateNationalOnePager,
  canCreateRetailerOnePager,
  isCurrentUserOwner,
} from "@/redux/userSlice";
import {
  getOnePagerById,
  type EditOnePagerLocationState,
} from "@/services/onePagerApi";

type EditRouteLocationState = {
  /** Published Keep Active / Archive & Edit — save creates a new pager. */
  createAsNew?: boolean;
};

/**
 * Edit entry: one GET-by-id, then open the matching create form.
 *
 * TODO: Swap only getOnePagerById to GET /api/one-pagers/:id
 * (GetOnePagerApiResponse). Keep mapGetOnePagerResponse + pager_type branch
 * → /create/national vs /create/retailer.
 * Pass EditOnePagerLocationState.editRecord into the form (hydrate, no 2nd GET).
 * createAsNew from location.state (published edit flows) keeps recordId null
 * so Save Draft / Publish POST a new id.
 */
export function EditOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [error, setError] = useState<string | null>(null);
  const displayError = pagerId ? error : "Missing one-pager id.";
  const createAsNew = Boolean(
    (location.state as EditRouteLocationState | null)?.createAsNew,
  );

  useEffect(() => {
    setHeaderTitle("Edit One-Pager");
    setBackHandler(() => navigate("/home"));
    return () => {
      setHeaderTitle(null);
      setBackHandler(null);
    };
  }, [navigate, setBackHandler, setHeaderTitle]);

  useEffect(() => {
    if (!pagerId) return;

    let cancelled = false;

    void (async () => {
      const record = await getOnePagerById(pagerId);
      if (cancelled) return;
      if (!record) {
        setError("Could not load the one-pager.");
        return;
      }
      if (!isCurrentUserOwner(record.created_by, currentUser.id)) {
        setError("Only the owner can edit this one-pager.");
        return;
      }

      const canOpenForm =
        record.pager_type === "retailer"
          ? canCreateRetailerOnePager(currentUser.user_type)
          : canCreateNationalOnePager(currentUser.user_type);
      if (!canOpenForm) {
        setError("Your role cannot edit this one-pager type.");
        return;
      }

      const state: EditOnePagerLocationState = {
        editRecord: record,
        createAsNew,
      };
      const path =
        record.pager_type === "retailer"
          ? "/create/retailer"
          : "/create/national";
      navigate(path, { replace: true, state });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    createAsNew,
    currentUser.id,
    currentUser.user_type,
    navigate,
    pagerId,
  ]);

  return (
    <PageContainer className="flex flex-1 flex-col py-6">
      {displayError ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">{displayError}</p>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => navigate("/home")}
          >
            Back to home
          </Button>
        </div>
      ) : (
        <Loading label="Loading one-pager…" />
      )}
    </PageContainer>
  );
}
