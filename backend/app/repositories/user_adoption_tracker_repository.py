"""
Repository for One-Pager User Adoption Tracker Dashboard aggregations.
Executes pure, parameterized direct SQL queries where calculations are performed
directly by the database engine, and transforms the resulting rows into the API response models.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.repositories.dashboard_queries import (
    build_funnel_direct_query,
    build_onboarding_market_query,
    build_onboarding_kpi_query,
    build_engagement_market_query,
    build_engagement_kpi_query,
    build_adoption_market_query,
    build_adoption_kpi_query,
    build_coverage_published_pagers_query,
    build_coverage_mapping_query,
)
from app.schemas.dashboard_schema import (
    AdoptionResponse,
    CountWithRoles,
    CoverageResponse,
    EngagementResponse,
    FunnelResponse,
    MarketRateItem,
    OnboardingResponse,
    RateWithRoles,
)

logger = logging.getLogger(__name__)

NATIONAL_ROW = "National"
_NATIONAL_TYPE = "national"
_RETAILER_TYPE = "retailer"


def _cell_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def match_coverage_grid(
    pager_rows: List[Any],
    mapping_rows: List[Any],
) -> List[Dict[str, Any]]:
    """
    Build one coverage block per market.

    Mapping rows draw the empty grid. A published pager fills one cell, and a
    second pager on that same cell, including another year, does not add
    another tick. published_count is every published pager row for the market,
    so those two years count as 2. A pager that fits no cell is counted in
    unmapped_count and still counts in published_count.
    """
    markets: Dict[str, Dict[str, Any]] = {}

    def block_for(market: str) -> Dict[str, Any]:
        block = markets.get(market)
        if block is None:
            block = {
                "channel_order": [],
                "retailers": {},
                "retailer_sets": {},
                "group_order": [],
                "categories": {},
                "category_pairs": set(),
            }
            markets[market] = block
        return block

    for row in mapping_rows:
        market = _cell_text(row["market"])
        parent_type = _cell_text(row["parent_type"])
        parent_value = _cell_text(row["parent_value"])
        child_value = _cell_text(row["child_value"])
        if not market or not parent_value or not child_value:
            continue
        block = block_for(market)
        if parent_type == "channel":
            retailers = block["retailers"].setdefault(parent_value, [])
            retailer_set = block["retailer_sets"].setdefault(parent_value, set())
            if parent_value not in block["channel_order"]:
                block["channel_order"].append(parent_value)
            if child_value not in retailer_set:
                retailer_set.add(child_value)
                retailers.append(child_value)
        elif parent_type == "business_group":
            categories = block["categories"].setdefault(parent_value, [])
            if parent_value not in block["group_order"]:
                block["group_order"].append(parent_value)
            pair = (parent_value, child_value)
            if pair not in block["category_pairs"]:
                block["category_pairs"].add(pair)
                categories.append(child_value)

    filled_by_market: Dict[str, set] = {market: set() for market in markets}
    unmapped_by_market: Dict[str, int] = {market: 0 for market in markets}
    published_by_market: Dict[str, int] = {market: 0 for market in markets}

    for row in pager_rows:
        market = _cell_text(row["market"])
        if market not in markets:
            block_for(market)
            filled_by_market[market] = set()
            unmapped_by_market[market] = 0
            published_by_market[market] = 0
        block = markets[market]
        published_by_market[market] += 1
        pager_type = _cell_text(row["pager_type"]).lower()
        channel = _cell_text(row["channel"])
        retailer = _cell_text(row["retailer"])
        business_group = _cell_text(row["business_group"])
        category = _cell_text(row["category"])
        pair = (business_group, category)
        cell = None
        if channel in block["retailers"] and pair in block["category_pairs"]:
            if pager_type == _NATIONAL_TYPE:
                cell = (channel, NATIONAL_ROW, business_group, category)
            elif (
                pager_type == _RETAILER_TYPE
                and retailer in block["retailer_sets"].get(channel, ())
            ):
                cell = (channel, retailer, business_group, category)
        if cell is None:
            unmapped_by_market[market] += 1
        else:
            filled_by_market[market].add(cell)

    blocks: List[Dict[str, Any]] = []
    for market, block in markets.items():
        channels = []
        row_count = 0
        for channel in block["channel_order"]:
            rows = [NATIONAL_ROW, *block["retailers"][channel]]
            row_count += len(rows)
            channels.append({"channel": channel, "rows": rows})

        business_groups = []
        category_order = []
        for group in block["group_order"]:
            categories = block["categories"][group]
            business_groups.append(
                {"business_group": group, "categories": categories}
            )
            category_order.extend((group, category) for category in categories)

        filled_set = filled_by_market.get(market, set())
        filled_cells = []
        for channel in block["channel_order"]:
            for row_name in (NATIONAL_ROW, *block["retailers"][channel]):
                for group, category in category_order:
                    if (channel, row_name, group, category) in filled_set:
                        filled_cells.append(
                            {
                                "channel": channel,
                                "row": row_name,
                                "business_group": group,
                                "category": category,
                            }
                        )

        blocks.append(
            {
                "market": market,
                "channels": channels,
                "business_groups": business_groups,
                "filled_cells": filled_cells,
                "filled": len(filled_set),
                "possible": row_count * len(category_order),
                "unmapped_count": unmapped_by_market.get(market, 0),
                "published_count": published_by_market.get(market, 0),
            }
        )
    return blocks


class UserAdoptionTrackerRepository:

    def _execute_sql(self, db: Session, kpi_name: str, sql: str, params: dict):
        """Executes raw SQL query, logging the query for cross-checking."""
        logger.debug("Executing KPI [%s] SQL Query:\n%s\nParams: %s", kpi_name, sql, params)
        return db.execute(text(sql), params).mappings().all()

    # -----------------------------------------------------------------------
    # Direct 4-API Execution Methods (Calculations done inside SQL query)
    # -----------------------------------------------------------------------

    def get_funnel_metrics(
        self,
        db: Session,
        start: datetime,
        end: datetime,
        markets: List[str],
    ) -> FunnelResponse:
        """
        API 1: Adoption Funnel
        Executes single direct SQL query with all rate calculations performed in SQL.
        """
        sql, params = build_funnel_direct_query(start, end, markets)
        rows = self._execute_sql(db, "Funnel Direct KPI", sql, params)

        total_prov = 0
        prov_by_role: Dict[str, int] = {}
        onb_rate_by_role: Dict[str, Optional[float]] = {}
        eng_rate_by_role: Dict[str, Optional[float]] = {}
        adp_rate_by_role: Dict[str, Optional[float]] = {}
        onb_rate_total: Optional[float] = None
        eng_rate_total: Optional[float] = None
        adp_rate_total: Optional[float] = None

        for r in rows:
            role = r["role"]
            if role == "__TOTAL__":
                total_prov = int(r["prov_count"] or 0)
                onb_rate_total = float(r["onboarding_rate"]) if r["onboarding_rate"] is not None else None
                eng_rate_total = float(r["engagement_rate"]) if r["engagement_rate"] is not None else None
                adp_rate_total = float(r["adoption_rate"]) if r["adoption_rate"] is not None else None
            else:
                prov_by_role[role] = int(r["prov_count"] or 0)
                onb_rate_by_role[role] = float(r["onboarding_rate"]) if r["onboarding_rate"] is not None else None
                eng_rate_by_role[role] = float(r["engagement_rate"]) if r["engagement_rate"] is not None else None
                adp_rate_role = float(r["adoption_rate"]) if r["adoption_rate"] is not None else None
                adp_rate_by_role[role] = adp_rate_role

        return FunnelResponse(
            provisioned_users=CountWithRoles(total=total_prov, by_role=prov_by_role),
            onboarding_rate=RateWithRoles(total=onb_rate_total, by_role=onb_rate_by_role),
            engagement_rate=RateWithRoles(total=eng_rate_total, by_role=eng_rate_by_role),
            adoption_rate=RateWithRoles(total=adp_rate_total, by_role=adp_rate_by_role),
        )

    def get_onboarding_metrics(
        self,
        db: Session,
        start: datetime,
        end: datetime,
        prev_start: datetime,
        prev_end: datetime,
        markets: List[str],
    ) -> OnboardingResponse:
        """
        API 2: Onboarding Section
        Executes direct market breakdown and KPI summary queries with all calculations in SQL.
        """
        mkt_sql, mkt_params = build_onboarding_market_query(start, end, markets)
        mkt_rows = self._execute_sql(db, "Onboarding Market Breakdown", mkt_sql, mkt_params)

        kpi_sql, kpi_params = build_onboarding_kpi_query(start, end, prev_start, prev_end, markets)
        kpi_rows = self._execute_sql(db, "Onboarding KPI Summary", kpi_sql, kpi_params)

        # Process market breakdown
        market_dict: Dict[str, Dict[str, Any]] = {}
        for r in mkt_rows:
            m = r["market"]
            role = r["role"]
            if m not in market_dict:
                market_dict[m] = {
                    "market": m,
                    "provisioned_users": 0,
                    "active_users": 0,
                    "rate": None,
                    "roles": {},
                }
            if role == "__TOTAL__":
                market_dict[m]["provisioned_users"] = int(r["prov_count"] or 0)
                market_dict[m]["active_users"] = int(r["active_count"] or 0)
                market_dict[m]["rate"] = float(r["rate"]) if r["rate"] is not None else None
            else:
                market_dict[m]["roles"][role] = float(r["rate"]) if r["rate"] is not None else None

        by_market = [MarketRateItem(**v) for v in market_dict.values()]

        # Process KPI summary
        onb_total = 0
        onb_by_role: Dict[str, int] = {}
        growth_total = 0.0
        growth_by_role: Dict[str, Optional[float]] = {}
        views_total = 0
        views_by_role: Dict[str, int] = {}

        for r in kpi_rows:
            role = r["role"]
            if role == "__TOTAL__":
                onb_total = int(r["onboarded_count"] or 0)
                growth_total = float(r["growth_rate"] or 0.0)
                views_total = int(r["views_count"] or 0)
            else:
                onb_by_role[role] = int(r["onboarded_count"] or 0)
                growth_by_role[role] = float(r["growth_rate"] or 0.0)
                views_by_role[role] = int(r["views_count"] or 0)

        return OnboardingResponse(
            by_market=by_market,
            onboarded_users=CountWithRoles(total=onb_total, by_role=onb_by_role),
            onboarded_users_growth_rate=RateWithRoles(total=growth_total, by_role=growth_by_role),
            total_one_pager_views=CountWithRoles(total=views_total, by_role=views_by_role),
        )

    def get_engagement_metrics(
        self,
        db: Session,
        start: datetime,
        end: datetime,
        markets: List[str],
    ) -> EngagementResponse:
        """
        API 3: Engagement Section
        Executes direct market breakdown and KPI summary queries with all calculations in SQL.
        """
        mkt_sql, mkt_params = build_engagement_market_query(start, end, markets)
        mkt_rows = self._execute_sql(db, "Engagement Market Breakdown", mkt_sql, mkt_params)

        kpi_sql, kpi_params = build_engagement_kpi_query(start, end, markets)
        kpi_rows = self._execute_sql(db, "Engagement KPI Summary", kpi_sql, kpi_params)

        # Process market breakdown
        market_dict: Dict[str, Dict[str, Any]] = {}
        for r in mkt_rows:
            m = r["market"]
            role = r["role"]
            if m not in market_dict:
                market_dict[m] = {
                    "market": m,
                    "provisioned_users": 0,
                    "active_users": 0,
                    "rate": None,
                    "roles": {},
                }
            if role == "__TOTAL__":
                market_dict[m]["provisioned_users"] = int(r["prov_count"] or 0)
                market_dict[m]["active_users"] = int(r["active_count"] or 0)
                market_dict[m]["rate"] = float(r["rate"]) if r["rate"] is not None else None
            else:
                market_dict[m]["roles"][role] = float(r["rate"]) if r["rate"] is not None else None

        by_market = [MarketRateItem(**v) for v in market_dict.values()]

        # Process KPI summary
        eng_total = 0
        eng_by_role: Dict[str, int] = {}
        ttp_total: Optional[float] = None
        ttp_by_role: Dict[str, Optional[float]] = {}
        exp_total = 0
        exp_by_role: Dict[str, int] = {}

        for r in kpi_rows:
            role = r["role"]
            if role == "__TOTAL__":
                eng_total = int(r["engaged_count"] or 0)
                ttp_total = float(r["ttp_rate"]) if r["ttp_rate"] is not None else None
                exp_total = int(r["exports_count"] or 0)
            else:
                eng_by_role[role] = int(r["engaged_count"] or 0)
                ttp_by_role[role] = float(r["ttp_rate"]) if r["ttp_rate"] is not None else None
                exp_by_role[role] = int(r["exports_count"] or 0)

        return EngagementResponse(
            by_market=by_market,
            engaged_users=CountWithRoles(total=eng_total, by_role=eng_by_role),
            track_to_publish=RateWithRoles(total=ttp_total, by_role=ttp_by_role),
            total_exports=CountWithRoles(total=exp_total, by_role=exp_by_role),
        )

    def get_adoption_metrics(
        self,
        db: Session,
        start: datetime,
        end: datetime,
        prev_start: datetime,
        prev_end: datetime,
        markets: List[str],
    ) -> AdoptionResponse:
        """
        API 4: Adoption Section
        Executes direct market breakdown and KPI summary queries with all calculations in SQL.
        """
        mkt_sql, mkt_params = build_adoption_market_query(start, end, markets)
        mkt_rows = self._execute_sql(db, "Adoption Market Breakdown", mkt_sql, mkt_params)

        kpi_sql, kpi_params = build_adoption_kpi_query(start, end, prev_start, prev_end, markets)
        kpi_rows = self._execute_sql(db, "Adoption KPI Summary", kpi_sql, kpi_params)

        # Process market breakdown
        market_dict: Dict[str, Dict[str, Any]] = {}
        for r in mkt_rows:
            m = r["market"]
            role = r["role"]
            if m not in market_dict:
                market_dict[m] = {
                    "market": m,
                    "provisioned_users": 0,
                    "active_users": 0,
                    "rate": None,
                    "roles": {},
                    "adopted_by_role": {"CSP": 0, "CBD": 0},
                }
            if role == "__TOTAL__":
                market_dict[m]["provisioned_users"] = int(r["prov_count"] or 0)
                market_dict[m]["active_users"] = int(r["active_count"] or 0)
                market_dict[m]["rate"] = float(r["rate"]) if r["rate"] is not None else None
            else:
                market_dict[m]["roles"][role] = float(r["rate"]) if r["rate"] is not None else None
                # active_count is adopted users of this role in this market.
                # roles stays the percentage used by the market chart.
                normalized = str(role).strip().upper()
                if normalized in ("CSP", "CBD"):
                    market_dict[m]["adopted_by_role"][normalized] = int(r["active_count"] or 0)

        by_market = [MarketRateItem(**v) for v in market_dict.values()]

        # Process KPI summary
        adp_total = 0
        adp_by_role: Dict[str, int] = {}
        growth_total = 0.0
        growth_by_role: Dict[str, Optional[float]] = {}
        dtp_total: Optional[float] = None
        dtp_by_role: Dict[str, Optional[float]] = {}
        pub_total = 0
        pub_by_role: Dict[str, int] = {}

        for r in kpi_rows:
            role = r["role"]
            if role == "__TOTAL__":
                adp_total = int(r["adopted_count"] or 0)
                growth_total = float(r["growth_rate"] or 0.0)
                dtp_total = float(r["dtp_rate"]) if r["dtp_rate"] is not None else None
                pub_total = int(r["published_pagers_count"] or 0)
            else:
                adp_by_role[role] = int(r["adopted_count"] or 0)
                growth_by_role[role] = float(r["growth_rate"] or 0.0)
                dtp_by_role[role] = float(r["dtp_rate"]) if r["dtp_rate"] is not None else None
                pub_by_role[role] = int(r["published_pagers_count"] or 0)

        return AdoptionResponse(
            by_market=by_market,
            adopted_users=CountWithRoles(total=adp_total, by_role=adp_by_role),
            adopted_users_growth_rate=RateWithRoles(total=growth_total, by_role=growth_by_role),
            draft_to_publish=RateWithRoles(total=dtp_total, by_role=dtp_by_role),
            total_one_pagers_published=CountWithRoles(total=pub_total, by_role=pub_by_role),
        )

    def get_coverage_metrics(
        self,
        db: Session,
        start: datetime,
        end: datetime,
        markets: List[str],
    ) -> CoverageResponse:
        """
        Coverage grid for the selected markets and current period.
        Previous period is not used. One block per market.
        """
        pager_sql, pager_params = build_coverage_published_pagers_query(start, end, markets)
        pager_rows = self._execute_sql(db, "Coverage Published Pagers", pager_sql, pager_params)

        mapping_sql, mapping_params = build_coverage_mapping_query(markets)
        mapping_rows = self._execute_sql(db, "Coverage Mapping", mapping_sql, mapping_params)

        return CoverageResponse(by_market=match_coverage_grid(pager_rows, mapping_rows))


user_adoption_tracker_repository = UserAdoptionTrackerRepository()
