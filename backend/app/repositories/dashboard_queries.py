"""
Raw SQL SELECT Query definitions for One-Pager User Adoption Tracker Dashboard KPIs.
Provides pure, copy-pasteable, parameterized SQL queries where all aggregations,
rates, growth rates, and KPI metrics are calculated DIRECTLY in the query itself.

Note: user_details is the master user registry and is NOT filtered by created_at,
start_date, or end_date (it is filtered only by market when a market filter is supplied).

The 4 API Direct Queries:
1. Funnel API Query (Stage 1 Onboarding, Stage 2 Engagement, Stage 3 Adoption rates)
2. Onboarding API Queries (Market breakdown + KPI summary with growth and views)
3. Engagement API Queries (Market breakdown + KPI summary with track-to-publish and exports)
4. Adoption API Queries (Market breakdown + KPI summary with growth, draft-to-publish, and published count)
"""

from datetime import datetime
from typing import Any, Dict, List, Tuple


def _build_market_in_clause(markets: List[str], prefix: str = "m") -> Tuple[str, Dict[str, Any]]:
    """Builds parameterized IN clause for market filtering."""
    if not markets or "ALL" in markets:
        return "", {}
    param_keys = [f"{prefix}_{i}" for i in range(len(markets))]
    placeholders = ", ".join(f":{k}" for k in param_keys)
    params = {k: v for k, v in zip(param_keys, markets)}
    return placeholders, params


# ===========================================================================
# 1. API 1: FUNNEL DIRECT QUERY
# ===========================================================================
def build_funnel_direct_query(
    start_date: datetime,
    end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Funnel API (/api/v1/dashboard/funnel).
    Calculates provisioned user count and Stage 1/2/3 rates directly in SQL:
    - Onboarding Rate = onboarded users / provisioned users * 100
    - Engagement Rate = draft-creator users / provisioned users * 100
    - Adoption Rate = publishing users / provisioned users * 100
    Returns rows for each distinct role and a '__TOTAL__' summary row.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        onb_users AS (
            SELECT DISTINCT
                LOWER(l.user_email) AS email
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :start_date AND :end_date
        ),
        eng_users AS (
            SELECT DISTINCT
                LOWER(a.user_email) AS email
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'DRAFT'
        ),
        adp_users AS (
            SELECT DISTINCT
                LOWER(p.published_by) AS email
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
        ),
        engaged_users AS (
            SELECT DISTINCT email FROM eng_users
            UNION
            SELECT DISTINCT email FROM adp_users
        ),
        user_stages AS (
            SELECT
                p.email,
                p.role,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') THEN p.email END AS rate_email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') AND o.email IS NOT NULL THEN 1 ELSE 0 END AS is_onboarded,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') AND eu.email IS NOT NULL THEN 1 ELSE 0 END AS is_engaged,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') AND a.email IS NOT NULL THEN 1 ELSE 0 END AS is_adopted
            FROM prov_users p
            LEFT JOIN onb_users o ON p.email = o.email
            LEFT JOIN engaged_users eu ON p.email = eu.email
            LEFT JOIN adp_users a ON p.email = a.email
        )
        SELECT
            role,
            COUNT(DISTINCT email) AS prov_count,
            ROUND(100.0 * SUM(is_onboarded) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS onboarding_rate,
            ROUND(100.0 * SUM(is_engaged) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS engagement_rate,
            ROUND(100.0 * SUM(is_adopted) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS adoption_rate
        FROM user_stages
        GROUP BY role

        UNION ALL

        SELECT
            '__TOTAL__' AS role,
            COUNT(DISTINCT email) AS prov_count,
            ROUND(100.0 * SUM(is_onboarded) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS onboarding_rate,
            ROUND(100.0 * SUM(is_engaged) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS engagement_rate,
            ROUND(100.0 * SUM(is_adopted) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS adoption_rate
        FROM user_stages
    """
    return sql.strip(), params


# ===========================================================================
# 2. API 2: ONBOARDING DIRECT QUERIES
# ===========================================================================
def build_onboarding_market_query(
    start_date: datetime,
    end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Onboarding market breakdown (/api/v1/dashboard/onboarding).
    Calculates provisioned users, logged-in active users, and onboarding rate
    per market and role directly in SQL.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                market,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        onb_users AS (
            SELECT DISTINCT
                LOWER(l.user_email) AS email
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :start_date AND :end_date
        ),
        user_mkt_role AS (
            SELECT
                p.market,
                p.role,
                p.email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') THEN p.email END AS rate_email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') AND o.email IS NOT NULL THEN 1 ELSE 0 END AS is_active
            FROM prov_users p
            LEFT JOIN onb_users o ON p.email = o.email
        )
        SELECT
            market,
            role,
            COUNT(DISTINCT email) AS prov_count,
            SUM(is_active) AS active_count,
            ROUND(100.0 * SUM(is_active) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS rate
        FROM user_mkt_role
        GROUP BY market, role

        UNION ALL

        SELECT
            market,
            '__TOTAL__' AS role,
            COUNT(DISTINCT email) AS prov_count,
            SUM(is_active) AS active_count,
            ROUND(100.0 * SUM(is_active) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS rate
        FROM user_mkt_role
        GROUP BY market
        ORDER BY market, role
    """
    return sql.strip(), params


def build_onboarding_kpi_query(
    start_date: datetime,
    end_date: datetime,
    prev_start_date: datetime,
    prev_end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Onboarding KPI Summary (/api/v1/dashboard/onboarding).
    Calculates onboarded users, growth rate (curr vs prev, safe 0.0), and one-pager views
    directly in SQL for both role breakdown and '__TOTAL__'.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date
    params["prev_start_date"] = prev_start_date
    params["prev_end_date"] = prev_end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        curr_onb AS (
            SELECT
                u.role,
                COUNT(DISTINCT u.email) AS curr_count
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :start_date AND :end_date
            GROUP BY u.role
        ),
        prev_onb AS (
            SELECT
                u.role,
                COUNT(DISTINCT u.email) AS prev_count
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :prev_start_date AND :prev_end_date
            GROUP BY u.role
        ),
        views AS (
            SELECT
                u.role,
                COUNT(a.id) AS views_count
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'VIEW'
            GROUP BY u.role
        ),
        all_roles AS (
            SELECT DISTINCT role FROM prov_users
            UNION
            SELECT role FROM curr_onb
            UNION
            SELECT role FROM prev_onb
            UNION
            SELECT role FROM views
        )
        SELECT
            r.role,
            COALESCE(c.curr_count, 0) AS onboarded_count,
            CASE
                WHEN UPPER(r.role) IN ('CSP', 'CBD') THEN
                    CASE
                        WHEN COALESCE(p.prev_count, 0) > 0 THEN
                            ROUND(100.0 * (COALESCE(c.curr_count, 0) - p.prev_count) / p.prev_count, 1)
                        ELSE 0.0
                    END
                ELSE NULL
            END AS growth_rate,
            COALESCE(v.views_count, 0) AS views_count
        FROM all_roles r
        LEFT JOIN curr_onb c ON r.role = c.role
        LEFT JOIN prev_onb p ON r.role = p.role
        LEFT JOIN views v ON r.role = v.role

        UNION ALL

        SELECT
            '__TOTAL__' AS role,
            COALESCE(c_tot.curr_count, 0) AS onboarded_count,
            CASE
                WHEN COALESCE(p_rate.prev_count, 0) > 0 THEN
                    ROUND(100.0 * (COALESCE(c_rate.curr_count, 0) - p_rate.prev_count) / p_rate.prev_count, 1)
                ELSE 0.0
            END AS growth_rate,
            COALESCE(v_tot.views_count, 0) AS views_count
        FROM (
            SELECT COUNT(DISTINCT u.email) AS curr_count
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :start_date AND :end_date
        ) c_tot
        CROSS JOIN (
            SELECT COUNT(DISTINCT u.email) AS curr_count
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :start_date AND :end_date
              AND UPPER(u.role) IN ('CSP', 'CBD')
        ) c_rate
        CROSS JOIN (
            SELECT COUNT(DISTINCT u.email) AS prev_count
            FROM login_log l
            INNER JOIN prov_users u ON LOWER(l.user_email) = u.email
            WHERE l.login_time BETWEEN :prev_start_date AND :prev_end_date
              AND UPPER(u.role) IN ('CSP', 'CBD')
        ) p_rate
        CROSS JOIN (
            SELECT COUNT(a.id) AS views_count
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'VIEW'
        ) v_tot
    """
    return sql.strip(), params


# ===========================================================================
# 3. API 3: ENGAGEMENT DIRECT QUERIES
# ===========================================================================
def build_engagement_market_query(
    start_date: datetime,
    end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Engagement market breakdown (/api/v1/dashboard/engagement).
    Calculates provisioned users, engaged users (draft or published), and engagement rate
    per market and role directly in SQL.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                market,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        draft_users AS (
            SELECT DISTINCT
                LOWER(a.user_email) AS email
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'DRAFT'
        ),
        published_users AS (
            SELECT DISTINCT
                LOWER(p.published_by) AS email
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
        ),
        engaged_users AS (
            SELECT DISTINCT email FROM draft_users
            UNION
            SELECT DISTINCT email FROM published_users
        ),
        user_mkt_role AS (
            SELECT
                p.market,
                p.role,
                p.email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') THEN p.email END AS rate_email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') AND eu.email IS NOT NULL THEN 1 ELSE 0 END AS is_active
            FROM prov_users p
            LEFT JOIN engaged_users eu ON p.email = eu.email
        )
        SELECT
            market,
            role,
            COUNT(DISTINCT email) AS prov_count,
            SUM(is_active) AS active_count,
            ROUND(100.0 * SUM(is_active) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS rate
        FROM user_mkt_role
        GROUP BY market, role

        UNION ALL

        SELECT
            market,
            '__TOTAL__' AS role,
            COUNT(DISTINCT email) AS prov_count,
            SUM(is_active) AS active_count,
            ROUND(100.0 * SUM(is_active) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS rate
        FROM user_mkt_role
        GROUP BY market
        ORDER BY market, role
    """
    return sql.strip(), params


def build_engagement_kpi_query(
    start_date: datetime,
    end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Engagement KPI Summary (/api/v1/dashboard/engagement).
    Calculates engaged users as the union of draft + published users, track-to-publish rate,
    and total exports directly in SQL for both role breakdown and '__TOTAL__'.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        draft_users AS (
            SELECT DISTINCT
                LOWER(a.user_email) AS email
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'DRAFT'
        ),
        published_users AS (
            SELECT DISTINCT
                LOWER(p.published_by) AS email
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
        ),
        engaged_users AS (
            SELECT DISTINCT email FROM draft_users
            UNION
            SELECT DISTINCT email FROM published_users
        ),
        eng_by_role AS (
            SELECT
                u.role,
                COUNT(DISTINCT e.email) AS engaged_count
            FROM engaged_users e
            INNER JOIN prov_users u ON e.email = u.email
            WHERE UPPER(u.role) IN ('CSP', 'CBD')
            GROUP BY u.role
        ),
        pub_pagers AS (
            SELECT
                p.pager_id,
                u.role,
                CASE
                    WHEN (p.track IS NOT NULL AND TRIM(p.track) != '')
                      OR t.pager_id IS NOT NULL THEN 1
                    ELSE 0
                END AS is_tracked
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            LEFT JOIN (
                SELECT DISTINCT pager_id
                FROM action_log
                WHERE UPPER(action) = 'TRACK'
            ) t ON p.pager_id = t.pager_id
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
        ),
        ttp_by_role AS (
            SELECT
                role,
                COUNT(pager_id) AS pub_count,
                SUM(is_tracked) AS tracked_count,
                ROUND(100.0 * SUM(is_tracked) / NULLIF(COUNT(pager_id), 0), 1) AS ttp_rate
            FROM pub_pagers
            WHERE UPPER(role) IN ('CSP', 'CBD')
            GROUP BY role
        ),
        exp_by_role AS (
            SELECT
                u.role,
                COUNT(a.id) AS exports_count
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'EXPORT'
            GROUP BY u.role
        ),
        all_roles AS (
            SELECT DISTINCT role FROM prov_users
            UNION
            SELECT role FROM eng_by_role
            UNION
            SELECT role FROM ttp_by_role
            UNION
            SELECT role FROM exp_by_role
        )
        SELECT
            r.role,
            CASE
                WHEN UPPER(r.role) IN ('CSP', 'CBD') THEN COALESCE(e.engaged_count, 0)
                ELSE 0
            END AS engaged_count,
            t.ttp_rate,
            COALESCE(x.exports_count, 0) AS exports_count
        FROM all_roles r
        LEFT JOIN eng_by_role e ON r.role = e.role
        LEFT JOIN ttp_by_role t ON r.role = t.role
        LEFT JOIN exp_by_role x ON r.role = x.role

        UNION ALL

        SELECT
            '__TOTAL__' AS role,
            COALESCE(e_tot.engaged_count, 0) AS engaged_count,
            t_tot.ttp_rate,
            COALESCE(x_tot.exports_count, 0) AS exports_count
        FROM (
            SELECT COUNT(DISTINCT e.email) AS engaged_count
            FROM engaged_users e
            INNER JOIN prov_users u ON e.email = u.email
            WHERE UPPER(u.role) IN ('CSP', 'CBD')
        ) e_tot
        CROSS JOIN (
            SELECT
                ROUND(100.0 * SUM(is_tracked) / NULLIF(COUNT(pager_id), 0), 1) AS ttp_rate
            FROM pub_pagers
            WHERE UPPER(role) IN ('CSP', 'CBD')
        ) t_tot
        CROSS JOIN (
            SELECT COUNT(a.id) AS exports_count
            FROM action_log a
            INNER JOIN prov_users u ON LOWER(a.user_email) = u.email
            WHERE a.date_time BETWEEN :start_date AND :end_date
              AND UPPER(a.action) = 'EXPORT'
        ) x_tot
    """
    return sql.strip(), params


# ===========================================================================
# 4. API 4: ADOPTION DIRECT QUERIES
# ===========================================================================
def build_adoption_market_query(
    start_date: datetime,
    end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Adoption market breakdown (/api/v1/dashboard/adoption).
    Calculates provisioned users, publishing active users, and adoption rate
    per market and role directly in SQL.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                market,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        adp_users AS (
            SELECT DISTINCT
                LOWER(p.published_by) AS email
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
        ),
        user_mkt_role AS (
            SELECT
                p.market,
                p.role,
                p.email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') THEN p.email END AS rate_email,
                CASE WHEN UPPER(p.role) IN ('CSP', 'CBD') AND a.email IS NOT NULL THEN 1 ELSE 0 END AS is_active
            FROM prov_users p
            LEFT JOIN adp_users a ON p.email = a.email
        )
        SELECT
            market,
            role,
            COUNT(DISTINCT email) AS prov_count,
            SUM(is_active) AS active_count,
            ROUND(100.0 * SUM(is_active) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS rate
        FROM user_mkt_role
        GROUP BY market, role

        UNION ALL

        SELECT
            market,
            '__TOTAL__' AS role,
            COUNT(DISTINCT email) AS prov_count,
            SUM(is_active) AS active_count,
            ROUND(100.0 * SUM(is_active) / NULLIF(COUNT(DISTINCT rate_email), 0), 1) AS rate
        FROM user_mkt_role
        GROUP BY market
        ORDER BY market, role
    """
    return sql.strip(), params


def build_adoption_kpi_query(
    start_date: datetime,
    end_date: datetime,
    prev_start_date: datetime,
    prev_end_date: datetime,
    markets: List[str],
) -> Tuple[str, Dict[str, Any]]:
    """
    Direct SQL query for Adoption KPI Summary (/api/v1/dashboard/adoption).
    Calculates adopted users, growth rate (curr vs prev, safe 0.0), draft-to-publish rate,
    and total published pagers count directly in SQL for both role breakdown and '__TOTAL__'.
    user_details is filtered strictly by market (created_at is not used).
    """
    placeholders, params = _build_market_in_clause(markets)
    market_clause = f"\n            WHERE market IN ({placeholders})" if placeholders else ""
    params["start_date"] = start_date
    params["end_date"] = end_date
    params["prev_start_date"] = prev_start_date
    params["prev_end_date"] = prev_end_date

    sql = f"""
        WITH prov_users AS (
            SELECT
                LOWER(email) AS email,
                COALESCE(role, 'General') AS role
            FROM user_details{market_clause}
        ),
        curr_adp AS (
            SELECT
                u.role,
                COUNT(DISTINCT u.email) AS curr_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
              AND UPPER(u.role) IN ('CSP', 'CBD')
            GROUP BY u.role
        ),
        prev_adp AS (
            SELECT
                u.role,
                COUNT(DISTINCT u.email) AS prev_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :prev_start_date AND :prev_end_date
              AND p.published_by IS NOT NULL
              AND UPPER(u.role) IN ('CSP', 'CBD')
            GROUP BY u.role
        ),
        pub_pagers AS (
            SELECT
                u.role,
                COUNT(DISTINCT p.pager_id) AS pub_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
              AND UPPER(u.role) IN ('CSP', 'CBD')
            GROUP BY u.role
        ),
        draft_pagers AS (
            SELECT
                u.role,
                COUNT(DISTINCT p.pager_id) AS draft_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.created_by) = u.email
            WHERE UPPER(p.status) = 'DRAFT'
              AND (p.created_at <= :end_date OR p.created_at IS NULL)
              AND UPPER(u.role) IN ('CSP', 'CBD')
            GROUP BY u.role
        ),
        all_roles AS (
            SELECT DISTINCT role FROM prov_users
            UNION
            SELECT role FROM curr_adp
            UNION
            SELECT role FROM prev_adp
            UNION
            SELECT role FROM pub_pagers
            UNION
            SELECT role FROM draft_pagers
        ),
        dtp_by_role AS (
            SELECT
                r.role,
                COALESCE(pc.pub_count, 0) AS pub_count,
                COALESCE(dc.draft_count, 0) AS draft_count,
                ROUND(
                    100.0 * COALESCE(pc.pub_count, 0) /
                    NULLIF(COALESCE(pc.pub_count, 0) + COALESCE(dc.draft_count, 0), 0),
                    1
                ) AS dtp_rate
            FROM all_roles r
            LEFT JOIN pub_pagers pc ON r.role = pc.role
            LEFT JOIN draft_pagers dc ON r.role = dc.role
            WHERE UPPER(r.role) IN ('CSP', 'CBD')
        )
        SELECT
            r.role,
            CASE
                WHEN UPPER(r.role) IN ('CSP', 'CBD') THEN COALESCE(c.curr_count, 0)
                ELSE 0
            END AS adopted_count,
            CASE
                WHEN UPPER(r.role) IN ('CSP', 'CBD') THEN
                    CASE
                        WHEN COALESCE(p.prev_count, 0) > 0 THEN
                            ROUND(100.0 * (COALESCE(c.curr_count, 0) - p.prev_count) / p.prev_count, 1)
                        ELSE 0.0
                    END
                ELSE NULL
            END AS growth_rate,
            d.dtp_rate,
            CASE
                WHEN UPPER(r.role) IN ('CSP', 'CBD') THEN COALESCE(pb.pub_count, 0)
                ELSE 0
            END AS published_pagers_count
        FROM all_roles r
        LEFT JOIN curr_adp c ON r.role = c.role
        LEFT JOIN prev_adp p ON r.role = p.role
        LEFT JOIN dtp_by_role d ON r.role = d.role
        LEFT JOIN pub_pagers pb ON r.role = pb.role

        UNION ALL

        SELECT
            '__TOTAL__' AS role,
            COALESCE(c_tot.curr_count, 0) AS adopted_count,
            CASE
                WHEN COALESCE(p_tot.prev_count, 0) > 0 THEN
                    ROUND(100.0 * (COALESCE(c_tot.curr_count, 0) - p_tot.prev_count) / p_tot.prev_count, 1)
                ELSE 0.0
            END AS growth_rate,
            d_tot.dtp_rate,
            COALESCE(pb_tot.pub_count, 0) AS published_pagers_count
        FROM (
            SELECT COUNT(DISTINCT u.email) AS curr_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
              AND UPPER(u.role) IN ('CSP', 'CBD')
        ) c_tot
        CROSS JOIN (
            SELECT COUNT(DISTINCT u.email) AS prev_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :prev_start_date AND :prev_end_date
              AND p.published_by IS NOT NULL
              AND UPPER(u.role) IN ('CSP', 'CBD')
        ) p_tot
        CROSS JOIN (
            SELECT
                ROUND(
                    100.0 * COALESCE(SUM(pc.pub_count), 0) /
                    NULLIF(COALESCE(SUM(pc.pub_count), 0) + COALESCE(SUM(dc.draft_count), 0), 0),
                    1
                ) AS dtp_rate
            FROM (
                SELECT COUNT(DISTINCT p.pager_id) AS pub_count
                FROM pager p
                INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
                WHERE UPPER(p.status) = 'PUBLISHED'
                  AND p.published_at IS NOT NULL
                  AND p.published_at BETWEEN :start_date AND :end_date
                  AND p.published_by IS NOT NULL
                  AND UPPER(u.role) IN ('CSP', 'CBD')
            ) pc
            CROSS JOIN (
                SELECT COUNT(DISTINCT p.pager_id) AS draft_count
                FROM pager p
                INNER JOIN prov_users u ON LOWER(p.created_by) = u.email
                WHERE UPPER(p.status) = 'DRAFT'
                  AND (p.created_at <= :end_date OR p.created_at IS NULL)
                  AND UPPER(u.role) IN ('CSP', 'CBD')
            ) dc
        ) d_tot
        CROSS JOIN (
            SELECT COUNT(DISTINCT p.pager_id) AS pub_count
            FROM pager p
            INNER JOIN prov_users u ON LOWER(p.published_by) = u.email
            WHERE UPPER(p.status) = 'PUBLISHED'
              AND p.published_at IS NOT NULL
              AND p.published_at BETWEEN :start_date AND :end_date
              AND p.published_by IS NOT NULL
              AND UPPER(u.role) IN ('CSP', 'CBD')
        ) pb_tot
    """
    return sql.strip(), params