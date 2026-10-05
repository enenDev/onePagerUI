# One-Pager Adoption Dashboard APIs

This document provides complete documentation for the 4 User Adoption Tracker Dashboard APIs:

1. `POST /api/v1/dashboard/funnel`
2. `POST /api/v1/dashboard/onboarding`
3. `POST /api/v1/dashboard/engagement`
4. `POST /api/v1/dashboard/adoption`

---

## 1. Common Request Payload

All four APIs accept the **identical** JSON filter payload:

```json
{
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
```

### Request Fields:

| Field            | Type        | Required | Description                                                                                                             | Example                 |
| ---------------- | ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `markets`        | `List[str]` | Yes      | Market filter. Pass `["ALL"]` for all markets, or specific markets like `["US"]` or `["US", "Netherlands"]`.            | `["US", "Netherlands"]` |
| `current.start`  | `str`       | Yes      | Start date for the current period (`YYYY-MM-DD` or ISO-8601).                                                           | `"2026-09-01"`          |
| `current.end`    | `str`       | Yes      | End date for the current period (`YYYY-MM-DD` or ISO-8601). Date-only automatically covers until `23:59:59.999999 UTC`. | `"2026-09-30"`          |
| `previous.start` | `str`       | Yes      | Start date for comparison period.                                                                                       | `"2026-08-01"`          |
| `previous.end`   | `str`       | Yes      | End date for comparison period.                                                                                         | `"2026-08-31"`          |

---

## 2. API 1: Adoption Funnel

### Endpoint:

```http
POST /api/v1/dashboard/funnel
```

### Purpose:

Calculates current-period adoption funnel stage rates:

- **Onboarding Rate**: Distinct logged-in users / Provisioned users \* 100
- **Engagement Rate**: Distinct draft-creating users / Provisioned users \* 100
- **Adoption Rate**: Distinct publishing users / Provisioned users \* 100

### Request Payload Example:

```json
{
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
```

### Response Payload Example:

```json
{
  "provisioned_users": {
    "total": 2140,
    "by_role": {
      "CSP": 1180,
      "CBD": 960,
      "General": 2112
    }
  },
  "onboarding_rate": {
    "total": 72.0,
    "by_role": {
      "CSP": 78.1,
      "CBD": 64.5
    }
  },
  "engagement_rate": {
    "total": 51.8,
    "by_role": {
      "CSP": 57.5,
      "CBD": 44.8
    }
  },
  "adoption_rate": {
    "total": 28.0,
    "by_role": {
      "CSP": 32.5,
      "CBD": 22.4
    }
  }
}
```

---

## 3. API 2: Onboarding Section

### Endpoint:

```http
POST /api/v1/dashboard/onboarding
```

### Purpose:

Provides Section 1 Onboarding metrics:

- Market-wise onboarding rate with role-level bars (`CSP`, `CBD`)
- Total onboarded users and role breakdown
- Onboarded users growth rate (`(current - previous) / previous * 100`)
- Total one-pager views (`action = 'VIEW'`) and role breakdown

### Request Payload Example:

```json
{
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
```

### Response Payload Example:

```json
{
  "by_market": [
    {
      "market": "US",
      "provisioned_users": 500,
      "active_users": 357,
      "rate": 71.4,
      "roles": {
        "CSP": 63.0,
        "CBD": 55.0
      }
    },
    {
      "market": "Netherlands",
      "provisioned_users": 380,
      "active_users": 250,
      "rate": 65.8,
      "roles": {
        "CSP": 55.3,
        "CBD": 48.0
      }
    }
  ],
  "onboarded_users": {
    "total": 1541,
    "by_role": {
      "CSP": 922,
      "CBD": 619,
      "General": 1012
    }
  },
  "onboarded_users_growth_rate": {
    "total": 8.4,
    "by_role": {
      "CSP": 9.1,
      "CBD": 7.5
    }
  },
  "total_one_pager_views": {
    "total": 21454,
    "by_role": {
      "CSP": 11204,
      "CBD": 6338,
      "General": 3912
    }
  }
}
```

---

## 4. API 3: Engagement Section

### Endpoint:

```http
POST /api/v1/dashboard/engagement
```

### Purpose:

Provides Section 2 Engagement metrics:

- Market-wise engagement rate with role-level bars (`CSP`, `CBD`)
- Engaged users (distinct users creating at least one draft in `action_log`)
- Track-to-Publish % (published pagers tracked / total published pagers \* 100)
- Total exports (`action = 'EXPORT'`)

### Request Payload Example:

```json
{
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
```

### Response Payload Example:

```json
{
  "by_market": [
    {
      "market": "US",
      "provisioned_users": 500,
      "active_users": 307,
      "rate": 61.4,
      "roles": {
        "CSP": 52.7,
        "CBD": 44.0
      }
    }
  ],
  "engaged_users": {
    "total": 1109,
    "by_role": {
      "CSP": 679,
      "CBD": 430
    }
  },
  "track_to_publish": {
    "total": 63.2,
    "by_role": {
      "CSP": 66.4,
      "CBD": 58.9
    }
  },
  "total_exports": {
    "total": 3450,
    "by_role": {
      "CSP": 1842,
      "CBD": 1096,
      "General": 512
    }
  }
}
```

---

## 5. API 4: Adoption Section

### Endpoint:

```http
POST /api/v1/dashboard/adoption
```

### Purpose:

Provides Section 3 Adoption metrics:

- Market-wise adoption rate with role-level bars (`CSP`, `CBD`)
- Adopted users (distinct users who published at least one One-Pager in `pager`)
- Adopted users growth rate (`(current - previous) / previous * 100`)
- Draft-to-Publish % (`published / (active_drafts + published) * 100`)
- Total One-Pagers published

### Request Payload Example:

```json
{
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
```

### Response Payload Example:

```json
{
  "by_market": [
    {
      "market": "US",
      "provisioned_users": 500,
      "active_users": 188,
      "rate": 37.7,
      "roles": {
        "CSP": 31.3,
        "CBD": 25.0
      }
    }
  ],
  "adopted_users": {
    "total": 599,
    "by_role": {
      "CSP": 384,
      "CBD": 215
    }
  },
  "adopted_users_growth_rate": {
    "total": 12.1,
    "by_role": {
      "CSP": 13.4,
      "CBD": 10.2
    }
  },
  "draft_to_publish": {
    "total": 58.4,
    "by_role": {
      "CSP": 61.2,
      "CBD": 54.1
    }
  },
  "total_one_pagers_published": {
    "total": 1024,
    "by_role": {
      "CSP": 668,
      "CBD": 356
    }
  }
}
```

---

## 6. Error Responses

### 400 Bad Request — Invalid Date Range

Returned when `start > end` or an unparseable date format is provided:

```json
{
  "detail": "Start date (2026-09-30) cannot be after end date (2026-09-01)."
}
```

### 422 Unprocessable Entity — Schema Validation Error

Returned when required JSON fields are missing or null:

```json
{
  "detail": [
    {
      "loc": ["body", "current"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

---

## 7. UI Mapping Reference

| Dashboard Card / Element          | API                     | JSON Path in Response                                                      |
| --------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Provisioned Users Summary         | `/dashboard/funnel`     | `provisioned_users.total`, `provisioned_users.by_role`                     |
| Stage 1 Onboarding Rate Card      | `/dashboard/funnel`     | `onboarding_rate.total`, `onboarding_rate.by_role`                         |
| Stage 2 Engagement Rate Card      | `/dashboard/funnel`     | `engagement_rate.total`, `engagement_rate.by_role`                         |
| Stage 3 Adoption Rate Card        | `/dashboard/funnel`     | `adoption_rate.total`, `adoption_rate.by_role`                             |
| Onboarded Rate by Market (Chart)  | `/dashboard/onboarding` | `by_market[].rate`, `by_market[].roles`                                    |
| Onboarded Users Count             | `/dashboard/onboarding` | `onboarded_users.total`, `onboarded_users.by_role`                         |
| Onboarded Users Growth Rate       | `/dashboard/onboarding` | `onboarded_users_growth_rate.total`, `onboarded_users_growth_rate.by_role` |
| Total One-Pager Views             | `/dashboard/onboarding` | `total_one_pager_views.total`, `total_one_pager_views.by_role`             |
| Engagement Rate by Market (Chart) | `/dashboard/engagement` | `by_market[].rate`, `by_market[].roles`                                    |
| Engaged Users Count               | `/dashboard/engagement` | `engaged_users.total`, `engaged_users.by_role`                             |
| Track-to-Publish %                | `/dashboard/engagement` | `track_to_publish.total`, `track_to_publish.by_role`                       |
| Total Exports Count               | `/dashboard/engagement` | `total_exports.total`, `total_exports.by_role`                             |
| Adoption Rate by Market (Chart)   | `/dashboard/adoption`   | `by_market[].rate`, `by_market[].roles`                                    |
| Adopted Users Count               | `/dashboard/adoption`   | `adopted_users.total`, `adopted_users.by_role`                             |
| Adopted Users Growth Rate         | `/dashboard/adoption`   | `adopted_users_growth_rate.total`, `adopted_users_growth_rate.by_role`     |
| Draft-to-Publish %                | `/dashboard/adoption`   | `draft_to_publish.total`, `draft_to_publish.by_role`                       |
| Total One-Pagers Published        | `/dashboard/adoption`   | `total_one_pagers_published.total`, `total_one_pagers_published.by_role`   |
