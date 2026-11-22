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

| Field              | Notes                            |
| ------------------ | -------------------------------- |
| `site`             | `{ id, name }`                   |
| `name`             | Event title                      |
| `date` / `time`    | `YYYY-MM-DD` and `HH:MM:SS`      |
| `description`      | Longer copy                      |
| `registrationLink` | Present when the event has a URL |

Results are sorted by date, then time, then id (earliest first).

## `POST /api/adminEvent`

**Auth:** Bearer token for an admin (Cognito group `admins`). No token → `401`; a steward or any non-admin → `403`. (Skipped when `AUTH_DISABLED=true`.)

**Body** (`CreateAdminEventDto`):

| Field              | Notes                                            |
| ------------------ | ------------------------------------------------ |
| `site_id`          | UUID of an existing site                         |
| `name`             | Event title                                      |
| `description`      | Longer copy                                      |
| `place`            | Where the event happens                          |
| `date`             | `YYYY-MM-DD`                                     |
| `startTime`        | `HH:MM` or `HH:MM:SS`                            |
| `endTime`          | `HH:MM` or `HH:MM:SS`, must be after `startTime` |
| `registrationLink` | https Luma link (`lu.ma` / `luma.com`)           |
| `flyerS3Key`       | Optional                                         |

**Responses:**

- `201` — the created event (same shape as `GET`, plus `endTime`, `place`, `flyerS3Key`). Stored in `admin_events`, so it is listed by `GET /api/adminEvent` and is not a steward event.
- `400` — missing or invalid field; `message` names the problem (e.g. `endTime must be after startTime`).
- `401` / `403` — see Auth.
- `404` — `site_id` matches no site.

Swagger: tag **Events**. Enable with `SWAGGER_ENABLED=true` and open `/api`.

## Schema notes

`admin_events` stores `name` in addition to `description`. Steward events are unchanged in this PR.
