import { useEffect, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchMetadata } from "@/redux/landingSlice";
import {
  composeCreateFormCatalog,
  type CreateFormMetadata,
} from "@/services/createFormApi";

/**
 * Create-form catalog. Every dropdown — strategy (Market / Retailer / Channel /
 * Category / Campaign) and initiative modal (Accountable Team / per-pillar KPIs)
 * — is composed from `landing.metadata` (GET api/v1/metadata). Form field values
 * stay in local useState.
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

  useEffect(() => {
    if (filterMetadata) return;
    void dispatch(fetchMetadata());
  }, [dispatch, filterMetadata]);

  const catalog = useMemo(
    () => composeCreateFormCatalog(filterMetadata),
    [filterMetadata],
  );

  const catalogLoading =
    !filterMetadata && (metadataLoading || !metadataError);

  return {
    catalog,
    catalogLoading,
  };
}
