# Announcements

Stewards publish announcements (upcoming events, workdays, what is ripe, etc.). `GET /api/announcement/{site_id}` surfaces those posts on the public per-site detail page so visitors can stay informed.

## `GET /api/announcement/{site_id}`

**Path:** `site_id` must be a UUID. A non-UUID value is `400`.

**Response:** JSON array, newest published date first (then `id` for a stable tie-break). Empty `[]` when the site exists but has no announcements — not `404`. Unknown `site_id` → `404`.

Each element:

| Field     | Notes                                      |
| --------- | ------------------------------------------ |
| `id`      | Announcement UUID                          |
| `content` | Body text (`info` column)                  |
| `date`    | Date published (`YYYY-MM-DD`)              |
| `author`  | Posting steward `{ id, name }` (no email)  |

Pruning old announcements is out of scope for this endpoint (later priority).

Swagger: tag **Announcements**. Enable with `SWAGGER_ENABLED=true` and open `/api`.
