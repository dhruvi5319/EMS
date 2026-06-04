---

## Y3: External Integration Points

This document catalogs all external system dependencies and integration contracts for EMS v1. The scope is intentionally minimal; advanced integrations are explicitly deferred.

---

### §File Storage

**Purpose:** Store intake documents (F02), evidence files (F08), and draft product attachments (F11).

**Integration type:** Object storage (local filesystem for development; managed blob storage for production, e.g., S3-compatible, Azure Blob, or GCS).

**Contract:**

| Operation | Trigger | Behavior |
|---|---|---|
| Upload file | POST to file endpoint | System writes file to storage path; records `file_ref` (path/URL) and `file_name` in database |
| Download file | GET file endpoint | System checks authorization; returns signed/authenticated URL or streams file content |
| Delete file | Engagement soft-delete cleanup | Physical delete is deferred; scheduled cleanup process marks orphan files for removal |

**Storage path conventions:**

| Use case | Path |
|---|---|
| Intake document | `requests/{request_id}/{original_filename}` |
| Evidence file | `evidence/{engagement_id}/{evidence_id}/{original_filename}` |
| Draft attachment | `draft/{engagement_id}/{draft_id}/{original_filename}` |

**Configuration:**
- Storage backend is configurable via environment variables: `STORAGE_BACKEND` (`local` or `s3_compatible`), `STORAGE_BUCKET`, `STORAGE_BASE_PATH`.
- For local development: files are stored on the local filesystem at `./data/files/`.
- For production: S3-compatible bucket with server-side encryption required.

**Security requirements:**
- Files must not be publicly accessible by direct URL.
- Access must be granted only through the application API after RBAC check.
- Restricted evidence files must be additionally filtered by `sensitivity` check before the download URL is issued.

---

### §Authentication Provider

**Purpose:** Authenticate users before granting access to the application.

**Integration type:** Built-in username/password authentication (v1 default). Organization identity provider (OIDC/SAML) is a future option; not in scope for v1.

**Contract (v1 — built-in auth):**
- Passwords are hashed using bcrypt (cost factor ≥ 12).
- Sessions are stored in the `sessions` table with an expiry of 8 hours (configurable).
- Login attempts are tracked in `login_attempts`; account is locked after 5 consecutive failures within 15 minutes.
- Lockout duration: 15 minutes (configurable via environment variable).

**Future provision:** The authentication layer should be designed so that an OIDC/SAML provider can be substituted by updating the auth configuration without changing feature logic.

---

### §CSV Export

**Purpose:** Export engagement register (F14) and evidence registry (F09) to CSV for stakeholder reporting.

**Integration type:** Server-generated CSV download (no external system).

**Contract:**
- Server generates CSV in memory from database query and streams the response with `Content-Type: text/csv` and `Content-Disposition: attachment; filename="{type}_{engagement_id}_{date}.csv"`.
- No third-party CSV library required beyond standard language library.
- Export is triggered by `Accept: text/csv` header or a `?format=csv` query parameter on the relevant GET endpoint.

---

### §Email / Notifications

**Scope in v1:** Out of scope. No email or push notification integration.

**Provision:** The system should write audit events for all actions that would logically trigger notifications (gate returns, reference check failures, assignments). A future notification module can consume the audit event stream to send emails.

---

### §HTTPS / TLS

**Requirement:** All application traffic must use HTTPS/TLS.

**Implementation:** TLS termination is handled at the load balancer or reverse proxy (e.g., nginx, AWS ALB) in front of the application container. The application itself runs on HTTP internally within the container network.

---

### §Database

**Integration type:** PostgreSQL (recommended) or equivalent relational database.

**Version:** PostgreSQL 15+ recommended for `gen_random_uuid()` and `JSONB` support.

**Connection:** Application connects via connection string in environment variable `DATABASE_URL`.

**Backup:** Database backup must be supported using standard pg_dump tooling or cloud snapshot. Backup schedule is configurable by the deployment operator.

---

### §Deployment and Container

**Integration type:** Docker container + docker-compose for local development; container orchestration (Kubernetes or equivalent) for production.

**Required services (docker-compose):**
- `app` — Backend REST API service
- `frontend` — React web application
- `db` — PostgreSQL instance
- `storage` — Local file storage volume (or external storage mount)

**Environment variables (required at startup):**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for session signing |
| `STORAGE_BACKEND` | `local` or `s3_compatible` |
| `STORAGE_BUCKET` | Bucket name (if s3_compatible) |
| `STORAGE_BASE_PATH` | Base path for file storage |
| `MAX_LOGIN_ATTEMPTS` | Failed login threshold (default 5) |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration (default 15) |
| `SESSION_EXPIRY_HOURS` | Session duration (default 8) |

---

### §Out-of-Scope Integrations (Explicitly Deferred for v1)

| Integration | Reason Deferred |
|---|---|
| External records management system | Out of scope — full records management not required |
| Email/push notifications | Deferred; audit events provision for future module |
| Organization identity provider (OIDC/SAML) | Deferred to post-MVP; built-in auth sufficient for v1 |
| Advanced analytics / BI tool | Out of scope — CSV export is sufficient for v1 reporting |
| External publication/workflow system | Out of scope — P4 is the terminal point for this version |
| Recommendation tracking system | Out of scope for v1 |
