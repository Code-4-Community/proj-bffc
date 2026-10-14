# Events

Staff (BFFC admin) are the only people who both manage Luma-linked events and oversee steward-run events. `GET /api/adminEvent` is the admin aggregate of those two tables so they can scan every event across BFFC in one chronological list.

## `GET /api/adminEvent`

**Auth:** Bearer access token. The caller must be in the Cognito `admin` group (`@Roles('admin')`). Unauthenticated requests are `401`; authenticated non-admins are `403`. When `AUTH_DISABLED=true`, the role check is skipped (local scaffold only).

**Query params** (all optional; combined with AND):

| Param         | Meaning                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `site_id`     | UUID of the associated site                                                 |
| `event_type`  | Exact match on stored category (e.g. `harvest`, `volunteer`, `workshop`)    |
| `source_type` | `luma` (staff / Luma-linked `admin_events`) or `steward` (`steward_events`) |

Invalid `site_id` (not a UUID) or `source_type` (not in the enum) → `400`. An unknown `event_type` is a valid query that simply matches nothing.

**Response:** JSON array. Empty `[]` when nothing matches — not `404`.

Each element:

| Field              | Notes                                    |
| ------------------ | ---------------------------------------- |
| `site`             | `{ id, name }`                           |
| `name`             | Event title                              |
| `date` / `time`    | `YYYY-MM-DD` and `HH:MM:SS`              |
| `description`      | Longer copy                              |
| `eventType`        | Category used by the `event_type` filter |
| `sourceType`       | `luma` or `steward`                      |
| `registrationLink` | Present only on Luma-linked events       |

Results are sorted by date, then time, then id (earliest first).

Swagger: tag **Events**, Bearer auth. Enable with `SWAGGER_ENABLED=true` and open `/api`.

## Schema notes

`admin_events` and `steward_events` both store `name` and `eventType` in addition to `description`. `sourceType` is not a column — it is derived from which table the row came from. Steward events have no registration link.
