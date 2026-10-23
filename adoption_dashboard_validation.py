"""
Adoption dashboard validation queries for Cloud SQL (PostgreSQL), schema test_stg.

Run one of these on the office laptop:

  1. Cloud SQL Studio
     python adoption_dashboard_validation.py --print-sql > adoption_checks.sql
     Copy ONE block at a time into the editor and run it.
     Change the dates in EXAMPLE_PARAMS below, then print again.
     Empty markets means all markets. Example: --markets "US,Netherlands"

  2. FastAPI / SQLAlchemy
     pip install "sqlalchemy>=2" "psycopg[binary]"
     Start the Cloud SQL Auth Proxy, then:
     set DATABASE_URL=postgresql+psycopg://USER:PASSWORD@127.0.0.1:5432/DBNAME
     python adoption_dashboard_validation.py

     From a route, pass the same JSON the dashboard already posts:

       from adoption_dashboard_validation import run_adoption_validation

       @router.post("/api/v1/dashboard/validation")
       def validate_adoption(payload: dict, db=Depends(get_db)):
           return run_adoption_validation(db, payload)

     payload shape:
       {
         "markets": [],
         "current":  {"start": "2026-09-08", "end": "2026-10-07"},
         "previous": {"start": "2026-08-09", "end": "2026-09-07"}
       }
     markets [] or ["ALL"] means every market.

What this file treats as true
-----------------------------
Emails are matched with LOWER(TRIM(...)) on every join:
  user_details.email
  login_log.user_email
  action_log.user_email
  pager.created_by
  pager.published_by

Role used for CSP / CBD / General is user_details.role, not the role copied
onto login_log, action_log, or pager.created_by_role.
  CSP        or user_type_1 -> CSP
  CBD        or user_type_2 -> CBD
  General    or user_type_3 -> General
  anything else              -> Unknown  (kept visible on purpose)

If one email has several user_details rows, one row is kept:
  CSP beats CBD beats General, then the latest last_updated_at.

Provisioned users: every remaining user_details email. No date filter and no
market filter. That is the "users who have access" number.

Every other metric uses the current period. Growth also uses the previous
period. A date is included through the end of that UTC day.
Market on those metrics is user_details.market of the matched email.
Pass markets only when you want to limit those metrics. Provisioned stays global.

General is marked shown_in_ui = true only for:
  provisioned users, onboarded users, total one-pager views, total exports.
Rates and the other counts still return a General row, with shown_in_ui false,
so you can see the number without mistaking it for a line the UI shows.

Engaged users: distinct created_by on pager rows with status DRAFT and
created_at in the period. A pager that was created and then published is no
longer DRAFT, so that person is not engaged under this definition.
engaged_users_created_any_status is the comparison: created in the period,
status anything except DELETED.

Draft-to-publish, as confirmed: draft pagers / published pagers.
  drafts    = status DRAFT and created_at in the period
  published = status PUBLISHED and published_at in the period
The sheet and the UI hint use a different formula:
  published / (drafts + published).
Both percents are in the draft_to_publish result.

Tracked published pager: status PUBLISHED, published_at in the period, and at
least one pillar.pillar_track or pillar_initiative.initiative_track that is
not null, blank, or 'clear'. pager.track is ignored; the app does not use it.
Track can be set outside the period ("eventually tracked").

Actions counted: VIEW and EXPORT after UPPER(TRIM(action)).
Statuses counted: DRAFT, PUBLISHED, DELETED after UPPER(TRIM(status)).
If query 04 shows different spellings, change the constants below and reprint.

A missing role in a count means that slice has no rows. Rate queries are
different: a provisioned role with no activity is returned as 0.

Query 01 lists column types. If a timestamp column is "timestamp without time
zone", run this once in that studio session before the metric blocks:

  SET TIME ZONE 'UTC';
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import date, datetime
from decimal import Decimal
from typing import Any

SCHEMA = "test_stg"

# Change these if query 04 shows different stored values.
VIEW_ACTION = "VIEW"
EXPORT_ACTION = "EXPORT"
DRAFT_STATUS = "DRAFT"
PUBLISHED_STATUS = "PUBLISHED"
DELETED_STATUS = "DELETED"

# Printed into --print-sql. Last 30 days ending 7 Oct 2026, and the 30 days before.
EXAMPLE_PARAMS = {
    "current_start": "2026-09-08",
    "current_end": "2026-10-07",
    "previous_start": "2026-08-09",
    "previous_end": "2026-09-07",
    "markets_csv": "",
}

if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", SCHEMA):
    raise RuntimeError("SCHEMA must be a plain SQL identifier")


def role_case(column: str) -> str:
    """Map a text role column onto CSP / CBD / General / Unknown."""
    return f"""CASE UPPER(TRIM({column}))
      WHEN 'CSP' THEN 'CSP'
      WHEN 'USER_TYPE_1' THEN 'CSP'
      WHEN 'CBD' THEN 'CBD'
      WHEN 'USER_TYPE_2' THEN 'CBD'
      WHEN 'GENERAL' THEN 'General'
      WHEN 'USER_TYPE_3' THEN 'General'
      ELSE 'Unknown'
    END"""


def email_key(column: str) -> str:
    return f"LOWER(TRIM({column}))"


def period(column: str, start_expr: str, end_expr: str) -> str:
    """Inclusive calendar dates. timestamptz is converted to a UTC date first."""
    casted = f"CAST(({column} AT TIME ZONE 'UTC') AS date)"
    return f"{casted} >= {start_expr} AND {casted} <= {end_expr}"


def market_predicate(market_column: str) -> str:
    return f"""(
      NOT EXISTS (SELECT 1 FROM picked_markets)
      OR {market_column} IN (SELECT market FROM picked_markets)
    )"""


def shown_in_ui(role_expr: str, include_general: bool) -> str:
    general = "TRUE" if include_general else "FALSE"
    return f"""CASE
      WHEN {role_expr} IS NULL THEN TRUE
      WHEN {role_expr} IN ('CSP', 'CBD') THEN TRUE
      WHEN {role_expr} = 'General' AND {general} THEN TRUE
      ELSE FALSE
    END"""


def base_ctes() -> str:
    return f"""params AS (
  SELECT
    CAST(:current_start AS date) AS current_start,
    CAST(:current_end AS date) AS current_end,
    CAST(:previous_start AS date) AS previous_start,
    CAST(:previous_end AS date) AS previous_end,
    CAST(:markets_csv AS text) AS markets_csv
),
picked_markets AS (
  SELECT TRIM(expanded.market_name) AS market
  FROM params
  CROSS JOIN LATERAL (
    SELECT unnest(
      string_to_array(COALESCE(params.markets_csv, ''), ',')
    ) AS market_name
  ) AS expanded
  WHERE TRIM(expanded.market_name) <> ''
),
users AS (
  SELECT DISTINCT ON (email_key)
    email_key,
    market,
    role_group,
    raw_role
  FROM (
    SELECT
      {email_key("email")} AS email_key,
      NULLIF(TRIM(market), '') AS market,
      TRIM(role) AS raw_role,
      {role_case("role")} AS role_group,
      last_updated_at
    FROM {SCHEMA}.user_details
    WHERE email IS NOT NULL
      AND TRIM(email) <> ''
  ) AS sourced
  ORDER BY
    email_key,
    CASE role_group
      WHEN 'CSP' THEN 1
      WHEN 'CBD' THEN 2
      WHEN 'General' THEN 3
      ELSE 4
    END,
    last_updated_at DESC NULLS LAST
)"""


def statement(select_sql: str, extra: str = "", comment: str = "") -> str:
    header = ""
    if comment.strip():
        header = "\n".join(
            f"-- {line}" for line in comment.strip().splitlines()
        ) + "\n"
    extra_sql = f",\n{extra.strip()}\n" if extra.strip() else "\n"
    return f"{header}WITH\n{base_ctes()}{extra_sql}{select_sql.strip()}\n"


def slice_agg(source: str, value_sql: str) -> str:
    return f"""
  SELECT
    CASE
      WHEN GROUPING(market) = 1 AND GROUPING(role_group) = 1 THEN 'total'
      WHEN GROUPING(market) = 1 THEN 'by_role'
      WHEN GROUPING(role_group) = 1 THEN 'by_market'
      ELSE 'by_market_and_role'
    END AS slice,
    market,
    role_group,
    {value_sql} AS value
  FROM {source}
  GROUP BY GROUPING SETS ((), (role_group), (market), (market, role_group))
"""


def period_columns() -> str:
    return """
  params.current_start,
  params.current_end,
  params.previous_start,
  params.previous_end,
  params.markets_csv"""


def display_market(alias: str = "p") -> str:
    return f"""CASE
    WHEN {alias}.slice IN ('by_market', 'by_market_and_role')
      THEN COALESCE({alias}.market, '(blank market)')
    ELSE NULL
  END AS market"""


def display_role(alias: str = "p") -> str:
    return f"""CASE
    WHEN {alias}.slice IN ('by_role', 'by_market_and_role')
      THEN {alias}.role_group
    ELSE NULL
  END AS role_group"""


def order_by(alias: str = "p") -> str:
    return f"""ORDER BY
  CASE {alias}.slice
    WHEN 'total' THEN 1
    WHEN 'by_role' THEN 2
    WHEN 'by_market' THEN 3
    ELSE 4
  END,
  {alias}.market NULLS FIRST,
  {alias}.role_group NULLS FIRST"""


def users_in_filter_cte() -> str:
    return f"""
users_in_filter AS (
  SELECT email_key, market, role_group
  FROM users
  WHERE {market_predicate("market")}
)"""


def spine_count(
    metric: str,
    activity_sql: str,
    include_general: bool,
    comment: str,
    value_sql: str = "COUNT(*)",
) -> str:
    extra = f"""
{users_in_filter_cte()},
activity AS (
  {activity_sql}
),
active_slices AS (
  {slice_agg("activity", value_sql)}
),
spine AS (
  {slice_agg("users_in_filter", "COUNT(*)")}
)"""
    select = f"""
SELECT
  '{metric}' AS metric,
  {period_columns()},
  p.slice,
  {display_market()},
  {display_role()},
  COALESCE(a.value, 0) AS value,
  p.value AS provisioned_users_in_slice,
  {shown_in_ui("p.role_group", include_general)} AS shown_in_ui
FROM spine p
LEFT JOIN active_slices a
  ON a.slice = p.slice
 AND a.market IS NOT DISTINCT FROM p.market
 AND a.role_group IS NOT DISTINCT FROM p.role_group
CROSS JOIN params
{order_by()}"""
    return statement(select, extra, comment)


def spine_growth(
    metric: str,
    current_sql: str,
    previous_sql: str,
    include_general: bool,
    comment: str,
) -> str:
    extra = f"""
{users_in_filter_cte()},
activity_current AS (
  {current_sql}
),
activity_previous AS (
  {previous_sql}
),
current_slices AS (
  {slice_agg("activity_current", "COUNT(*)")}
),
previous_slices AS (
  {slice_agg("activity_previous", "COUNT(*)")}
),
spine AS (
  {slice_agg("users_in_filter", "COUNT(*)")}
)"""
    select = f"""
SELECT
  '{metric}' AS metric,
  {period_columns()},
  p.slice,
  {display_market()},
  {display_role()},
  COALESCE(c.value, 0) AS current_value,
  COALESCE(v.value, 0) AS previous_value,
  CASE
    WHEN COALESCE(v.value, 0) = 0 THEN NULL
    ELSE ROUND(
      100.0 * (COALESCE(c.value, 0) - COALESCE(v.value, 0)) / v.value,
      1
    )
  END AS growth_pct,
  {shown_in_ui("p.role_group", include_general)} AS shown_in_ui
FROM spine p
LEFT JOIN current_slices c
  ON c.slice = p.slice
 AND c.market IS NOT DISTINCT FROM p.market
 AND c.role_group IS NOT DISTINCT FROM p.role_group
LEFT JOIN previous_slices v
  ON v.slice = p.slice
 AND v.market IS NOT DISTINCT FROM p.market
 AND v.role_group IS NOT DISTINCT FROM p.role_group
CROSS JOIN params
{order_by()}"""
    return statement(select, extra, comment)


def spine_rate(metric: str, activity_sql: str, comment: str) -> str:
    """active users / provisioned users. Two denominators, so a market filter is obvious."""
    extra = f"""
{users_in_filter_cte()},
activity AS (
  {activity_sql}
),
active_slices AS (
  {slice_agg("activity", "COUNT(*)")}
),
spine AS (
  {slice_agg("users_in_filter", "COUNT(*)")}
),
spine_all_markets AS (
  {slice_agg("users", "COUNT(*)")}
)"""
    select = f"""
SELECT
  '{metric}' AS metric,
  {period_columns()},
  p.slice,
  {display_market()},
  {display_role()},
  COALESCE(a.value, 0) AS active_users,
  p.value AS provisioned_matching_filter,
  ROUND(
    100.0 * COALESCE(a.value, 0) / NULLIF(p.value, 0),
    1
  ) AS rate_matching_filter_pct,
  g.value AS provisioned_ignoring_market_filter,
  ROUND(
    100.0 * COALESCE(a.value, 0) / NULLIF(g.value, 0),
    1
  ) AS rate_ignoring_market_filter_pct,
  {shown_in_ui("p.role_group", False)} AS shown_in_ui
FROM spine p
LEFT JOIN active_slices a
  ON a.slice = p.slice
 AND a.market IS NOT DISTINCT FROM p.market
 AND a.role_group IS NOT DISTINCT FROM p.role_group
LEFT JOIN spine_all_markets g
  ON g.slice = p.slice
 AND g.market IS NOT DISTINCT FROM p.market
 AND g.role_group IS NOT DISTINCT FROM p.role_group
CROSS JOIN params
{order_by()}"""
    return statement(select, extra, comment)


def logins(start: str, end: str) -> str:
    return f"""
  SELECT DISTINCT u.email_key, u.market, u.role_group
  FROM {SCHEMA}.login_log AS src
  JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  CROSS JOIN params
  WHERE src.user_email IS NOT NULL
    AND TRIM(src.user_email) <> ''
    AND {period("src.login_time", start, end)}
    AND {market_predicate("u.market")}
"""


def draft_users(start: str, end: str) -> str:
    return f"""
  SELECT DISTINCT u.email_key, u.market, u.role_group
  FROM {SCHEMA}.pager AS src
  JOIN users u
    ON u.email_key = {email_key("src.created_by")}
  CROSS JOIN params
  WHERE UPPER(TRIM(src.status)) = '{DRAFT_STATUS}'
    AND src.created_at IS NOT NULL
    AND {period("src.created_at", start, end)}
    AND {market_predicate("u.market")}
"""


def created_users_any_status(start: str, end: str) -> str:
    return f"""
  SELECT DISTINCT u.email_key, u.market, u.role_group
  FROM {SCHEMA}.pager AS src
  JOIN users u
    ON u.email_key = {email_key("src.created_by")}
  CROSS JOIN params
  WHERE src.created_at IS NOT NULL
    AND UPPER(TRIM(COALESCE(src.status, ''))) <> '{DELETED_STATUS}'
    AND {period("src.created_at", start, end)}
    AND {market_predicate("u.market")}
"""


def publishers(start: str, end: str) -> str:
    return f"""
  SELECT DISTINCT u.email_key, u.market, u.role_group
  FROM {SCHEMA}.pager AS src
  JOIN users u
    ON u.email_key = {email_key("src.published_by")}
  CROSS JOIN params
  WHERE UPPER(TRIM(src.status)) = '{PUBLISHED_STATUS}'
    AND src.published_at IS NOT NULL
    AND {period("src.published_at", start, end)}
    AND {market_predicate("u.market")}
"""


def action_rows(action: str, start: str, end: str) -> str:
    return f"""
  SELECT u.email_key, u.market, u.role_group
  FROM {SCHEMA}.action_log AS src
  JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  CROSS JOIN params
  WHERE UPPER(TRIM(src.action)) = '{action}'
    AND src.date_time IS NOT NULL
    AND {period("src.date_time", start, end)}
    AND {market_predicate("u.market")}
"""


def published_pager_rows(start: str, end: str) -> str:
    return f"""
  SELECT CAST(src.pager_id AS text) AS pager_id, u.market, u.role_group
  FROM {SCHEMA}.pager AS src
  JOIN users u
    ON u.email_key = {email_key("src.published_by")}
  CROSS JOIN params
  WHERE UPPER(TRIM(src.status)) = '{PUBLISHED_STATUS}'
    AND src.published_at IS NOT NULL
    AND {period("src.published_at", start, end)}
    AND {market_predicate("u.market")}
"""


def draft_pager_rows(start: str, end: str) -> str:
    return f"""
  SELECT CAST(src.pager_id AS text) AS pager_id, u.market, u.role_group
  FROM {SCHEMA}.pager AS src
  JOIN users u
    ON u.email_key = {email_key("src.created_by")}
  CROSS JOIN params
  WHERE UPPER(TRIM(src.status)) = '{DRAFT_STATUS}'
    AND src.created_at IS NOT NULL
    AND {period("src.created_at", start, end)}
    AND {market_predicate("u.market")}
"""


def tracked_cte() -> str:
    return f"""
tracked AS (
  SELECT DISTINCT CAST(pager_id AS text) AS pager_id
  FROM (
    SELECT pager_id
    FROM {SCHEMA}.pillar
    WHERE pillar_track IS NOT NULL
      AND TRIM(CAST(pillar_track AS text)) <> ''
      AND UPPER(TRIM(CAST(pillar_track AS text))) <> 'CLEAR'
    UNION
    SELECT pager_id
    FROM {SCHEMA}.pillar_initiative
    WHERE initiative_track IS NOT NULL
      AND TRIM(CAST(initiative_track AS text)) <> ''
      AND UPPER(TRIM(CAST(initiative_track AS text))) <> 'CLEAR'
  ) AS tracks
)"""


CURRENT = ("params.current_start", "params.current_end")
PREVIOUS = ("params.previous_start", "params.previous_end")


def build_queries() -> list[tuple[str, str]]:
    current_start, current_end = CURRENT
    previous_start, previous_end = PREVIOUS
    queries: list[tuple[str, str]] = []

    queries.append(
        (
            "01_diag_column_types",
            f"""
SELECT table_name, column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_schema = '{SCHEMA}'
  AND table_name IN (
    'user_details',
    'login_log',
    'action_log',
    'pager',
    'pager_log',
    'pillar',
    'pillar_initiative'
  )
ORDER BY table_name, ordinal_position
""",
        )
    )

    queries.append(
        (
            "02_diag_raw_role_values",
            f"""
-- Every stored role spelling. CBD missing here means the word CBD is not in that table.
SELECT 'user_details' AS source, TRIM(role) AS raw_role, COUNT(*) AS rows
FROM {SCHEMA}.user_details
GROUP BY 1, 2
UNION ALL
SELECT 'login_log', TRIM(role), COUNT(*)
FROM {SCHEMA}.login_log
GROUP BY 1, 2
UNION ALL
SELECT 'action_log', TRIM(role), COUNT(*)
FROM {SCHEMA}.action_log
GROUP BY 1, 2
UNION ALL
SELECT 'pager.created_by_role', TRIM(created_by_role), COUNT(*)
FROM {SCHEMA}.pager
GROUP BY 1, 2
ORDER BY 1, 3 DESC
""",
        )
    )

    queries.append(
        (
            "03_diag_actions_and_pager_status",
            f"""
-- If VIEW / EXPORT / DRAFT / PUBLISHED are not in this list, change the constants at the top of the Python file.
SELECT 'action_log.action' AS kind, UPPER(TRIM(action)) AS value, COUNT(*) AS rows
FROM {SCHEMA}.action_log
GROUP BY 1, 2
UNION ALL
SELECT 'pager.status', UPPER(TRIM(status)), COUNT(*)
FROM {SCHEMA}.pager
GROUP BY 1, 2
ORDER BY 1, 3 DESC
""",
        )
    )

    queries.append(
        (
            "04_diag_track_values",
            f"""
-- pager.track is listed only so you can see it. The track-to-publish metric does not use it.
SELECT 'pager.track' AS source, TRIM(CAST(track AS text)) AS track_value, COUNT(*) AS rows
FROM {SCHEMA}.pager
GROUP BY 1, 2
UNION ALL
SELECT 'pillar.pillar_track', TRIM(CAST(pillar_track AS text)), COUNT(*)
FROM {SCHEMA}.pillar
GROUP BY 1, 2
UNION ALL
SELECT 'pillar_initiative.initiative_track', TRIM(CAST(initiative_track AS text)), COUNT(*)
FROM {SCHEMA}.pillar_initiative
GROUP BY 1, 2
ORDER BY 1, 3 DESC
""",
        )
    )

    queries.append(
        (
            "05_diag_email_case_variants",
            f"""
-- Same inbox stored with more than one spelling. Metric queries match these with LOWER(TRIM).
SELECT 'user_details.email' AS source,
       {email_key("email")} AS email_key,
       COUNT(DISTINCT email) AS spellings,
       STRING_AGG(DISTINCT email, ' | ' ORDER BY email) AS raw_values
FROM {SCHEMA}.user_details
WHERE email IS NOT NULL AND TRIM(email) <> ''
GROUP BY 1, 2
HAVING COUNT(DISTINCT email) > 1
UNION ALL
SELECT 'login_log.user_email',
       {email_key("user_email")},
       COUNT(DISTINCT user_email),
       STRING_AGG(DISTINCT user_email, ' | ' ORDER BY user_email)
FROM {SCHEMA}.login_log
WHERE user_email IS NOT NULL AND TRIM(user_email) <> ''
GROUP BY 1, 2
HAVING COUNT(DISTINCT user_email) > 1
UNION ALL
SELECT 'action_log.user_email',
       {email_key("user_email")},
       COUNT(DISTINCT user_email),
       STRING_AGG(DISTINCT user_email, ' | ' ORDER BY user_email)
FROM {SCHEMA}.action_log
WHERE user_email IS NOT NULL AND TRIM(user_email) <> ''
GROUP BY 1, 2
HAVING COUNT(DISTINCT user_email) > 1
UNION ALL
SELECT 'pager.created_by',
       {email_key("created_by")},
       COUNT(DISTINCT created_by),
       STRING_AGG(DISTINCT created_by, ' | ' ORDER BY created_by)
FROM {SCHEMA}.pager
WHERE created_by IS NOT NULL AND TRIM(created_by) <> ''
GROUP BY 1, 2
HAVING COUNT(DISTINCT created_by) > 1
UNION ALL
SELECT 'pager.published_by',
       {email_key("published_by")},
       COUNT(DISTINCT published_by),
       STRING_AGG(DISTINCT published_by, ' | ' ORDER BY published_by)
FROM {SCHEMA}.pager
WHERE published_by IS NOT NULL AND TRIM(published_by) <> ''
GROUP BY 1, 2
HAVING COUNT(DISTINCT published_by) > 1
ORDER BY 1, 3 DESC
""",
        )
    )

    queries.append(
        (
            "06_diag_duplicate_user_emails",
            f"""
-- More than one user_details row for one inbox. Metrics keep a single role: CSP, then CBD, then General.
SELECT
  {email_key("email")} AS email_key,
  COUNT(*) AS rows,
  STRING_AGG(DISTINCT TRIM(role), ' | ') AS roles,
  STRING_AGG(DISTINCT email, ' | ') AS spellings
FROM {SCHEMA}.user_details
WHERE email IS NOT NULL AND TRIM(email) <> ''
GROUP BY 1
HAVING COUNT(*) > 1
ORDER BY rows DESC, email_key
""",
        )
    )

    queries.append(
        (
            "07_diag_event_role_vs_user_details",
            statement(
                f"""
SELECT *
FROM compared
ORDER BY source, events DESC, event_role, user_details_role
""",
                f"""
compared AS (
  SELECT
    'login_log' AS source,
    {role_case("src.role")} AS event_role,
    COALESCE(u.role_group, '(no user_details match)') AS user_details_role,
    COUNT(*) AS events,
    COUNT(DISTINCT {email_key("src.user_email")}) AS emails
  FROM {SCHEMA}.login_log AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  CROSS JOIN params
  WHERE src.login_time IS NOT NULL
    AND {period("src.login_time", current_start, current_end)}
  GROUP BY 1, 2, 3

  UNION ALL

  SELECT
    'action_log',
    {role_case("src.role")},
    COALESCE(u.role_group, '(no user_details match)'),
    COUNT(*),
    COUNT(DISTINCT {email_key("src.user_email")})
  FROM {SCHEMA}.action_log AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  CROSS JOIN params
  WHERE src.date_time IS NOT NULL
    AND {period("src.date_time", current_start, current_end)}
  GROUP BY 1, 2, 3

  UNION ALL

  SELECT
    'pager.created_by_role',
    {role_case("src.created_by_role")},
    COALESCE(u.role_group, '(no user_details match)'),
    COUNT(*),
    COUNT(DISTINCT {email_key("src.created_by")})
  FROM {SCHEMA}.pager AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.created_by")}
  CROSS JOIN params
  WHERE src.created_at IS NOT NULL
    AND (
      {period("src.created_at", current_start, current_end)}
      OR (
        src.published_at IS NOT NULL
        AND {period("src.published_at", current_start, current_end)}
      )
    )
  GROUP BY 1, 2, 3
)
""",
                "Current period only. event_role is the role stored on the row. "
                "user_details_role is the role used by the metric queries. "
                "A CBD user_details_role with a different event_role is the CBD gap.",
            ),
        )
    )

    queries.append(
        (
            "08_diag_unmatched_email_summary",
            statement(
                """
SELECT source, event_rows, emails
FROM unmatched
ORDER BY source
""",
                f"""
unmatched AS (
  SELECT
    'login_log' AS source,
    COUNT(*) AS event_rows,
    COUNT(DISTINCT {email_key("src.user_email")}) AS emails
  FROM {SCHEMA}.login_log AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  WHERE src.user_email IS NOT NULL
    AND TRIM(src.user_email) <> ''
    AND u.email_key IS NULL

  UNION ALL

  SELECT
    'action_log',
    COUNT(*),
    COUNT(DISTINCT {email_key("src.user_email")})
  FROM {SCHEMA}.action_log AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  WHERE src.user_email IS NOT NULL
    AND TRIM(src.user_email) <> ''
    AND u.email_key IS NULL

  UNION ALL

  SELECT
    'pager.created_by',
    COUNT(*),
    COUNT(DISTINCT {email_key("src.created_by")})
  FROM {SCHEMA}.pager AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.created_by")}
  WHERE src.created_by IS NOT NULL
    AND TRIM(src.created_by) <> ''
    AND u.email_key IS NULL

  UNION ALL

  SELECT
    'pager.published_by',
    COUNT(*),
    COUNT(DISTINCT {email_key("src.published_by")})
  FROM {SCHEMA}.pager AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.published_by")}
  WHERE src.published_by IS NOT NULL
    AND TRIM(src.published_by) <> ''
    AND u.email_key IS NULL
)
""",
                "Emails that never join user_details, even after LOWER(TRIM). "
                "Those events are left out of every metric.",
            ),
        )
    )

    queries.append(
        (
            "09_diag_user_market_vs_activity_market",
            statement(
                """
SELECT *
FROM compared
ORDER BY source, rows DESC
""",
                f"""
compared AS (
  SELECT
    'pager' AS source,
    COALESCE(u.market, '(no user_details match)') AS user_details_market,
    COALESCE(NULLIF(TRIM(src.market), ''), '(blank)') AS activity_market,
    COUNT(*) AS rows
  FROM {SCHEMA}.pager AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.created_by")}
  GROUP BY 1, 2, 3

  UNION ALL

  SELECT
    'action_log',
    COALESCE(u.market, '(no user_details match)'),
    COALESCE(NULLIF(TRIM(src.market), ''), '(blank)'),
    COUNT(*)
  FROM {SCHEMA}.action_log AS src
  LEFT JOIN users u
    ON u.email_key = {email_key("src.user_email")}
  GROUP BY 1, 2, 3
)
""",
                "Metric charts use user_details.market. "
                "This shows where that differs from pager.market or action_log.market.",
            ),
        )
    )

    queries.append(
        (
            "10_diag_pager_status_in_period",
            statement(
                """
SELECT 'created_at in current period' AS window, status, pagers
FROM created_status
UNION ALL
SELECT 'published_at in current period', status, pagers
FROM published_status
ORDER BY 1, 3 DESC
""",
                f"""
created_status AS (
  SELECT UPPER(TRIM(src.status)) AS status, COUNT(*) AS pagers
  FROM {SCHEMA}.pager AS src
  CROSS JOIN params
  WHERE src.created_at IS NOT NULL
    AND {period("src.created_at", current_start, current_end)}
  GROUP BY 1
),
published_status AS (
  SELECT UPPER(TRIM(src.status)) AS status, COUNT(*) AS pagers
  FROM {SCHEMA}.pager AS src
  CROSS JOIN params
  WHERE src.published_at IS NOT NULL
    AND {period("src.published_at", current_start, current_end)}
  GROUP BY 1
)
""",
                "Published pagers whose status is now ARCHIVED or DELETED are not in the published metrics. "
                "Drafts that were later published are not in the DRAFT metrics.",
            ),
        )
    )

    queries.append(
        (
            "11_provisioned_users",
            statement(
                f"""
SELECT
  'provisioned_users' AS metric,
  {period_columns()},
  p.slice,
  {display_market()},
  {display_role()},
  p.value AS provisioned_users,
  {shown_in_ui("p.role_group", True)} AS shown_in_ui
FROM slices p
CROSS JOIN params
{order_by()}
""",
                f"""
slices AS (
  {slice_agg("users", "COUNT(*)")}
)
""",
                "All users with access. No date filter and no market filter, even if markets_csv is set. "
                "Total includes Unknown roles. The Unknown by_role row shows how many.",
            ),
        )
    )

    queries.append(
        (
            "12_onboarded_users",
            spine_count(
                "onboarded_users",
                logins(*CURRENT),
                True,
                "Distinct users with at least one login_log row in the current period. "
                "Role and market come from user_details. General is shown in the UI.",
            ),
        )
    )

    queries.append(
        (
            "13_onboarded_users_growth",
            spine_growth(
                "onboarded_users_growth",
                logins(*CURRENT),
                logins(*PREVIOUS),
                False,
                "growth_pct = (current - previous) / previous * 100. "
                "Null when the previous period is 0. "
                "The total includes every role. The UI role line is CSP and CBD only.",
            ),
        )
    )

    queries.append(
        (
            "14_onboarding_rate",
            spine_rate(
                "onboarding_rate",
                logins(*CURRENT),
                "Onboarded users / provisioned users * 100. "
                "rate_matching_filter_pct uses provisioned users inside the market filter. "
                "rate_ignoring_market_filter_pct keeps the global provisioned denominator. "
                "With no market filter the two rates match. "
                "A provisioned role with no logins is 0, not a missing row.",
            ),
        )
    )

    queries.append(
        (
            "15_total_one_pager_views",
            spine_count(
                "total_one_pager_views",
                action_rows(VIEW_ACTION, *CURRENT),
                True,
                f"Count of action_log rows whose action is {VIEW_ACTION}, not distinct users. "
                "General is shown in the UI.",
            ),
        )
    )

    queries.append(
        (
            "16_engaged_users_current_drafts",
            spine_count(
                "engaged_users_current_drafts",
                draft_users(*CURRENT),
                False,
                "Distinct created_by where pager.status is DRAFT and created_at is in the period. "
                "Publishing the pager removes it from this count.",
            ),
        )
    )

    queries.append(
        (
            "17_engaged_users_created_any_status",
            spine_count(
                "engaged_users_created_any_status",
                created_users_any_status(*CURRENT),
                False,
                "Comparison only. Distinct created_by for pagers created in the period "
                "whose status is not DELETED, including later PUBLISHED or ARCHIVED. "
                "Use this when a create-then-publish does not show under query 16.",
            ),
        )
    )

    queries.append(
        (
            "18_engagement_rate_current_drafts",
            spine_rate(
                "engagement_rate_current_drafts",
                draft_users(*CURRENT),
                "Draft creators from query 16 / provisioned users * 100.",
            ),
        )
    )

    queries.append(
        (
            "19_engagement_rate_created_any_status",
            spine_rate(
                "engagement_rate_created_any_status",
                created_users_any_status(*CURRENT),
                "Comparison only. Creators from query 17 / provisioned users * 100.",
            ),
        )
    )

    queries.append(
        (
            "20_track_to_publish",
            statement(
                f"""
SELECT
  'track_to_publish' AS metric,
  {period_columns()},
  p.slice,
  {display_market()},
  {display_role()},
  COALESCE(a.published_pagers, 0) AS published_pagers,
  COALESCE(a.tracked_pagers, 0) AS tracked_pagers,
  ROUND(
    100.0 * COALESCE(a.tracked_pagers, 0) / NULLIF(a.published_pagers, 0),
    1
  ) AS track_to_publish_pct,
  {shown_in_ui("p.role_group", False)} AS shown_in_ui
FROM spine p
LEFT JOIN published_slices a
  ON a.slice = p.slice
 AND a.market IS NOT DISTINCT FROM p.market
 AND a.role_group IS NOT DISTINCT FROM p.role_group
CROSS JOIN params
{order_by()}
""",
                f"""
{tracked_cte()},
{users_in_filter_cte()},
published_rows AS (
  SELECT
    rows.pager_id,
    rows.market,
    rows.role_group,
    CASE WHEN tracked.pager_id IS NOT NULL THEN 1 ELSE 0 END AS is_tracked
  FROM (
    {published_pager_rows(*CURRENT)}
  ) AS rows
  LEFT JOIN tracked
    ON tracked.pager_id = rows.pager_id
),
published_slices AS (
  SELECT
    CASE
      WHEN GROUPING(market) = 1 AND GROUPING(role_group) = 1 THEN 'total'
      WHEN GROUPING(market) = 1 THEN 'by_role'
      WHEN GROUPING(role_group) = 1 THEN 'by_market'
      ELSE 'by_market_and_role'
    END AS slice,
    market,
    role_group,
    COUNT(DISTINCT pager_id) AS published_pagers,
    COUNT(DISTINCT pager_id) FILTER (WHERE is_tracked = 1) AS tracked_pagers
  FROM published_rows
  GROUP BY GROUPING SETS ((), (role_group), (market), (market, role_group))
),
spine AS (
  {slice_agg("users_in_filter", "COUNT(*)")}
)
""",
                "Published pagers in the period that have any non-clear pillar or initiative track, "
                "divided by published pagers in the period. Role is the publisher's user_details role. "
                "pager.track is not used.",
            ),
        )
    )

    queries.append(
        (
            "21_total_exports",
            spine_count(
                "total_exports",
                action_rows(EXPORT_ACTION, *CURRENT),
                True,
                f"Count of action_log rows whose action is {EXPORT_ACTION}. General is shown in the UI.",
            ),
        )
    )

    queries.append(
        (
            "22_adopted_users",
            spine_count(
                "adopted_users",
                publishers(*CURRENT),
                False,
                "Distinct published_by where status is PUBLISHED and published_at is in the period.",
            ),
        )
    )

    queries.append(
        (
            "23_adopted_users_growth",
            spine_growth(
                "adopted_users_growth",
                publishers(*CURRENT),
                publishers(*PREVIOUS),
                False,
                "Growth of distinct publishers. Null when the previous period has 0.",
            ),
        )
    )

    queries.append(
        (
            "24_adoption_rate",
            spine_rate(
                "adoption_rate",
                publishers(*CURRENT),
                "Publishers / provisioned users * 100.",
            ),
        )
    )

    queries.append(
        (
            "25_total_one_pagers_published",
            spine_count(
                "total_one_pagers_published",
                published_pager_rows(*CURRENT),
                False,
                "Count of published pagers, not distinct users. "
                "Role and market are the publisher's user_details values.",
                value_sql="COUNT(DISTINCT pager_id)",
            ),
        )
    )

    queries.append(
        (
            "26_draft_to_publish",
            statement(
                f"""
SELECT
  'draft_to_publish' AS metric,
  {period_columns()},
  p.slice,
  {display_market()},
  {display_role()},
  COALESCE(d.value, 0) AS draft_pagers,
  COALESCE(pub.value, 0) AS published_pagers,
  ROUND(
    100.0 * COALESCE(d.value, 0) / NULLIF(pub.value, 0),
    1
  ) AS drafts_divided_by_published_pct,
  ROUND(
    100.0 * COALESCE(pub.value, 0)
      / NULLIF(COALESCE(d.value, 0) + COALESCE(pub.value, 0), 0),
    1
  ) AS sheet_published_over_drafts_plus_published_pct,
  {shown_in_ui("p.role_group", False)} AS shown_in_ui
FROM spine p
LEFT JOIN draft_slices d
  ON d.slice = p.slice
 AND d.market IS NOT DISTINCT FROM p.market
 AND d.role_group IS NOT DISTINCT FROM p.role_group
LEFT JOIN published_slices pub
  ON pub.slice = p.slice
 AND pub.market IS NOT DISTINCT FROM p.market
 AND pub.role_group IS NOT DISTINCT FROM p.role_group
CROSS JOIN params
{order_by()}
""",
                f"""
{users_in_filter_cte()},
draft_rows AS (
  {draft_pager_rows(*CURRENT)}
),
published_rows AS (
  SELECT CAST(src.pager_id AS text) AS pager_id, u.market, u.role_group
  FROM {SCHEMA}.pager AS src
  JOIN users u
    ON u.email_key = {email_key("src.published_by")}
  CROSS JOIN params
  WHERE UPPER(TRIM(src.status)) = '{PUBLISHED_STATUS}'
    AND src.published_at IS NOT NULL
    AND {period("src.published_at", current_start, current_end)}
    AND {market_predicate("u.market")}
),
draft_slices AS (
  {slice_agg("draft_rows", "COUNT(DISTINCT pager_id)")}
),
published_slices AS (
  {slice_agg("published_rows", "COUNT(DISTINCT pager_id)")}
),
spine AS (
  {slice_agg("users_in_filter", "COUNT(*)")}
)
""",
                "drafts_divided_by_published_pct is the formula you confirmed: drafts / published. "
                "sheet_published_over_drafts_plus_published_pct is the sheet and the current UI hint. "
                "Drafts use created_by and created_at. Published uses published_by and published_at. "
                "A pager created and then published is only on the published side.",
            ),
        )
    )

    return queries


def self_check(queries: list[tuple[str, str]]) -> None:
    names = [name for name, _ in queries]
    if len(names) != len(set(names)):
        raise RuntimeError("Duplicate query name")
    for name, sql in queries:
        if "::" in sql:
            raise RuntimeError(
                f"{name} contains '::'. Use CAST(... AS ...) so SQLAlchemy binds keep working."
            )


def as_studio_sql(sql: str, params: dict[str, str]) -> str:
    rendered = sql
    for key in sorted(params, key=len, reverse=True):
        rendered = rendered.replace(f":{key}", f"'{params[key]}'")
    return rendered


def filters_to_params(payload: dict[str, Any]) -> dict[str, str]:
    """Accept the dashboard POST body. [] and ['ALL'] both mean every market."""
    markets = payload.get("markets") or []
    if any(str(item).strip().upper() == "ALL" for item in markets):
        names: list[str] = []
    else:
        names = [str(item).strip() for item in markets if str(item).strip()]
    return {
        "current_start": str(payload["current"]["start"])[:10],
        "current_end": str(payload["current"]["end"])[:10],
        "previous_start": str(payload["previous"]["start"])[:10],
        "previous_end": str(payload["previous"]["end"])[:10],
        "markets_csv": ",".join(names),
    }


def json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return str(value)


def run_adoption_validation(db: Any, payload: dict[str, Any]) -> dict[str, Any]:
    """
    Run every query. db is a SQLAlchemy Session or Connection.
    One failed query is returned under that name as {"error": "..."} and does not stop the rest.
    The session is rolled back after a failure so PostgreSQL will run the next query.
    """
    from sqlalchemy import text

    params = filters_to_params(payload)
    queries = build_queries()
    self_check(queries)
    try:
        db.execute(text("SET TIME ZONE 'UTC'"))
    except Exception:
        rollback = getattr(db, "rollback", None)
        if callable(rollback):
            rollback()

    results: dict[str, Any] = {"params": params, "queries": {}}
    for name, sql in queries:
        try:
            rows = db.execute(text(sql), params)
            results["queries"][name] = [dict(row) for row in rows.mappings()]
        except Exception as exc:
            results["queries"][name] = [{"error": f"{type(exc).__name__}: {exc}"}]
            rollback = getattr(db, "rollback", None)
            if callable(rollback):
                rollback()
    return results


def print_sql(queries: list[tuple[str, str]], params: dict[str, str]) -> None:
    print("-- Adoption dashboard validation SQL")
    print("-- Run ONE named block at a time in Cloud SQL Studio.")
    print("-- Dates and markets are already filled from EXAMPLE_PARAMS / the CLI.")
    print("-- If query 01 shows timestamp without time zone, run this first in the session:")
    print("-- SET TIME ZONE 'UTC';")
    print()
    for name, sql in queries:
        print(f"-- ===== {name} =====")
        print(as_studio_sql(sql, params).rstrip() + ";")
        print()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--print-sql", action="store_true", help="Write studio SQL to stdout")
    parser.add_argument("--list", action="store_true", help="Print query names and exit")
    parser.add_argument("--only", default="", help="Comma-separated query names to include")
    parser.add_argument("--current-start", default=EXAMPLE_PARAMS["current_start"])
    parser.add_argument("--current-end", default=EXAMPLE_PARAMS["current_end"])
    parser.add_argument("--previous-start", default=EXAMPLE_PARAMS["previous_start"])
    parser.add_argument("--previous-end", default=EXAMPLE_PARAMS["previous_end"])
    parser.add_argument(
        "--markets",
        default=EXAMPLE_PARAMS["markets_csv"],
        help="Comma-separated market names. Empty means all markets.",
    )
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", ""),
        help="Defaults to the DATABASE_URL environment variable",
    )
    args = parser.parse_args(argv)

    queries = build_queries()
    self_check(queries)
    selected = {item.strip() for item in args.only.split(",") if item.strip()}
    if selected:
        known = {name for name, _ in queries}
        missing = selected - known
        if missing:
            print("Unknown query names: " + ", ".join(sorted(missing)), file=sys.stderr)
            return 2
        queries = [item for item in queries if item[0] in selected]

    if args.list:
        for name, _ in queries:
            print(name)
        return 0

    params = {
        "current_start": args.current_start,
        "current_end": args.current_end,
        "previous_start": args.previous_start,
        "previous_end": args.previous_end,
        "markets_csv": args.markets,
    }

    if args.print_sql:
        print_sql(queries, params)
        return 0

    if not args.database_url:
        print(
            "Set DATABASE_URL, or pass --print-sql to copy queries into Cloud SQL Studio.",
            file=sys.stderr,
        )
        return 2

    from sqlalchemy import create_engine

    engine = create_engine(args.database_url, isolation_level="AUTOCOMMIT")
    payload = {
        "markets": [item.strip() for item in args.markets.split(",") if item.strip()],
        "current": {"start": args.current_start, "end": args.current_end},
        "previous": {"start": args.previous_start, "end": args.previous_end},
    }
    with engine.connect() as connection:
        # --only is a studio convenience. The Python runner always executes the full set
        # unless the caller uses run_adoption_validation itself.
        if selected:
            from sqlalchemy import text

            connection.execute(text("SET TIME ZONE 'UTC'"))
            output: dict[str, Any] = {"params": params, "queries": {}}
            for name, sql in queries:
                try:
                    rows = connection.execute(text(sql), params)
                    output["queries"][name] = [dict(row) for row in rows.mappings()]
                except Exception as exc:
                    output["queries"][name] = [
                        {"error": f"{type(exc).__name__}: {exc}"}
                    ]
        else:
            output = run_adoption_validation(connection, payload)
    json.dump(output, sys.stdout, indent=2, default=json_default)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
