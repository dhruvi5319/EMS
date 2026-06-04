---

## F00: Basic Application Shell

**Description:** The application shell is the authenticated web container that all other features live within. It provides login/logout, navigation, role assignment, and audit trail viewing. Every feature in the EMS depends on the shell to enforce authentication before rendering any page or accepting any API request.

**Terminology:**
- **Session:** An authenticated user context established after login; stored as a server-side session or JWT.
- **Navigation Rail/Sidebar:** The persistent UI element listing top-level sections: Dashboard, Requests, Engagements, Evidence, Review Queue, Reports.
- **Search Bar:** A global text input that queries across engagement ID, title, requester, phase, and owner.
- **Review Queue:** A filtered list of items awaiting the current user's action (gate approvals, reference checks, returns).

**Sub-features:**
- F00.1 — Login and logout
- F00.2 — User role assignment (Admin only)
- F00.3 — Main navigation
- F00.4 — Global search
- F00.5 — Audit trail view per engagement

---

### F00.1 Login and Logout

**Process:**
1. Unauthenticated user navigates to any protected route.
2. System redirects to the login page.
3. User submits username and password (or org identity provider flow).
4. System validates credentials.
5. On success: system creates a session, records login audit event, redirects to Dashboard.
6. On failure: system increments failed-login counter; after 5 consecutive failures within 15 minutes, locks account for 15 minutes and writes audit event.
7. User clicks Logout; system destroys session and redirects to login page.

**Inputs:**
- `username` (string, required): user's email address
- `password` (string, required): user's password

**Outputs:**
- Authenticated session (cookie or JWT) with `user_id`, `role`, `name`
- Redirect to `/dashboard`

**Validation:**
- `username` must be non-empty and valid email format.
- `password` must be non-empty.
- Credentials must match a known active user account.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Invalid credentials | 401 | `AUTH_INVALID` | "Invalid username or password." |
| Account locked | 403 | `AUTH_LOCKED` | "Account locked due to repeated failures. Try again in 15 minutes." |
| Missing username or password | 422 | `VALIDATION_ERROR` | Field-level errors array |

---

### F00.2 User Role Assignment

**Process:**
1. Admin navigates to User Management.
2. Admin selects a user and assigns one or more roles from the predefined list.
3. System saves the role assignment and writes an audit event.
4. New permissions take effect on the user's next request (or immediately if session is refreshed).

**Inputs:**
- `user_id` (UUID, required)
- `roles` (array of role codes, required): one or more of `AL`, `EM`, `AN`, `QA`, `IR`, `PC`, `RO`, `AD`

**Validation:**
- At least one role must be assigned.
- Role codes must be from the predefined list.
- Only Admin may invoke this action.

---

### F00.3 Main Navigation

The navigation rail exposes these top-level sections to all authenticated users:

| Section | Route | Visible To |
|---|---|---|
| Dashboard | `/dashboard` | All |
| Requests | `/requests` | AL, EM, AD, RO |
| Engagements | `/engagements` | All |
| Evidence | `/evidence` | AN, QA, EM, IR, AD, RO |
| Review Queue | `/review-queue` | AL, QA, IR, PC, EM |
| Reports | `/reports` | All |

Sections not visible to a role are hidden; direct URL access to a hidden section returns HTTP 403.

---

### F00.4 Global Search

**Inputs:**
- `q` (string, required): search query, minimum 2 characters

**Search targets:** engagement ID (exact), engagement title (contains), requester name (contains), phase (exact), owner name (contains)

**Outputs:**
- Ranked list of matching engagements (max 50 results)
- Each result: engagement ID, title, phase, owner, status

**Validation:**
- Query must be ≥2 characters.
- Results filtered to engagements the current user is authorized to view.

---

### F00.5 Audit Trail View

**Process:**
1. User with authorized role navigates to Engagement → Audit Trail tab.
2. System retrieves all audit events for the engagement, ordered by timestamp descending.
3. User can filter by action type and date range.

**Outputs:**
- List of audit events: timestamp, actor name, action, object type, object ID, summary

**Access control:** All roles assigned to an engagement may view its audit trail. Admin may view all audit trails.

---

**API Surface (F00):** see `Y1-api.md` §Auth and §Users for full request/response schemas.

**Schema Surface (F00):** uses tables `users`, `user_roles`, `sessions` — see `Y0-schema.md` §Auth.
