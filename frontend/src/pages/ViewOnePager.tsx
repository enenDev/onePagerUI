import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import { Loading } from "@/components/common/Loading";
import { NationalPreviewDocument } from "@/components/preview/NationalPreviewDocument";
import {
  composeNationalPreviewTitle,
  composeRetailerPreviewTitle,
} from "@/components/preview/nationalPreview";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import type { FormLayoutContext } from "@/layouts/MainLayout";
import {
  getOnePagerById,
  type OnePagerByIdRecord,
} from "@/services/onePagerApi";
import { isCurrentUserOwner } from "@/types/onePager";

function composeViewTitle(record: OnePagerByIdRecord) {
  if (record.pager_type === "retailer") {
    return composeRetailerPreviewTitle(record.payload);
  }
  return composeNationalPreviewTitle(record.payload);
}

/**
 * Landing card click: GET-by-id, then the published/document view.
 * Active / Draft / Archive all open this page (no sticky Publish bar).
 *
 * TODO: Swap only getOnePagerById to GET /api/one-pagers/:id.
 * Keep rendering NationalPreviewDocument from the record payload (retailer
 * shows Target Retailer when present). Do not route through create/preview.
 * Back → /home. More Options → Edit still uses /edit/:id (owner-only).
 */
export function ViewOnePager() {
  const { pagerId } = useParams<{ pagerId: string }>();
  const navigate = useNavigate();
  const { setBackHandler, setHeaderTitle } =
    useOutletContext<FormLayoutContext>();
  const [record, setRecord] = useState<OnePagerByIdRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setBackHandler(() => navigate("/home"));
    return () => {
      setHeaderTitle(null);
      setBackHandler(null);
    };
  }, [navigate, setBackHandler, setHeaderTitle]);

  useEffect(() => {
    if (!record) {
      setHeaderTitle("View One-Pager");
      return;
    }
    setHeaderTitle(composeViewTitle(record));
  }, [record, setHeaderTitle]);

  useEffect(() => {
    if (!pagerId) {
      setError("Missing one-pager id.");
      return;
    }

    let cancelled = false;

    void (async () => {
      const next = await getOnePagerById(pagerId);
      if (cancelled) return;
      if (!next) {
        setError("Could not load the one-pager.");
        return;
      }
      setRecord(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [pagerId]);

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] w-full flex-col">
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
        ) : !record ? (
          <Loading label="Loading one-pager…" />
        ) : (
          <NationalPreviewDocument
            payload={record.payload}
            owner={record.created_by}
            publishedAt={record.published_at}
            status={record.list_status}
            moreOptionsEnabled
            canEdit={isCurrentUserOwner(record.created_by)}
            onEdit={() => navigate(`/edit/${record.id}`)}
          />
        )}
      </PageContainer>
    </div>
  );
}
