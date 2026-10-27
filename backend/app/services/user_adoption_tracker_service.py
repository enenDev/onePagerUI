from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.repositories.user_adoption_tracker_repository import (
    user_adoption_tracker_repository,
)
from app.schemas.dashboard_schema import (
    AdoptionResponse,
    DashboardFilterRequest,
    DateRange,
    EngagementResponse,
    FunnelResponse,
    OnboardingResponse,
)


class UserAdoptionTrackerService:

    def parse_date_range(self, date_range: DateRange) -> Tuple[datetime, datetime]:
        """Parses start and end date strings; expands YYYY-MM-DD end to 23:59:59.999999 UTC."""
        def _parse(s: str, is_end: bool) -> datetime:
            s = s.strip()
            if len(s) == 10:
                dt = datetime.strptime(s, "%Y-%m-%d")
                return dt.replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc) if is_end else dt.replace(tzinfo=timezone.utc)
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            if is_end and dt.hour == 0 and dt.minute == 0 and dt.second == 0 and dt.microsecond == 0:
                dt = dt.replace(hour=23, minute=59, second=59, microsecond=999999)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

        try:
            dt_start, dt_end = _parse(date_range.start, False), _parse(date_range.end, True)
        except Exception as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid date format: {e}")
        if dt_start > dt_end:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Start date ({date_range.start}) cannot be after end date ({date_range.end}).")
        return dt_start, dt_end

    # -----------------------------------------------------------------------
    # Direct API Handlers (Calculations executed in SQL)
    # -----------------------------------------------------------------------

    async def get_funnel(self, db: Session, payload: DashboardFilterRequest) -> FunnelResponse:
        c_start, c_end = self.parse_date_range(payload.current)
        repo = user_adoption_tracker_repository
        return await run_in_threadpool(
            repo.get_funnel_metrics, db, c_start, c_end, payload.markets
        )

    async def get_onboarding(self, db: Session, payload: DashboardFilterRequest) -> OnboardingResponse:
        c_start, c_end = self.parse_date_range(payload.current)
        p_start, p_end = self.parse_date_range(payload.previous)
        repo = user_adoption_tracker_repository
        return await run_in_threadpool(
            repo.get_onboarding_metrics, db, c_start, c_end, p_start, p_end, payload.markets
        )

    async def get_engagement(self, db: Session, payload: DashboardFilterRequest) -> EngagementResponse:
        c_start, c_end = self.parse_date_range(payload.current)
        repo = user_adoption_tracker_repository
        return await run_in_threadpool(
            repo.get_engagement_metrics, db, c_start, c_end, payload.markets
        )

    async def get_adoption(self, db: Session, payload: DashboardFilterRequest) -> AdoptionResponse:
        c_start, c_end = self.parse_date_range(payload.current)
        p_start, p_end = self.parse_date_range(payload.previous)
        repo = user_adoption_tracker_repository
        return await run_in_threadpool(
            repo.get_adoption_metrics, db, c_start, c_end, p_start, p_end, payload.markets
        )


user_adoption_tracker_service = UserAdoptionTrackerService()