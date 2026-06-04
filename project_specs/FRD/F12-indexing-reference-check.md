---

## F12: Basic Indexing and Reference Check

**Description:** Basic Indexing and Reference Check allows Analysts to create draft statement records for the draft product and link each statement to supporting evidence items (indexing). Independent Referencers then verify each indexed statement against the linked evidence and mark reference status. Failed reference checks are assigned back to Analysts for correction. All reference checks must be Passed or explicitly Waived before Gate P4 can proceed.

**Terminology:**
- **Draft Statement:** A single claim, finding, or assertion in the draft product that requires evidence support; the unit of indexing.
- **Indexing:** The act of linking a draft statement to one or more evidence items.
- **Reference Check:** The Independent Referencer's review confirming whether the statement is supported by the linked evidence.
- **Reference Status:** Current state of the reference check for a statement: `not_started`, `in_review`, `passed`, `failed`, `waived`.
- **Discrepancy:** A noted inconsistency between the statement and the linked evidence, recorded when status is `failed`.
- **Waived:** A reference check explicitly skipped with a recorded justification (only permitted by EM or AD).

**Sub-features:**
- F12.1 — Create draft statement (index)
- F12.2 — Link statement to evidence items
- F12.3 — Assign reference check to Independent Referencer
- F12.4 — Perform reference check
- F12.5 — Record discrepancy and assign back to Analyst
- F12.6 — Waive reference check
- F12.7 — View reference check progress

---

### F12.1 Create Draft Statement (Index)

**Roles permitted:** AN, EM, AD

**Process:**
1. AN navigates to `/engagements/{id}/draft/statements` and clicks "Add Statement."
2. AN enters statement text (required).
3. AN saves the statement.
4. System creates the statement record with `reference_status = not_started`.
5. System writes audit event `STATEMENT_CREATED`.

**Inputs:**
- `draft_product_id` (UUID, required): from route
- `statement_text` (text, required): the full text of the draft statement
- `sort_order` (integer, optional): display order within the draft product

**Validation:**
- `statement_text` must be non-empty.
- The draft product must exist for this engagement.
- Statements may be created while draft product status is `drafting`, `under_review`, or `ready_for_reference_check`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Statement text empty | 422 | `VALIDATION_ERROR` | "Statement text is required." |
| Draft product not found | 404 | `NOT_FOUND` | "Draft product not found for this engagement." |
| Unauthorized | 403 | `FORBIDDEN` | "Only Analysts or Engagement Managers may create draft statements." |

---

### F12.2 Link Statement to Evidence Items

**Roles permitted:** AN, EM, AD

**Process:**
1. AN selects one or more evidence items to link to the statement.
2. System validates evidence items belong to the same engagement.
3. System creates `StatementEvidenceLink` records.
4. System writes audit event `STATEMENT_EVIDENCE_LINKED`.

**Inputs:**
- `statement_id` (UUID, required)
- `evidence_item_ids` (array of UUIDs, required, min 1)

**Validation:**
- Each evidence item must belong to the same engagement.
- A statement may not duplicate the same evidence link.
- A statement must have at least one evidence link before its reference check can begin.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Evidence from different engagement | 422 | `CROSS_ENGAGEMENT_LINK` | "Evidence item does not belong to this engagement." |
| Duplicate link | 409 | `LINK_DUPLICATE` | "This evidence item is already linked to this statement." |

---

### F12.3 Assign Reference Check to Independent Referencer

**Roles permitted:** EM, AD

**Process:**
1. EM navigates to the statement list and selects statements to assign.
2. EM selects an IR user from the engagement team.
3. System updates `statement.assigned_to_ir = user_id`, sets `reference_status = not_started` (if not already).
4. System writes audit event `REFERENCE_CHECK_ASSIGNED`.

**Validation:**
- The assigned user must have role `IR` and be assigned to this engagement.
- Statements without evidence links cannot be assigned for reference check.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Assigned user not IR | 422 | `VALIDATION_ERROR` | "Assigned user must have the Independent Referencer role." |
| Statement has no evidence links | 422 | `REFERENCE_CHECK_PREREQ` | "Statement must be linked to at least one evidence item before reference check can begin." |

---

### F12.4 Perform Reference Check

**Roles permitted:** IR only

**Process:**
1. IR navigates to the Review Queue and selects assigned statements.
2. IR opens a statement, reviews the linked evidence, and assesses whether the statement is supported.
3. IR sets the `reference_status`:
   - `passed`: statement is supported by the linked evidence.
   - `failed`: statement is not adequately supported; IR records discrepancy notes.
   - `in_review`: IR has started review but has not yet completed the assessment.
4. System saves the status change.
5. System writes audit event `REFERENCE_STATUS_CHANGED`.

**Inputs:**
- `statement_id` (UUID, required)
- `reference_status` (enum, required): `in_review` | `passed` | `failed`
- `discrepancy_notes` (text, required if `reference_status = failed`): description of the issue

**Validation:**
- Only IR may set reference status.
- `discrepancy_notes` is required when `reference_status = failed`.

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Discrepancy notes missing when failed | 422 | `VALIDATION_ERROR` | "Discrepancy notes are required when reference status is Failed." |
| Unauthorized | 403 | `FORBIDDEN` | "Only an Independent Referencer may perform reference checks." |

---

### F12.5 Record Discrepancy and Assign Back to Analyst

**Roles permitted:** IR (record discrepancy), EM or AN (address discrepancy)

**Process (IR side):**
1. IR marks statement as `failed` with discrepancy notes (see F12.4).
2. System updates `reference_status = failed`.
3. System optionally sets `assigned_to_analyst = analyst_user_id` for correction routing.
4. System writes audit event `REFERENCE_FAILED_DISCREPANCY`.

**Process (Analyst side):**
1. AN sees failed reference checks in their queue.
2. AN updates the draft statement text or its evidence links to address the discrepancy.
3. AN changes the statement status to indicate revision is ready (sets `revision_ready = true`).
4. IR is notified (via Review Queue) that the statement is ready for re-check.
5. IR re-performs the reference check (F12.4).

---

### F12.6 Waive Reference Check

**Roles permitted:** EM, AD only

**Process:**
1. EM identifies a statement where reference check will not be performed (e.g., well-established fact requiring no citation).
2. EM clicks "Waive Reference Check" and enters a waiver justification (required).
3. System sets `reference_status = waived`, records `waived_by`, `waived_at`, `waiver_justification`.
4. System writes audit event `REFERENCE_CHECK_WAIVED`.

**Inputs:**
- `statement_id` (UUID, required)
- `waiver_justification` (string, required, min 10 chars)

**Validation:**
- Only EM or AD may waive.
- Waiver justification must be non-empty (minimum 10 characters).

**Error States:**

| Scenario | HTTP | Code | Message |
|---|---|---|---|
| Waiver justification missing | 422 | `VALIDATION_ERROR` | "Waiver justification is required." |
| Unauthorized | 403 | `FORBIDDEN` | "Only an Engagement Manager may waive a reference check." |

---

### F12.7 View Reference Check Progress

**Roles permitted:** All roles assigned to engagement; AD

**Displayed information:**
- Total statement count
- Counts by status: Not Started, In Review, Passed, Failed, Waived
- Percentage of statements Passed or Waived (completion percentage)
- List of statements with current status, assigned IR (if any), and last updated timestamp

**Business Rule:** Gate P4 (F13) uses this view's data to enforce its prerequisite check.

---

**API Surface (F12):** see `Y1-api.md` §Statements.  
**Schema Surface (F12):** uses tables `draft_statements`, `statement_evidence_links` — see `Y0-schema.md` §Statements.
