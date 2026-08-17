import { useEffect, useMemo, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMetadata } from "@/redux/landingSlice";
import {
  composeCreateFormCatalog,
  getCreateFormMetadata,
  type CreateFormExtras,
  type CreateFormMetadata,
} from "@/services/createFormApi";

/**
 * Strategy dropdowns (Market, Retailer, Channel, Category, Campaign) reuse
 * `landing.metadata` from getMetadata. Initiative extras stay on
 * getCreateFormMetadata. Form field values stay in local useState.
 */
export function useCreateFormCatalog(): {
  catalog: CreateFormMetadata | null;
  catalogLoading: boolean;
} {
  const dispatch = useAppDispatch();
  const filterMetadata = useAppSelector((state) => state.landing.metadata);
  const metadataLoading = useAppSelector(
    (state) => state.landing.metadataLoading,
  );
  const metadataError = useAppSelector((state) => state.landing.error);
  const [extras, setExtras] = useState<CreateFormExtras | null>(null);
  const [extrasLoading, setExtrasLoading] = useState(true);

  useEffect(() => {
    if (filterMetadata) return;
    void dispatch(fetchMetadata());
  }, [dispatch, filterMetadata]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // TODO: Real FastAPI — swap getCreateFormMetadata for initiative extras only.
      // Market / Retailer / Channel / Category / Campaign stay on fetchMetadata.
      try {
        const next = await getCreateFormMetadata();
        if (cancelled) return;
        setExtras(next);
      } finally {
        if (!cancelled) setExtrasLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = useMemo(
    () => composeCreateFormCatalog(filterMetadata, extras),
    [extras, filterMetadata],
  );

  const waitingOnFilters =
    !filterMetadata && (metadataLoading || !metadataError);

  return {
    catalog,
    catalogLoading: extrasLoading || waitingOnFilters,
  };
}
