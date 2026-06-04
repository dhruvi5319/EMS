---

## F04: Engagement Shell

**Description:** The Engagement Shell is the primary system-of-record page for an accepted engagement. It is created automatically at Gate A1 approval and serves as the hub that all downstream features (planning, evidence, findings, draft product, gate decisions) reference. Authorized roles can edit core metadata, view current gate status, see open blockers, and navigate to linked artifacts.

**Terminology:**
- **Metadata:** Core engagement fields: job code, title, phase, status, risk level, owner, portfolio.
- **Open Blocker:** Any condition that prevents the next gate from passing, displayed as a visible warning on the shell.
- **Gate Status Card:** A UI component showing the current outcome (Not Started / Approved / Declined / Returned) for each of A1, P2, P3, and P4.

**Sub-features:**
- F04.1 — View Engagement Shell
- F04.2 — Edit Engagement Metadata
- F04.3 — Display Gate Status Summary
- F04.4 — Display Open Blockers
- F04.5 — Navigate to Linked Artifacts

---

### F04.1 View Engagement Shell

**Roles permitted:** All roles assigned to the engagement; AD; RO (read only)

**Displayed fields:**
- Job code, title, phase, status badge, risk level badge
- Owner name and role
- Portfolio (if set)
- Created date
- Due date (from originating request, if applicable)
- Gate status cards: A1, P2, P3, P4 (each showing status, approver, date if decided)
- Open blockers list (see F04.4)
- Linked artifact counts: team members, objectives, evidence items, findings, draft product status

**Process:**
1. User navigates to `/engagements/{id}`.
2. System checks that the user is authorized to view this engagement (team assignment or Admin).
3. System loads all engagement fields, gate decisions, and artifact counts.
4. System renders the shell page.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Engagement not found | 404 | `NOT_FOUND` | "Engagement not found." |
| User not authorized for this engagement | 403 | `FORBIDDEN` | "You are not authorized to view this engagement." |

---

### F04.2 Edit Engagement Metadata

**Roles permitted:** EM, AD

**Editable fields:**
- `title` (string ≤500, required)
- `phase` (enum): system advances phase automatically at gates; manual override permitted by EM with a revision note
- `status` (enum): `active`, `on_hold`; `ready_for_issuance` and `closed` are set by gate outcomes only
- `risk_level` (enum): `low`, `medium`, `high`
- `owner_id` (UUID): reassign to another user with EM role
- `portfolio` (string ≤255, nullable)

**Process:**
1. EM navigates to Engagement Shell and clicks Edit.
2. EM modifies allowed fields.
3. EM clicks Save.
4. System validates inputs.
5. System saves changes and writes audit event `ENGAGEMENT_UPDATED`.

**Validation:**
- `title` must be non-empty.
- `phase` manual override requires a non-empty `revision_note` (minimum 10 characters).
- `owner_id` must reference an active user with `EM` role.
- `status` cannot be set to `ready_for_issuance` or `closed` through the edit form; those are gate-controlled.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Title empty | 422 | `VALIDATION_ERROR` | "Title is required." |
| Invalid owner (not an EM) | 422 | `VALIDATION_ERROR` | "Owner must be a user with the Engagement Manager role." |
| Attempting to set gate-controlled status | 422 | `STATUS_LOCKED` | "Status can only be set to Ready for Issuance or Closed through gate approval." |
| Unauthorized role | 403 | `FORBIDDEN` | "Only Engagement Managers may edit engagement metadata." |

---

### F04.3 Display Gate Status Summary

The shell must display a gate status card for each gate: A1, P2, P3, P4.

**Gate status card contents:**

| Field | Value when decided | Value when not yet decided |
|---|---|---|
| Gate label | `A1` / `P2` / `P3` / `P4` | same |
| Outcome | `Approved` / `Declined` / `Returned` | `Not Started` |
| Approver name | Recorded approver | — |
| Decision date | ISO date | — |
| Rationale preview | First 100 chars | — |

Gate status cards must remain visible even after the engagement transitions to a later phase. All gate history must be accessible via "View History" link showing all gate decisions for that gate type in reverse chronological order.

---

### F04.4 Display Open Blockers

Blockers are computed dynamically and displayed as a list on the shell. A blocker is any one of:

| Blocker Condition | Blocker Text |
|---|---|
| Planning record not in `approved` status | "Planning record is not approved (P2 required)." |
| Any objective with status `evidence_needed` | "Objective '{text}' has no linked evidence." |
| Any objective with status `in_review` (at P3) | "Objective '{text}' is still In Review." |
| Any finding with no linked evidence | "Finding '{text prefix}' has no linked evidence." |
| Any reference check in `in_review` or `failed` status | "Reference check for statement '{text prefix}' is {status}." |
| P3 not approved and draft product exists | "Gate P3 must be approved before P4 can proceed." |

The blockers list is empty when all prerequisites are met. A visible "No open blockers" message must appear when the list is empty.

---

### F04.5 Navigate to Linked Artifacts

The shell provides navigation links to:

| Section | Target |
|---|---|
| Team | `/engagements/{id}/team` (F05) |
| Planning Record | `/engagements/{id}/planning` (F06) |
| Evidence | `/engagements/{id}/evidence` (F08, F09) |
| Findings | `/engagements/{id}/findings` (F10) |
| Draft Product | `/engagements/{id}/draft` (F11, F12) |
| Gate History | `/engagements/{id}/gates` |
| Audit Trail | `/engagements/{id}/audit` |

---

**API Surface (F04):** see `Y1-api.md` §Engagements.  
**Schema Surface (F04):** uses table `engagements` — see `Y0-schema.md` §Engagements.
