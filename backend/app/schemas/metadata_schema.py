"""
Pydantic v2 schemas for Metadata cascading filter API.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, AliasChoices


class MetadataOptionItem(BaseModel):
    value: str
    label: str


class MarketMetadataItem(BaseModel):
    """
    Metadata dimensions and campaigns for a single market.
    """
    retailer: List[str] = []
    channel: List[str] = []
    category: List[str] = []
    campaign: List[str] = []
    accountable_team: List[str] = Field(default=[], validation_alias=AliasChoices("accountable_team", "accountable_table"))
    pillar_kpi_1: List[str] = []
    pillar_kpi_2: List[str] = []
    pillar_kpi_3: List[str] = []
    pillar_kpi_4: List[str] = []
    pillar_kpi_5: List[str] = []
    business_group: List[str] = []
    year: List[str] = []


class MetadataItemMarketResponse(BaseModel):
    """
    Normalized metadata_items response contract for /api/v1/metadata-items.

    Each field returns option objects shaped as {value, label} so the UI can display
    labels while storing canonical values.
    """
    retailer: List[MetadataOptionItem] = []
    channel: List[MetadataOptionItem] = []
    category: List[MetadataOptionItem] = []
    campaign: List[MetadataOptionItem] = []
    accountable_team: List[MetadataOptionItem] = Field(
        default=[],
        validation_alias=AliasChoices("accountable_team", "accountable_table"),
    )
    pillar_kpi_1: List[MetadataOptionItem] = []
    pillar_kpi_2: List[MetadataOptionItem] = []
    pillar_kpi_3: List[MetadataOptionItem] = []
    pillar_kpi_4: List[MetadataOptionItem] = []
    pillar_kpi_5: List[MetadataOptionItem] = []
    business_group: List[MetadataOptionItem] = []
    year: List[MetadataOptionItem] = []

class MetadataUpsertRequest(BaseModel):
    """
    Request payload to add or update metadata for a market.
    """
    market: str
    retailer: List[str] = []
    channel: List[str] = []
    category: List[str] = []
    campaign: List[str] = []
    accountable_team: List[str] = Field(default=[], validation_alias=AliasChoices("accountable_team", "accountable_table"))
    pillar_kpi_1: List[str] = []
    pillar_kpi_2: List[str] = []
    pillar_kpi_3: List[str] = []
    pillar_kpi_4: List[str] = []
    pillar_kpi_5: List[str] = []
    business_group: List[str] = []
    year: List[str] = []

class MetadataOut(BaseModel):
    metadata_id: int
    market: str
    retailer: List[str] = []
    channel: List[str] = []
    category: List[str] = []
    campaign: List[str] = []
    accountable_team: List[str] = Field(default=[], validation_alias=AliasChoices("accountable_team", "accountable_table"))
    pillar_kpi_1: List[str] = []
    pillar_kpi_2: List[str] = []
    pillar_kpi_3: List[str] = []
    pillar_kpi_4: List[str] = []
    pillar_kpi_5: List[str] = []
    business_group: List[str] = []
    year: List[str] = []

    model_config = {"from_attributes": True}


class MetadataFilterRequest(BaseModel):
    """
    Filter request. Empty market list or omitting market returns all markets.
    """
    market: Optional[List[str]] = []
    retailer: Optional[List[str]] = []
    channel: Optional[List[str]] = []
    category: Optional[List[str]] = []
    campaign: Optional[List[str]] = []
    pager_type: Optional[List[str]] = []
    status: Optional[List[str]] = []
    accountable_team: Optional[List[str]] = Field(default=[], validation_alias=AliasChoices("accountable_team", "accountable_table"))
    pillar_kpi_1: Optional[List[str]] = []
    pillar_kpi_2: Optional[List[str]] = []
    pillar_kpi_3: Optional[List[str]] = []
    pillar_kpi_4: Optional[List[str]] = []
    pillar_kpi_5: Optional[List[str]] = []
    business_group: Optional[List[str]] = []
    year: Optional[List[str]] = []

# Type alias for dictionary response mapping market -> MarketMetadataItem
MetadataDictResponse = Dict[str, MarketMetadataItem]
MetadataItemsDictResponse = Dict[str, MetadataItemMarketResponse]
MetadataItemLookupResponse = Dict[str, Dict[str, Dict[str, str]]]
