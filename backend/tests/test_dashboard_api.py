"""
Test suite for One-Pager User Adoption Tracker Dashboard APIs:
- POST /api/v1/dashboard/funnel
- POST /api/v1/dashboard/onboarding
- POST /api/v1/dashboard/engagement
- POST /api/v1/dashboard/adoption
- POST /api/v1/dashboard/coverage
"""

import pytest
from datetime import datetime, timezone
from app.models.user_details import UserDetails
from app.models.login_log import LoginLog
from app.models.action_log import ActionLog
from app.models.pager import Pager
from app.models.coverage_mapping import CoverageMapping
from app.utils.enums import PagerStatus, ScoringMode
from app.utils.helpers import generate_uuid


@pytest.fixture
def seed_dashboard_data(db):
    """Seed sample data matching the dashboard dimensions for testing."""
    # 1. Provisioned Users
    users = [
        UserDetails(email="csp_us_1@example.com", role="CSP", market="US", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="csp_us_2@example.com", role="CSP", market="US", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="cbd_us_1@example.com", role="CBD", market="US", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="gen_us_1@example.com", role="General", market="US", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="csp_nl_1@example.com", role="CSP", market="Netherlands", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="cbd_nl_1@example.com", role="CBD", market="Netherlands", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="csp_be_1@example.com", role="CSP", market="Belgium", created_at=datetime(2026, 8, 1, tzinfo=timezone.utc)),
        UserDetails(email="future_user@example.com", role="CSP", market="US", created_at=datetime(2026, 10, 15, tzinfo=timezone.utc)),
    ]
    for u in users:
        db.merge(u)
    db.commit()

    # 2. Login Logs (Previous & Current periods)
    # Previous period: Aug 2026
    logins_prev = [
        LoginLog(id=generate_uuid(), user_email="csp_us_1@example.com", role="CSP", login_time=datetime(2026, 8, 10, tzinfo=timezone.utc)),
        LoginLog(id=generate_uuid(), user_email="cbd_us_1@example.com", role="CBD", login_time=datetime(2026, 8, 12, tzinfo=timezone.utc)),
    ]
    # Current period: Sep 2026
    logins_curr = [
        LoginLog(id=generate_uuid(), user_email="csp_us_1@example.com", role="CSP", login_time=datetime(2026, 9, 5, tzinfo=timezone.utc)),
        LoginLog(id=generate_uuid(), user_email="csp_us_2@example.com", role="CSP", login_time=datetime(2026, 9, 6, tzinfo=timezone.utc)),
        LoginLog(id=generate_uuid(), user_email="cbd_us_1@example.com", role="CBD", login_time=datetime(2026, 9, 7, tzinfo=timezone.utc)),
        LoginLog(id=generate_uuid(), user_email="gen_us_1@example.com", role="General", login_time=datetime(2026, 9, 8, tzinfo=timezone.utc)),
        LoginLog(id=generate_uuid(), user_email="csp_nl_1@example.com", role="CSP", login_time=datetime(2026, 9, 9, tzinfo=timezone.utc)),
    ]
    for l in logins_prev + logins_curr:
        db.add(l)
    db.commit()

    # 3. Action Logs (Views, Exports, Drafts, Tracks)
    actions = [
        # Views in Sep 2026
        ActionLog(id=generate_uuid(), user_email="csp_us_1@example.com", action="VIEW", date_time=datetime(2026, 9, 5, tzinfo=timezone.utc)),
        ActionLog(id=generate_uuid(), user_email="csp_us_1@example.com", action="VIEW", date_time=datetime(2026, 9, 6, tzinfo=timezone.utc)),
        ActionLog(id=generate_uuid(), user_email="cbd_us_1@example.com", action="VIEW", date_time=datetime(2026, 9, 7, tzinfo=timezone.utc)),
        ActionLog(id=generate_uuid(), user_email="gen_us_1@example.com", action="VIEW", date_time=datetime(2026, 9, 8, tzinfo=timezone.utc)),
        # Exports in Sep 2026
        ActionLog(id=generate_uuid(), user_email="csp_us_1@example.com", action="EXPORT", date_time=datetime(2026, 9, 10, tzinfo=timezone.utc)),
        ActionLog(id=generate_uuid(), user_email="cbd_us_1@example.com", action="EXPORT", date_time=datetime(2026, 9, 11, tzinfo=timezone.utc)),
        # Draft actions in Sep 2026
        ActionLog(id=generate_uuid(), user_email="csp_us_1@example.com", action="DRAFT", date_time=datetime(2026, 9, 12, tzinfo=timezone.utc)),
        ActionLog(id=generate_uuid(), user_email="csp_us_2@example.com", action="DRAFT", date_time=datetime(2026, 9, 13, tzinfo=timezone.utc)),
        ActionLog(id=generate_uuid(), user_email="cbd_us_1@example.com", action="DRAFT", date_time=datetime(2026, 9, 14, tzinfo=timezone.utc)),
    ]
    for a in actions:
        db.add(a)
    db.commit()

    # 4. Pagers (Published and Drafts)
    # Pager 1: Published & Tracked in Sep 2026
    p1_id = generate_uuid()
    p1 = Pager(
        pager_id=p1_id,
        title="US Promo Q3",
        market="US",
        scoring_mode=ScoringMode.UNWEIGHTED,
        status=PagerStatus.PUBLISHED,
        track="Track A",
        created_by="csp_us_1@example.com",
        created_by_role="CSP",
        published_by="csp_us_1@example.com",
        published_at=datetime(2026, 9, 15, tzinfo=timezone.utc),
    )
    # Pager 2: Published without track in Sep 2026
    p2_id = generate_uuid()
    p2 = Pager(
        pager_id=p2_id,
        title="NL Launch Q3",
        market="Netherlands",
        scoring_mode=ScoringMode.UNWEIGHTED,
        status=PagerStatus.PUBLISHED,
        created_by="cbd_nl_1@example.com",
        created_by_role="CBD",
        published_by="cbd_nl_1@example.com",
        published_at=datetime(2026, 9, 16, tzinfo=timezone.utc),
    )
    # Pager 3: Published in Aug 2026 (Previous period)
    p3_id = generate_uuid()
    p3 = Pager(
        pager_id=p3_id,
        title="US Promo Q2",
        market="US",
        scoring_mode=ScoringMode.UNWEIGHTED,
        status=PagerStatus.PUBLISHED,
        created_by="csp_us_1@example.com",
        created_by_role="CSP",
        published_by="csp_us_1@example.com",
        published_at=datetime(2026, 8, 15, tzinfo=timezone.utc),
    )
    # Pager 4: Active Draft
    p4_id = generate_uuid()
    p4 = Pager(
        pager_id=p4_id,
        title="Draft Strategy 2027",
        market="US",
        scoring_mode=ScoringMode.UNWEIGHTED,
        status=PagerStatus.DRAFT,
        created_by="csp_us_2@example.com",
        created_by_role="CSP",
        created_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
    )
    db.add_all([p1, p2, p3, p4])
    db.commit()


COMMON_PAYLOAD = {
    "markets": ["ALL"],
    "current": {
        "start": "2026-09-01",
        "end": "2026-09-30"
    },
    "previous": {
        "start": "2026-08-01",
        "end": "2026-08-31"
    }
}


def test_api_dashboard_funnel(client, seed_dashboard_data):
    """Test POST /api/v1/dashboard/funnel returns flat current-period metrics with role breakdowns."""
    resp = client.post("/api/v1/dashboard/funnel", json=COMMON_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()

    # 7 provisioned users created on or before 2026-09-30 (future_user in Oct is excluded)
    assert data["provisioned_users"]["total"] == 7
    assert data["provisioned_users"]["by_role"]["CSP"] == 4
    assert data["provisioned_users"]["by_role"]["CBD"] == 2
    assert data["provisioned_users"]["by_role"]["General"] == 1

    # Onboarding Rate: 5 distinct logged-in users / 7 provisioned * 100 = 71.4%
    assert data["onboarding_rate"]["total"] == 71.4
    # CSP: 3 logged in (csp_us_1, csp_us_2, csp_nl_1) / 4 provisioned = 75.0%
    assert data["onboarding_rate"]["by_role"]["CSP"] == 75.0
    # CBD: 1 logged in (cbd_us_1) / 2 provisioned = 50.0%
    assert data["onboarding_rate"]["by_role"]["CBD"] == 50.0

    # Engagement Rate: unique users who drafted or published = {csp_us_1, csp_us_2, cbd_us_1, cbd_nl_1} / 6 CSP+CDB users = 66.7%
    assert data["engagement_rate"]["total"] == 66.7
    assert data["engagement_rate"]["by_role"]["CSP"] == 50.0  # 2 / 4
    assert data["engagement_rate"]["by_role"]["CBD"] == 100.0  # 2 / 2

    # Adoption Rate: 2 publishers (csp_us_1, cbd_nl_1) / 7 = 28.6%
    assert data["adoption_rate"]["total"] == 28.6


def test_api_dashboard_onboarding(client, seed_dashboard_data):
    """Test POST /api/v1/dashboard/onboarding returns onboarding metrics and market/role breakdowns."""
    resp = client.post("/api/v1/dashboard/onboarding", json=COMMON_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()

    # Check by_market
    markets = {m["market"]: m for m in data["by_market"]}
    assert "US" in markets
    assert markets["US"]["provisioned_users"] == 4
    assert markets["US"]["active_users"] == 4  # 4 logged in
    assert markets["US"]["rate"] == 100.0
    assert markets["US"]["roles"]["CSP"] == 100.0

    # Check onboarded_users
    assert data["onboarded_users"]["total"] == 5
    assert data["onboarded_users"]["by_role"]["CSP"] == 3
    assert data["onboarded_users"]["by_role"]["CBD"] == 1
    assert data["onboarded_users"]["by_role"]["General"] == 1

    # Check growth rate: 5 current vs 2 previous = (5-2)/2 * 100 = +150.0%
    assert data["onboarded_users_growth_rate"]["total"] == 150.0

    # Check total views: 4 views total (2 CSP, 1 CBD, 1 General)
    assert data["total_one_pager_views"]["total"] == 4
    assert data["total_one_pager_views"]["by_role"]["CSP"] == 2
    assert data["total_one_pager_views"]["by_role"]["CBD"] == 1
    assert data["total_one_pager_views"]["by_role"]["General"] == 1


def test_api_dashboard_engagement(client, seed_dashboard_data):
    """Test POST /api/v1/dashboard/engagement returns engaged users, track-to-publish, exports."""
    resp = client.post("/api/v1/dashboard/engagement", json=COMMON_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()

    # Engaged users: union of draft + published users = {csp_us_1, csp_us_2, cbd_us_1, cbd_nl_1} -> 4 total
    assert data["engaged_users"]["total"] == 4
    assert data["engaged_users"]["by_role"]["CSP"] == 2
    assert data["engaged_users"]["by_role"]["CBD"] == 2

    # Track to publish: 2 published pagers in Sep (p1, p2), 1 tracked (p1) -> 1/2 = 50.0%
    assert data["track_to_publish"]["total"] == 50.0
    assert data["track_to_publish"]["by_role"]["CSP"] == 100.0  # p1 is CSP, tracked
    assert data["track_to_publish"]["by_role"]["CBD"] == 0.0    # p2 is CBD, not tracked

    # Total exports: 2 exports (1 CSP, 1 CBD)
    assert data["total_exports"]["total"] == 2
    assert data["total_exports"]["by_role"]["CSP"] == 1
    assert data["total_exports"]["by_role"]["CBD"] == 1


def test_api_dashboard_adoption(client, seed_dashboard_data):
    """Test POST /api/v1/dashboard/adoption returns adopted users, draft-to-publish, published count."""
    resp = client.post("/api/v1/dashboard/adoption", json=COMMON_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()

    # Adopted users: 2 distinct users published in Sep
    assert data["adopted_users"]["total"] == 2
    assert data["adopted_users"]["by_role"]["CSP"] == 1
    assert data["adopted_users"]["by_role"]["CBD"] == 1

    # Adopted users growth: 2 current vs 1 previous (csp_us_1 in Aug) = (2-1)/1 * 100 = 100.0%
    assert data["adopted_users_growth_rate"]["total"] == 100.0

    # Total published pagers in Sep: 2
    assert data["total_one_pagers_published"]["total"] == 2
    assert data["total_one_pagers_published"]["by_role"]["CSP"] == 1
    assert data["total_one_pagers_published"]["by_role"]["CBD"] == 1

    # Draft to publish: 2 published in Sep, 1 active draft (p4) -> 2 / (1 + 2) * 100 = 66.7%
    assert data["draft_to_publish"]["total"] == 66.7


def test_api_dashboard_market_filter(client, seed_dashboard_data):
    """Test filtering by specific market ['US']."""
    us_payload = {
        "markets": ["US"],
        "current": {
            "start": "2026-09-01",
            "end": "2026-09-30"
        },
        "previous": {
            "start": "2026-08-01",
            "end": "2026-08-31"
        }
    }
    resp = client.post("/api/v1/dashboard/funnel", json=us_payload)
    assert resp.status_code == 200
    data = resp.json()
    # US only has 4 provisioned users
    assert data["provisioned_users"]["total"] == 4

    resp_onb = client.post("/api/v1/dashboard/onboarding", json=us_payload)
    assert resp_onb.status_code == 200
    onb_data = resp_onb.json()
    # Only US in by_market
    assert len(onb_data["by_market"]) == 1
    assert onb_data["by_market"][0]["market"] == "US"


def test_api_dashboard_empty_db_safe_division(client, db):
    """Test dashboard APIs return None (null in JSON) on zero denominators without crashing."""
    empty_payload = {
        "markets": ["ALL"],
        "current": {
            "start": "2025-01-01",
            "end": "2025-01-31"
        },
        "previous": {
            "start": "2024-12-01",
            "end": "2024-12-31"
        }
    }
    # Funnel
    resp1 = client.post("/api/v1/dashboard/funnel", json=empty_payload)
    assert resp1.status_code == 200
    f_data = resp1.json()
    assert f_data["provisioned_users"]["total"] == 0
    assert f_data["onboarding_rate"]["total"] is None
    assert f_data["engagement_rate"]["total"] is None
    assert f_data["adoption_rate"]["total"] is None

    # Onboarding
    resp2 = client.post("/api/v1/dashboard/onboarding", json=empty_payload)
    assert resp2.status_code == 200
    o_data = resp2.json()
    assert o_data["onboarded_users_growth_rate"]["total"] is None

    # Engagement
    resp3 = client.post("/api/v1/dashboard/engagement", json=empty_payload)
    assert resp3.status_code == 200
    e_data = resp3.json()
    assert e_data["track_to_publish"]["total"] is None

    # Adoption
    resp4 = client.post("/api/v1/dashboard/adoption", json=empty_payload)
    assert resp4.status_code == 200
    a_data = resp4.json()
    assert a_data["adopted_users_growth_rate"]["total"] is None
    assert a_data["draft_to_publish"]["total"] is None


def test_api_dashboard_invalid_date_ranges(client):
    """Test validation errors for invalid date inputs."""
    # 1. start > end
    inv_payload = {
        "markets": ["ALL"],
        "current": {
            "start": "2026-09-30",
            "end": "2026-09-01"
        },
        "previous": {
            "start": "2026-08-01",
            "end": "2026-08-31"
        }
    }
    resp = client.post("/api/v1/dashboard/funnel", json=inv_payload)
    assert resp.status_code == 400

    # 2. non-date string
    bad_payload = {
        "markets": ["ALL"],
        "current": {
            "start": "invalid-date",
            "end": "2026-09-30"
        },
        "previous": {
            "start": "2026-08-01",
            "end": "2026-08-31"
        }
    }
    resp2 = client.post("/api/v1/dashboard/funnel", json=bad_payload)
    assert resp2.status_code == 400


def _coverage_pager(**overrides):
    values = {
        "pager_id": generate_uuid(),
        "title": "Coverage pager",
        "market": "US",
        "channel": "Grocery",
        "business_group": "Beauty & Wellbeing",
        "category": "Hair Care",
        "scoring_mode": ScoringMode.UNWEIGHTED,
        "status": PagerStatus.PUBLISHED,
        "pager_type": "retailer",
        "published_by": "csp_us_1@example.com",
        "published_at": datetime(2026, 9, 15, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return Pager(**values)


@pytest.fixture
def seed_coverage_data(db):
    """Small US map: Grocery has Kroger and Giant Eagle. Two categories."""
    mapping = [
        ("channel", "Grocery", "Kroger", 0),
        ("channel", "Grocery", "Giant Eagle", 1),
        ("business_group", "Beauty & Wellbeing", "Hair Care", 0),
        ("business_group", "Beauty & Wellbeing", "Skin Care", 1),
    ]
    for parent_type, parent_value, child_value, sort_order in mapping:
        db.add(
            CoverageMapping(
                market="US",
                parent_type=parent_type,
                parent_value=parent_value,
                child_value=child_value,
                sort_order=sort_order,
            )
        )

    db.add_all(
        [
            _coverage_pager(pager_type="national", retailer=None, year="2026"),
            _coverage_pager(retailer="Kroger", year="2026"),
            _coverage_pager(retailer="Kroger", category="Skin Care", year="2026"),
            _coverage_pager(retailer="Kroger", category="Skin Care", year="2027"),
            _coverage_pager(
                pager_type="national",
                retailer=None,
                category="Skin Care",
                year="2026",
                published_at=datetime(2026, 8, 15, tzinfo=timezone.utc),
            ),
            _coverage_pager(retailer="Walmart", year="2026"),
        ]
    )
    db.commit()


def test_api_dashboard_coverage(client, seed_coverage_data):
    """National hit, retailer hit, blank row, two years in one cell, old date, unmapped pager."""
    resp = client.post("/api/v1/dashboard/coverage", json=COMMON_PAYLOAD)
    assert resp.status_code == 200
    data = resp.json()

    assert len(data["by_market"]) == 1
    us = data["by_market"][0]
    assert us["market"] == "US"
    assert us["channels"] == [
        {"channel": "Grocery", "rows": ["National", "Kroger", "Giant Eagle"]}
    ]
    assert us["business_groups"] == [
        {
            "business_group": "Beauty & Wellbeing",
            "categories": ["Hair Care", "Skin Care"],
        }
    ]

    filled = {(cell["row"], cell["category"]) for cell in us["filled_cells"]}
    assert filled == {
        ("National", "Hair Care"),
        ("Kroger", "Hair Care"),
        ("Kroger", "Skin Care"),
    }
    assert ("Giant Eagle", "Hair Care") not in filled
    assert ("National", "Skin Care") not in filled
    assert us["filled"] == 3
    assert us["possible"] == 6
    assert us["unmapped_count"] == 1