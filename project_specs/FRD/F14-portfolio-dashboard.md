---

## F14: Portfolio Dashboard

**Description:** The Portfolio Dashboard provides a high-level view of all requests and engagements across the organization. It shows counts by phase and status, supports filtering, and presents a sortable list view with key engagement attributes. The dashboard is the primary entry point for leads and stakeholders to assess portfolio health. The engagement register can be exported to CSV.

**Terminology:**
- **Portfolio Health:** A quick visual scan of engagements grouped by phase, risk level, and gate status.
- **Engagement Register:** The full list of engagements visible to the current user, exportable to CSV.
- **Count Cards:** Summary tiles at the top of the dashboard showing totals by phase, risk, and gate status.

**Sub-features:**
- F14.1 — Display summary count cards
- F14.2 — Filter engagement list
- F14.3 — Display engagement list view
- F14.4 — Export engagement register to CSV

---

### F14.1 Display Summary Count Cards

**Roles permitted:** All authenticated users

**Count cards displayed:**

| Card Label | Metric |
|---|---|
| Active Engagements | `engagement.status = active` |
| In Planning | `engagement.phase = planning` |
| In Evidence | `engagement.phase = evidence` |
| In Draft | `engagement.phase = draft` |
| Ready for Issuance | `engagement.status = ready_for_issuance` |
| Closed | `engagement.status = closed` |
| High Risk | `engagement.risk_level = high` |
| Pending Requests | `request.status = submitted` |

**Access control:** Each user sees only engagements they are authorized to view. AL and AD see all; other roles see only engagements they are assigned to (or all, if configured by Admin).

---

### F14.2 Filter Engagement List

**Roles permitted:** All authenticated users

**Available filters:**

| Filter | Field | Type |
|---|---|---|
| Owner | `engagement.owner_id` | Multi-select |
| Risk Level | `engagement.risk_level` | Multi-select: Low, Medium, High |
| Phase | `engagement.phase` | Multi-select |
| Status | `engagement.status` | Multi-select |
| Due Date | `request.due_date` | Date range picker |
| Gate Status | `gate_decisions.gate_type` + `status` | Composite filter |

**Filter behavior:**
- Filters are combinable (AND logic across filter types).
- Filters persist in URL query parameters for bookmarking.
- Clearing filters returns the unfiltered list.

---

### F14.3 Display Engagement List View

**Roles permitted:** All authenticated users

**Columns:**

| Column | Source |
|---|---|
| Engagement ID | `engagement.job_code` |
| Title | `engagement.title` |
| Phase | `engagement.phase` (display name) |
| Status | `engagement.status` (badge) |
| Owner | `engagement.owner.name` |
| Risk Level | `engagement.risk_level` (badge) |
| Next Milestone | Earliest incomplete milestone with target date |
| Gate Status | Latest outcome for each of A1, P2, P3, P4 |
| Due Date | `request.due_date` (from linked request, if any) |

**Sorting:** All columns are sortable (ascending/descending).  
**Pagination:** 25 rows per page by default; configurable to 50 or 100. Total count shown.  
**Row click:** Navigates to the Engagement Shell (`/engagements/{id}`).

**Validation:**
- The list must load within 3 seconds for ≤100 engagements.
- Only engagements the current user is authorized to see are included.

---

### F14.4 Export Engagement Register to CSV

**Roles permitted:** AL, EM, AN, QA, PC, RO, AD

**Process:**
1. User clicks "Export to CSV" on the portfolio dashboard.
2. System applies the current active filters.
3. System generates a CSV containing only engagements the user is authorized to see.
4. System writes audit event `ENGAGEMENT_REGISTER_EXPORTED`.

**CSV columns:**
`Engagement ID, Title, Phase, Status, Owner, Risk Level, Portfolio, Due Date, A1 Status, P2 Status, P3 Status, P4 Status, Planning Approval Date, Evidence Readiness Date, Final Readiness Date, Created Date`

**Validation:**
- Export is limited to the filtered view; if no filters are active, all visible engagements are exported.
- IR users do not have export permission for the engagement register (they are evidence/reference-focused).

---

**API Surface (F14):** see `Y1-api.md` §Dashboard.  
**Schema Surface (F14):** queries across `engagements`, `requests`, `gate_decisions`, `milestones` — see `Y0-schema.md`.
