"""
Pydantic v2 schemas for the One-Pager User Adoption Tracker Dashboard APIs:
- DashboardFilterRequest (Common filter: markets, current period, previous period)
- FunnelResponse (Stage 1 Onboarding, Stage 2 Engagement, Stage 3 Adoption with role breakdowns)
- OnboardingResponse (Market-wise rates, onboarded users, growth rate, views)
- EngagementResponse (Market-wise rates, engaged users, track-to-publish, exports)
- AdoptionResponse (Market-wise rates, adopted users, growth rate, draft-to-publish, published pagers)
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class DateRange(BaseModel):
    start: str = Field(..., description="Start date (YYYY-MM-DD or ISO datetime)")
    end: str = Field(..., description="End date (YYYY-MM-DD or ISO datetime)")

    @field_validator("start", "end")
    @classmethod
    def validate_non_empty(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Date string cannot be empty")
        return s


class DashboardFilterRequest(BaseModel):
    markets: List[str] = Field(
        default=["ALL"],
        description="List of markets to filter by, or ['ALL'] for all markets.",
    )
    current: DateRange = Field(..., description="Current reporting period")
    previous: DateRange = Field(..., description="Previous comparison period")

    @field_validator("markets")
    @classmethod
    def validate_markets(cls, v: List[str]) -> List[str]:
        if not v:
            return ["ALL"]
        cleaned = [m.strip() for m in v if m and m.strip()]
        return cleaned if cleaned else ["ALL"]


# ---------------------------------------------------------------------------
# Common Breakdown Models
# ---------------------------------------------------------------------------

class CountWithRoles(BaseModel):
    total: int = 0
    by_role: Dict[str, int] = Field(default_factory=dict)


class RateWithRoles(BaseModel):
    total: Optional[float] = None
    by_role: Dict[str, Optional[float]] = Field(default_factory=dict)


class MarketRateItem(BaseModel):
    market: str
    provisioned_users: int = 0
    active_users: int = 0  # Represents onboarded / engaged / adopted users for the respective section
    rate: Optional[float] = None
    roles: Dict[str, Optional[float]] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# API 1: Funnel Response
# ---------------------------------------------------------------------------

class FunnelResponse(BaseModel):
    provisioned_users: CountWithRoles
    onboarding_rate: RateWithRoles
    engagement_rate: RateWithRoles
    adoption_rate: RateWithRoles


# ---------------------------------------------------------------------------
# API 2: Onboarding Response
# ---------------------------------------------------------------------------

class OnboardingResponse(BaseModel):
    by_market: List[MarketRateItem] = Field(default_factory=list)
    onboarded_users: CountWithRoles
    onboarded_users_growth_rate: RateWithRoles
    total_one_pager_views: CountWithRoles


# ---------------------------------------------------------------------------
# API 3: Engagement Response
# ---------------------------------------------------------------------------

class EngagementResponse(BaseModel):
    by_market: List[MarketRateItem] = Field(default_factory=list)
    engaged_users: CountWithRoles
    track_to_publish: RateWithRoles
    total_exports: CountWithRoles


# ---------------------------------------------------------------------------
# API 4: Adoption Response
# ---------------------------------------------------------------------------

class AdoptionResponse(BaseModel):
    by_market: List[MarketRateItem] = Field(default_factory=list)
    adopted_users: CountWithRoles
    adopted_users_growth_rate: RateWithRoles
    draft_to_publish: RateWithRoles
    total_one_pagers_published: CountWithRoles