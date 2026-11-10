# Events

`GET /api/adminEvent` lists Luma-linked staff events so the frontend can show the public event calendar. Steward-run events are not included here — they belong to a separate endpoint.

## `GET /api/adminEvent`

**Auth:** `@Public()` — anyone can call this without a Bearer token.

**Query params** (optional):

| Param     | Meaning                     |
| --------- | --------------------------- |
| `site_id` | UUID of the associated site |

Invalid `site_id` (not a UUID) → `400`.

**Response:** JSON array. Empty `[]` when nothing matches — not `404`.

Each element:

| Field              | Notes                              |
| ------------------ | ---------------------------------- |
| `site`             | `{ id, name }`                     |
| `name`             | Event title                        |
| `date` / `time`    | `YYYY-MM-DD` and `HH:MM:SS`        |
| `description`      | Longer copy                        |
| `registrationLink` | Present when the event has a URL   |

Results are sorted by date, then time, then id (earliest first).

Swagger: tag **Events**. Enable with `SWAGGER_ENABLED=true` and open `/api`.

## Schema notes

`admin_events` stores `name` in addition to `description`. Steward events are unchanged in this PR.
