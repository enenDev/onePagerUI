import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import {
  getOnePagerById,
  type EditOnePagerLocationState,
} from "@/services/onePagerApi";
import { isCurrentUserOwner } from "@/types/onePager";

/**
 * Edit entry: one GET-by-id, then open the matching create form.
 *
 * TODO: Swap only getOnePagerById to GET /api/one-pagers/:id.
 * Keep branching on pager_type → /create/national vs /create/retailer.
 * Pass EditOnePagerLocationState.editRecord into the form (hydrate, no 2nd GET).
 */
export function EditOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const navigate = useNavigate();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHeaderTitle("Edit One-Pager");
    setBackHandler(() => navigate("/home"));
    return () => {
      setHeaderTitle(null);
      setBackHandler(null);
    };
  }, [navigate, setBackHandler, setHeaderTitle]);

  useEffect(() => {
    if (!pagerId) {
      setError("Missing one-pager id.");
      return;
    }

    let cancelled = false;

    void (async () => {
      const record = await getOnePagerById(pagerId);
      if (cancelled) return;
      if (!record) {
        setError("Could not load the one-pager.");
        return;
      }
      if (!isCurrentUserOwner(record.created_by)) {
        setError("Only the owner can edit this one-pager.");
        return;
      }

      const state: EditOnePagerLocationState = { editRecord: record };
      const path =
        record.pager_type === "retailer"
          ? "/create/retailer"
          : "/create/national";
      navigate(path, { replace: true, state });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, pagerId]);

  return (
    <PageContainer className="flex flex-1 flex-col py-6">
      {error ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">{error}</p>
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
