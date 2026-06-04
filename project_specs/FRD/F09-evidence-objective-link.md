---

## F09: Evidence-to-Objective Link

**Description:** Evidence-to-Objective Link allows users to associate evidence items with one or more planning objectives, establishing the traceability chain from objectives through evidence. Users can view which objectives have linked evidence and identify gaps (objectives with no evidence). A gap view highlights objectives still marked `evidence_needed`. The evidence registry can be exported to CSV.

**Terminology:**
- **Objective-Evidence Link:** The many-to-many association between an evidence item and an objective.
- **Gap View:** A filtered display showing objectives that have no linked evidence items; these are blockers for Gate P3.
- **Evidence Gap:** An objective with zero linked evidence items, or an objective whose status is still `evidence_needed`.

**Sub-features:**
- F09.1 — Link evidence to objectives
- F09.2 — Unlink evidence from objectives
- F09.3 — View linked evidence per objective
- F09.4 — Gap view (objectives without evidence)
- F09.5 — Export evidence registry to CSV

---

### F09.1 Link Evidence to Objectives

**Roles permitted:** AN, EM, AD

**Process:**
1. AN navigates to the evidence item detail page or the objectives page.
2. AN selects one or more objectives to link to the evidence item.
3. System validates that each selected objective belongs to the same engagement.
4. System creates an `ObjectiveEvidenceLink` record for each pairing.
5. System writes audit event `EVIDENCE_OBJECTIVE_LINKED` for each new link.

**Inputs:**
- `evidence_item_id` (UUID, required)
- `objective_ids` (array of UUIDs, required, min 1)

**Validation:**
- Evidence item must belong to the same engagement as the selected objectives.
- A link between a specific evidence item and objective may not be duplicated.
- Evidence item must not be deleted.
- Objective must not be deleted.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Evidence item not in same engagement | 422 | `CROSS_ENGAGEMENT_LINK` | "Evidence item does not belong to this engagement." |
| Duplicate link | 409 | `LINK_DUPLICATE` | "This evidence item is already linked to this objective." |
| Objective not found | 404 | `NOT_FOUND` | "Objective not found." |
| Unauthorized | 403 | `FORBIDDEN` | "You do not have permission to link evidence." |

---

### F09.2 Unlink Evidence from Objectives

**Roles permitted:** AN, EM, AD

**Process:**
1. User navigates to the objective or evidence item detail and clicks "Remove Link."
2. System checks that removing the link will not leave a finding with zero evidence links (see F10 Finding rules).
3. System deletes the `ObjectiveEvidenceLink` record.
4. System writes audit event `EVIDENCE_OBJECTIVE_UNLINKED`.

**Validation:**
- Cannot unlink if the evidence item is the only linked evidence for a finding that has `status ≠ draft` (protecting findings already under review).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Would leave finding with no evidence | 409 | `FINDING_EVIDENCE_REQUIRED` | "Cannot unlink — this evidence is the only link for a finding that is under review or accepted." |

---

### F09.3 View Linked Evidence Per Objective

**Roles permitted:** All roles assigned to engagement; AD

**Display:**
- For each objective in the planning record, show the list of linked evidence items.
- For each linked evidence item, display: evidence ID (short), type, source, date received, sensitivity badge.
- Access control: Restricted evidence items follow the same access rules as F08.4.

**Evidence item columns in objective view:**
- Evidence ID
- Evidence type
- Source
- Date received
- Sensitivity (`Standard` or `Restricted`)
- Linked findings count

---

### F09.4 Gap View (Objectives Without Evidence)

**Roles permitted:** All roles assigned to engagement; AD

**Process:**
1. User navigates to `/engagements/{id}/evidence/gaps` or uses the "Show Gaps" toggle on the objectives page.
2. System queries objectives where no `ObjectiveEvidenceLink` exists.
3. System displays objectives with zero linked evidence items and their current status.

**Displayed columns:**
- Objective text (truncated at 100 chars)
- Objective status (Evidence Needed / In Review / Sufficient)
- Number of linked evidence items (0 shown as badge "No Evidence")
- Days until evidence readiness milestone (if set)

**Business rule:** Any objective shown in the gap view with `status = evidence_needed` is a P3 blocker (see F10).

---

### F09.5 Export Evidence Registry to CSV

**Roles permitted:** AL, EM, AN, QA, PC, RO, AD

**Process:**
1. User navigates to the evidence page and clicks "Export to CSV."
2. System collects all non-deleted evidence items for the engagement.
3. System applies access control: Restricted items are excluded for AL and RO users.
4. System generates a CSV file.
5. System writes audit event `EVIDENCE_CSV_EXPORTED`.

**CSV columns:**
`Evidence ID, Evidence Type, Source, Date Received, Custodian, Description, Sensitivity, Linked Objectives, Files Attached, Uploaded By, Created Date`

**Validation:**
- Export is scoped to the current engagement only.
- IR users are not included in the export permission (they perform reference checks, not evidence management).

---

**API Surface (F09):** see `Y1-api.md` §Evidence (link endpoints and export).  
**Schema Surface (F09):** uses tables `objective_evidence_links`, `evidence_items`, `objectives` — see `Y0-schema.md` §Evidence.
