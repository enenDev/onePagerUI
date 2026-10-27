from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.metadata_repository import metadata_repository
from app.repositories.campaign_repository import campaign_repository
from app.models.campaign import Campaign
from app.models.metadata_item import MetadataItem
from app.utils.helpers import generate_uuid, utcnow
from app.schemas.metadata_schema import (
    MarketMetadataItem,
    MetadataItemMarketResponse,
    MetadataFilterRequest,
    MetadataUpsertRequest,
    MetadataOut,
    MetadataOptionItem,
)


class MetadataService:

    @staticmethod
    def _clean_string_list(values: Optional[List[str]]) -> List[str]:
        if not values:
            return []
        out: List[str] = []
        for value in values:
            if value is None:
                continue
            clean = str(value).strip()
            if not clean or clean in out:
                continue
            out.append(clean)
        return out

    @staticmethod
    def _to_option_items(values: Optional[List[str]]) -> List[MetadataOptionItem]:
        if not values:
            return []
        out: List[MetadataOptionItem] = []
        for value in values:
            if value is None:
                continue
            clean = str(value).strip()
            if not clean:
                continue
            out.append({"value": clean, "label": clean})
        return out

    @staticmethod
    def _to_option_items_from_rows(rows: Optional[List[MetadataItem]]) -> List[MetadataOptionItem]:
        if not rows:
            return []

        seen: Dict[str, MetadataOptionItem] = {}
        for row in sorted(
            rows,
            key=lambda item: (
                0 if item.sort_order is None else int(item.sort_order),
                (item.label or item.value or "").lower(),
                (item.value or "").lower(),
            ),
        ):
            if row is None or row.value is None:
                continue
            value = str(row.value).strip()
            if not value:
                continue
            if row.is_active is False:
                continue
            label = str(row.label).strip() if row.label else value
            if value not in seen:
                seen[value] = {"value": value, "label": label}

        return list(seen.values())

    def get_cascading_filters(
        self, db: Session, request: Optional[MetadataFilterRequest] = None
    ) -> Dict[str, MarketMetadataItem]:
        """
        Returns a dictionary keyed by market name.
        Each market object contains arrays of strings for retailer, channel, category, campaign,
        accountable_team, pillar_kpi_1, pillar_kpi_2, pillar_kpi_3, pillar_kpi_4, and pillar_kpi_5.
        If request.market is provided, filters for those markets only; otherwise returns all.
        """
        market_filters = request.market if request and request.market else None
        meta_records = metadata_repository.get_by_markets(db, markets=market_filters)
        campaigns_by_market = campaign_repository.get_campaign_names_by_market(
            db, market=market_filters
        )

        response: Dict[str, MarketMetadataItem] = {}

        # Populate from metadata records
        for meta in meta_records:
            m_name = meta.market
            retailer_list = meta.retailer if isinstance(meta.retailer, list) else []
            channel_list = meta.channel if isinstance(meta.channel, list) else []
            category_list = meta.category if isinstance(meta.category, list) else []
            acc_team_list = meta.accountable_team if isinstance(meta.accountable_team, list) else []
            pk1_list = meta.pillar_kpi_1 if isinstance(meta.pillar_kpi_1, list) else []
            pk2_list = meta.pillar_kpi_2 if isinstance(meta.pillar_kpi_2, list) else []
            pk3_list = meta.pillar_kpi_3 if isinstance(meta.pillar_kpi_3, list) else []
            pk4_list = meta.pillar_kpi_4 if isinstance(meta.pillar_kpi_4, list) else []
            pk5_list = meta.pillar_kpi_5 if isinstance(meta.pillar_kpi_5, list) else []
            bg_list = meta.business_group if isinstance(meta.business_group, list) else []
            yr_list = meta.year if isinstance(meta.year, list) else []
            campaign_list = campaigns_by_market.get(m_name, [])

            response[m_name] = MarketMetadataItem(
                retailer=self._clean_string_list(retailer_list),
                channel=self._clean_string_list(channel_list),
                category=self._clean_string_list(category_list),
                campaign=self._clean_string_list(campaign_list),
                accountable_team=self._clean_string_list(acc_team_list),
                pillar_kpi_1=self._clean_string_list(pk1_list),
                pillar_kpi_2=self._clean_string_list(pk2_list),
                pillar_kpi_3=self._clean_string_list(pk3_list),
                pillar_kpi_4=self._clean_string_list(pk4_list),
                pillar_kpi_5=self._clean_string_list(pk5_list),
                business_group=self._clean_string_list(bg_list),
                year=self._clean_string_list(yr_list),
            )

        # Include any markets that might only be in campaigns table if not already populated
        for c_market, c_list in campaigns_by_market.items():
            if c_market not in response:
                response[c_market] = MarketMetadataItem(
                    retailer=[],
                    channel=[],
                    category=[],
                    campaign=self._clean_string_list(c_list),
                    accountable_team=[],
                    pillar_kpi_1=[],
                    pillar_kpi_2=[],
                    pillar_kpi_3=[],
                    pillar_kpi_4=[],
                    pillar_kpi_5=[],
                    business_group=[],
                    year=[],
                )

        return response

    def get_metadata_items(
        self, db: Session, markets: Optional[List[str]] = None
    ) -> Dict[str, MetadataItemMarketResponse]:
        """
        Return metadata_items in the normalized form for /api/v1/metadata-items.
        This contract is intentionally separate from the legacy metadata API.
        """
        stmt = select(MetadataItem).where(MetadataItem.is_active.is_(True))
        if markets:
            flattened_markets = []
            for market in markets:
                if not market:
                    continue
                flattened_markets.extend([x.strip() for x in str(market).split(",") if x.strip()])
            if flattened_markets:
                stmt = stmt.where(MetadataItem.market.in_(flattened_markets))

        rows = db.scalars(stmt).all()
        grouped: Dict[str, Dict[str, List[MetadataItem]]] = {}
        for row in rows:
            grouped.setdefault(row.market, {}).setdefault(row.group_name, []).append(row)

        response: Dict[str, MetadataItemMarketResponse] = {}
        for market, groups in grouped.items():
            response[market] = MetadataItemMarketResponse(
                retailer=self._to_option_items_from_rows(groups.get("retailer", [])),
                channel=self._to_option_items_from_rows(groups.get("channel", [])),
                category=self._to_option_items_from_rows(groups.get("category", [])),
                campaign=self._to_option_items_from_rows(groups.get("campaign", [])),
                accountable_team=self._to_option_items_from_rows(groups.get("accountable_team", [])),
                pillar_kpi_1=self._to_option_items_from_rows(groups.get("pillar_kpi_1", [])),
                pillar_kpi_2=self._to_option_items_from_rows(groups.get("pillar_kpi_2", [])),
                pillar_kpi_3=self._to_option_items_from_rows(groups.get("pillar_kpi_3", [])),
                pillar_kpi_4=self._to_option_items_from_rows(groups.get("pillar_kpi_4", [])),
                pillar_kpi_5=self._to_option_items_from_rows(groups.get("pillar_kpi_5", [])),
                business_group=self._to_option_items_from_rows(groups.get("business_group", [])),
                year=self._to_option_items_from_rows(groups.get("year", [])),
            )

        return response

    def get_metadata_item_lookup(
        self, db: Session, markets: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Dict[str, str]]]:
        """
        Resolve value -> label mapping for existing records while keeping the stored values
        as the canonical identifiers. This supports view/edit/export compatibility without
        rewriting historical records.
        """
        stmt = select(MetadataItem).where(MetadataItem.is_active.is_(True))
        if markets:
            flattened_markets = []
            for market in markets:
                if not market:
                    continue
                flattened_markets.extend([x.strip() for x in str(market).split(",") if x.strip()])
            if flattened_markets:
                stmt = stmt.where(MetadataItem.market.in_(flattened_markets))

        rows = sorted(
            db.scalars(stmt).all(),
            key=lambda item: (
                item.market,
                item.group_name,
                item.sort_order,
                (item.label or item.value or "").lower(),
            ),
        )

        lookup: Dict[str, Dict[str, Dict[str, str]]] = {}
        for row in rows:
            market_map = lookup.setdefault(row.market, {})
            group_map = market_map.setdefault(row.group_name, {})
            group_map[str(row.value).strip()] = str(row.label or row.value).strip()

        return lookup

    def resolve_pager_metadata_labels(self, db: Session, pager) -> None:
        """Resolve a pager's stored metadata values to current labels for read responses.

        The database keeps the saved canonical value. The API returns the display label so the
        frontend continues to behave as before without needing direct metadata lookups.
        """
        if pager is None or not getattr(pager, "market", None):
            return

        market_lookup = self.get_metadata_item_lookup(db, [pager.market]).get(pager.market, {})

        def resolve_value(value: Optional[str], group_name: str) -> Optional[str]:
            if value is None:
                return None
            clean_value = str(value).strip()
            if not clean_value:
                return value
            return market_lookup.get(group_name, {}).get(clean_value, value)

        pager.retailer = resolve_value(pager.retailer, "retailer")
        pager.channel = resolve_value(pager.channel, "channel")
        pager.category = resolve_value(pager.category, "category")
        pager.campaign_focus = resolve_value(pager.campaign_focus, "campaign")
        pager.business_group = resolve_value(pager.business_group, "business_group")
        pager.year = resolve_value(pager.year, "year")

        for pillar in getattr(pager, "pillars", []) or []:
            for initiative in getattr(pillar, "initiatives", []) or []:
                initiative.accountable_function_department = resolve_value(
                    initiative.accountable_function_department,
                    "accountable_team",
                )
                pillar_kpi_group = f"pillar_kpi_{getattr(pillar, 'pillar_number', 1)}"
                initiative.kpi_metric = resolve_value(
                    initiative.kpi_metric,
                    pillar_kpi_group,
                )

    def _sync_metadata_items_for_market(
        self, db: Session, market: str, values_by_group: Dict[str, List[str]]
    ) -> None:
        """Keep metadata_items synchronized with the legacy metadata table for backwards compatibility."""
        if not market:
            return

        existing_rows = (
            db.query(MetadataItem)
            .filter(MetadataItem.market == market)
            .all()
        )
        existing_by_group: Dict[str, List[MetadataItem]] = {}
        for row in existing_rows:
            existing_by_group.setdefault(row.group_name, []).append(row)

        for group_name, values in values_by_group.items():
            cleaned_values = self._clean_string_list(values)
            allowed = set(cleaned_values)
            active_rows = existing_by_group.get(group_name, [])
            active_by_value = {str(row.value).strip(): row for row in active_rows}

            for row in active_rows:
                if str(row.value).strip() in allowed:
                    row.label = str(row.label).strip() or str(row.value).strip()
                    row.key_name = group_name
                    row.sort_order = cleaned_values.index(str(row.value).strip()) if str(row.value).strip() in cleaned_values else row.sort_order
                    row.is_active = True
                else:
                    row.is_active = False

            for sort_order, value in enumerate(cleaned_values):
                if str(value).strip() in active_by_value:
                    continue
                db.add(
                    MetadataItem(
                        market=market,
                        group_name=group_name,
                        key_name=group_name,
                        value=str(value).strip(),
                        label=str(value).strip(),
                        sort_order=sort_order,
                        is_active=True,
                    )
                )

    def upsert_metadata(
        self, db: Session, payload: MetadataUpsertRequest
    ) -> MetadataOut:
        """
        Adds or updates metadata for a market.
        If market exists, updates retailer, channel, category, accountable_team, pillar_kpi_1..5;
        else creates a new market record.
        Also inserts any campaigns specified into the campaign repository.
        """
        market = payload.market.strip() if payload.market else ""
        if not market:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Market name cannot be empty.",
            )

        def _clean_list(items: Optional[List[str]]) -> List[str]:
            if not items:
                return []
            cleaned = []
            for item in items:
                if item and item.strip() and item.strip() not in cleaned:
                    cleaned.append(item.strip())
            return cleaned

        retailer = _clean_list(payload.retailer)
        channel = _clean_list(payload.channel)
        category = _clean_list(payload.category)
        campaigns = _clean_list(payload.campaign)
        accountable_team = _clean_list(payload.accountable_team)
        pillar_kpi_1 = _clean_list(payload.pillar_kpi_1)
        pillar_kpi_2 = _clean_list(payload.pillar_kpi_2)
        pillar_kpi_3 = _clean_list(payload.pillar_kpi_3)
        pillar_kpi_4 = _clean_list(payload.pillar_kpi_4)
        pillar_kpi_5 = _clean_list(payload.pillar_kpi_5)
        business_group = _clean_list(payload.business_group)
        year = _clean_list(payload.year)
        if campaigns:
            existing_campaigns = campaign_repository.get_campaign_names_by_market(
                db, market=[market]
            ).get(market, [])
            for camp_name in campaigns:
                if camp_name not in existing_campaigns:
                    new_camp = Campaign(
                        campaign_id=generate_uuid(),
                        market=market,
                        campaign_name=camp_name,
                        created_by="api",
                        created_at=utcnow(),
                    )
                    campaign_repository.create(db, new_camp)

        metadata_record = metadata_repository.upsert(
            db,
            market=market,
            retailer=retailer,
            channel=channel,
            category=category,
            accountable_team=accountable_team,
            pillar_kpi_1=pillar_kpi_1,
            pillar_kpi_2=pillar_kpi_2,
            pillar_kpi_3=pillar_kpi_3,
            pillar_kpi_4=pillar_kpi_4,
            pillar_kpi_5=pillar_kpi_5,
            business_group=business_group,
            year=year,
        )
        self._sync_metadata_items_for_market(
            db,
            market,
            {
                "retailer": retailer,
                "channel": channel,
                "category": category,
                "accountable_team": accountable_team,
                "pillar_kpi_1": pillar_kpi_1,
                "pillar_kpi_2": pillar_kpi_2,
                "pillar_kpi_3": pillar_kpi_3,
                "pillar_kpi_4": pillar_kpi_4,
                "pillar_kpi_5": pillar_kpi_5,
                "business_group": business_group,
                "year": year,
            },
        )
        db.commit()
        db.refresh(metadata_record)

        current_campaigns = campaign_repository.get_campaign_names_by_market(
            db, market=[market]
        ).get(market, [])

        out = MetadataOut.model_validate(metadata_record)
        out.campaign = current_campaigns
        return out


metadata_service = MetadataService()

