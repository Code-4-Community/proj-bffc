# Partner Orgs

Many food forest sites operate in partnership with other organizations (community groups, nonprofits, local institutions). `GET /api/partnerOrgs/{siteId}` powers the partner organizations section of the public site detail page.

## `GET /api/partnerOrgs/{siteId}`

**Auth:** `@Public()` — visitors can call this without a Bearer token (site detail page).

**Path:** `siteId` must be a UUID. A non-UUID value (e.g. `/api/partnerOrgs/abc`) is `400` (`Validation failed (uuid is expected)`).

**Response:** JSON array, sorted by `name`. Empty `[]` when the site exists but has no partners — not `404`. Unknown `siteId` → `404` (`Site with ID <siteId> not found`).

Each element (`PartnerOrgDto`, shared with `GET /api/site/{id}`):

| Field  | Notes                    |
| ------ | ------------------------ |
| `id`   | Partner org UUID         |
| `name` | Organization name        |

Partner orgs are linked to a site via the `partner_orgs.site_id` foreign key (one site → many orgs).

Swagger: tag **Partner Orgs**. Enable with `SWAGGER_ENABLED=true` and open `/api`.
