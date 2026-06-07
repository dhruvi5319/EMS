---
phase: 06-draft-reference-check-gate-p4-and-dashboard
verified: 2026-06-07T01:00:00Z
status: gaps_found
score: 17/21 must-haves verified
re_verification: false
gaps:
  - truth: "POST /api/engagements/:id/draft/comments appends a new comment (append-only, no edit)"
    status: failed
    reason: "Frontend sends { text: '...' } but backend route destructures { comment_text } and service validates comment_text — comment_text is always undefined, causing 422 errors on every comment submission"
    artifacts:
      - path: "frontend/src/hooks/useDraftProduct.ts"
        issue: "Line 135: api.post sends { text } but backend route expects { comment_text }"
      - path: "backend/src/routes/draft.ts"
        issue: "Line 166: const { comment_text } = req.body — field name mismatch with frontend"
    missing:
      - "Change useDraftProduct addComment to send { comment_text: text } OR rename backend route to accept { text }"

  - truth: "Waiver sets ref_status='waived' with mandatory discrepancy_notes; restricted to EM/AD"
    status: failed
    reason: "DB check constraint only allows ('not_started','in_review','passed','failed') — 'waived' is not in the constraint and will cause a DB error on any waiver attempt. The backend service also explicitly excludes 'waived' from validStatuses."
    artifacts:
      - path: "backend/migrations/002_core_tables.ts"
        issue: "Line 205: check constraint `ref_status IN ('not_started','in_review','passed','failed')` does not include 'waived'"
      - path: "backend/src/services/statements.service.ts"
        issue: "Line 245: validStatuses array excludes 'waived'; service comment confirms this (line 254)"
      - path: "frontend/src/hooks/useStatements.ts"
        issue: "Line 136: waiveStatement sends ref_status: 'waived' — will always fail with 422"
    missing:
      - "Add migration to alter draft_statements check constraint to include 'waived'"
      - "Add 'waived' to validStatuses in statements.service.ts updateStatement"
      - "Add EM/AD role check in updateStatement when ref_status='waived'"

  - truth: "POST /api/engagements/:id/gate/p4 with approved + valid outcome sets engagement.status and creates GateDecision + AuditEvent"
    status: failed
    reason: "ApproveP4ConfirmDialog POSTs to /engagements/${engagementId}/gate/p4 (missing /api/ prefix). Vite proxy only handles /api/* — this request goes to the React dev server and returns the index HTML, not the backend API."
    artifacts:
      - path: "frontend/src/components/gatep4/ApproveP4ConfirmDialog.tsx"
        issue: "Line 42: api.post('/engagements/${engagementId}/gate/p4') — missing /api/ prefix"
    missing:
      - "Change to api.post('/api/engagements/${engagementId}/gate/p4', ...)"

  - truth: "GET /api/engagements/:id/gate/p4/prerequisites returns { met: bool, blockers: [] }"
    status: failed
    reason: "GateP4ReviewPage fetches /engagements/${engagementId}/gate/p4/prerequisites (missing /api/ prefix). Vite proxy only proxies /api/* paths — this request is served by the React router as a 404 or SPA fallback."
    artifacts:
      - path: "frontend/src/pages/engagements/GateP4ReviewPage.tsx"
        issue: "Line 38: api.get('/engagements/${engagementId}/gate/p4/prerequisites') — missing /api/ prefix"
    missing:
      - "Change to api.get('/api/engagements/${engagementId}/gate/p4/prerequisites')"
human_verification:
  - test: "Navigate to Draft Product tab on an engagement in draft phase and add a review comment"
    expected: "Comment appears in the thread with author name and timestamp"
    why_human: "After fix is applied, needs browser-level end-to-end verification"
  - test: "Waive a statement as an EM user and confirm the waiver is persisted"
    expected: "Statement shows waived status; P4 prerequisites no longer blocked by that statement"
    why_human: "DB constraint fix requires migration run and runtime verification"
  - test: "Navigate to /engagements/:id/gates/p4 and approve Gate P4"
    expected: "Redirect to engagement shell with green P4 approved banner; engagement status updated"
    why_human: "API path fix requires runtime verification; banner state persistence needs browser testing"
  - test: "Portfolio dashboard CSV export applies current filters (e.g. by phase = draft)"
    expected: "Downloaded CSV contains only draft-phase engagements"
    why_human: "CSV blob download and filter application requires browser execution"
---

# Phase 6: Draft Product, Reference Check, Gate P4, and Dashboard — Verification Report

**Phase Goal:** The team can create and track a draft product, an Independent Referencer can check all statements against evidence, and the Publishing Coordinator can approve Gate P4, completing the engagement; the portfolio dashboard shows all engagements  
**Verified:** 2026-06-07T01:00:00Z  
**Status:** gaps_found — 4 functional gaps found  
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are drawn from the per-plan `must_haves` in PLAN frontmatter (Plans 06-01 through 06-07), which directly implement the four Success Criteria in ROADMAP.md.

#### Plan 06-01: Draft Product Backend API (F11)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST /api/engagements/:id/draft creates draft record, returns 201 | ✓ VERIFIED | `draftRouter.post('/')` calls `createDraft()` with engagement phase guard |
| 2 | GET /api/engagements/:id/draft returns draft or 404 | ✓ VERIFIED | `draftRouter.get('/')` calls `getDraft()`, returns 404 when null |
| 3 | PATCH /api/engagements/:id/draft updates metadata/status; validates transitions | ✓ VERIFIED | `ALLOWED_TRANSITIONS` map enforced in `updateDraft()` service |
| 4 | POST /api/engagements/:id/draft/file uploads file (max 50MB); replaces previous | ✓ VERIFIED | multer memoryStorage, `uploadDraftFile()` deletes old file atomically |
| 5 | DELETE /api/engagements/:id/draft/file removes draft file | ✓ VERIFIED | `draftRouter.delete('/file')` calls `deleteDraftFile()` |
| 6 | GET /api/engagements/:id/draft/comments returns list newest-first | ✓ VERIFIED | `listDraftComments()` JOINs users, orders by commented_at DESC |
| 7 | POST /api/engagements/:id/draft/comments appends new comment (no edit) | ✗ FAILED | Frontend sends `{ text }`, backend expects `{ comment_text }` — 422 on every submit |
| 8 | Draft creation blocked if engagement.phase != 'draft' | ✓ VERIFIED | `createDraft()` checks `engagement.phase !== 'draft'`, throws 422 |

#### Plan 06-02: Statements + Reference Check Backend API (F12)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 9 | POST /api/engagements/:id/statements creates with ≥1 evidence_id; returns 201 | ✓ VERIFIED | `createStatement()` validates `evidence_ids.length >= 1`, throws 422 otherwise |
| 10 | GET /api/engagements/:id/statements returns list filterable by ref_status | ✓ VERIFIED | `listStatements()` accepts ref_status filter, priority CASE sort |
| 11 | PATCH /api/engagements/:id/statements/:statement_id updates status/discrepancy | ✓ VERIFIED | `updateStatement()` handles ref_status, discrepancy_notes, assigned_to |
| 12 | DELETE /api/engagements/:id/statements/:statement_id removes statement | ✓ VERIFIED | `deleteStatement()` blocks on passed status; cascade removes evidence links |
| 13 | Waiver sets ref_status='waived'; restricted to EM/AD | ✗ FAILED | DB check constraint excludes 'waived'; backend validStatuses excludes 'waived' — any waiver attempt fails at API level |
| 14 | Discrepancy assignment creates AuditEvent STATEMENT_DISCREPANCY_ASSIGNED | ✓ VERIFIED | `updateStatement()` inserts audit_event when ref_status=failed + assigned_to set |
| 15 | Creating statement with 0 evidence_ids returns 422 | ✓ VERIFIED | `createStatement()` throws 422 when evidence_ids.length < 1 |

#### Plan 06-03: Gate P4 Backend API (F13) + Portfolio API (F14)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 16 | GET /api/engagements/:id/gate/p4/prerequisites returns { met, blockers } | ✓ VERIFIED | `checkP4Prerequisites()` checks 4 blocker types; route registered at `/prerequisites` |
| 17 | POST /api/engagements/:id/gate/p4 sets engagement status + creates GateDecision + AuditEvent | ✓ VERIFIED (backend) | `recordP4Decision()` transactional; but frontend path broken (gap #3) |
| 18 | P4 blocked when any statement has ref_status in_review or failed, or P3 not approved | ✓ VERIFIED | gatep4.service checks p3_not_approved, has_failed_checks, has_in_review_checks, has_not_started_checks |
| 19 | GET /api/engagements returns paginated list with filter+sort | ✓ VERIFIED | `listEngagements()` with full F14 filter/sort; /export registered before /:id |
| 20 | GET /api/engagements/export returns text/csv with all 16 columns | ✓ VERIFIED | `exportEngagements()` with csvEscape(), Content-Disposition header; route ordering correct |

#### Plans 06-04 through 06-07: UI Layer (F11-F14)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 21 | GET /api/engagements/:id/gate/p4/prerequisites fetched on page load to drive checklist | ✗ FAILED | GateP4ReviewPage line 38: missing `/api/` prefix — request goes to React SPA, not backend |
| 22 | POST /api/engagements/:id/gate/p4 called on confirm dialog submit | ✗ FAILED | ApproveP4ConfirmDialog line 42: missing `/api/` prefix — API call unreachable |

*Note: Truths from 06-04/05/06/07 that don't involve the two broken paths all pass — DraftProductPage, DraftStatusStepper, StatementsPage, StatementDetailPage, PortfolioDashboardPage are all substantive and wired correctly.*

**Score:** 17/21 truths verified (4 gaps blocking goal achievement)

---

### Required Artifacts

All 22 required artifacts exist and pass the minimum-lines check:

| Artifact | Lines | Status | Notes |
|----------|-------|--------|-------|
| `backend/src/services/draft.service.ts` | 390 | ✓ VERIFIED | All 7 exported functions present and DB-wired |
| `backend/src/routes/draft.ts` | 175 | ✓ VERIFIED | All 7 routes; multer wired; draftRouter exported |
| `backend/src/services/statements.service.ts` | 375 | ✓ VERIFIED | 4 exported functions; audit event wired |
| `backend/src/routes/statements.ts` | 115 | ✓ VERIFIED | 4 routes; statementsRouter exported |
| `backend/src/services/gatep4.service.ts` | ~430 | ✓ VERIFIED | 4 exported functions; transactional P4 approval |
| `backend/src/routes/gatep4.ts` | 80 | ✓ VERIFIED | gateP4Router; 2 routes wired to service |
| `frontend/src/pages/DraftProductPage.tsx` | 330 | ✓ VERIFIED | Full draft workflow; stepper, file, comments, summary |
| `frontend/src/components/draft/DraftStatusStepper.tsx` | 107 | ✓ VERIFIED | Custom Tailwind 4-step; CheckCircle; 3 states |
| `frontend/src/hooks/useDraftProduct.ts` | 160 | ✓ VERIFIED (partial) | 8 functions; comment field name mismatch (gap #1) |
| `frontend/e2e/draft-product.spec.ts` | 290 | ✓ VERIFIED | 6 Playwright tests with API mocking |
| `frontend/src/pages/StatementsPage.tsx` | 222 | ✓ VERIFIED | Progress bar, filter bar, statement table |
| `frontend/src/components/statements/ReferenceCheckProgressBar.tsx` | 140 | ✓ VERIFIED | 5-segment flex bar + P4GateStatusLine |
| `frontend/src/components/statements/ReferenceStatusBadge.tsx` | 54 | ✓ VERIFIED | 5 variants; inline className colors |
| `frontend/src/hooks/useStatements.ts` | 175 | ✓ VERIFIED (partial) | Waiver sends 'waived' status which DB rejects (gap #2) |
| `frontend/e2e/statements.spec.ts` | 380 | ✓ VERIFIED | 6 Playwright tests |
| `frontend/src/pages/engagements/StatementDetailPage.tsx` | 465 | ✓ VERIFIED | IR + AN + read-only views; role-gated correctly |
| `frontend/src/components/statements/ReferenceCheckDecisionPanel.tsx` | 260 | ✓ VERIFIED | Status radio; discrepancy field expansion on Failed; Save & Next |
| `frontend/src/components/statements/DiscrepancyPanel.tsx` | 24 | ✓ VERIFIED | bg-red-50 + border-l-4 border-red-600 |
| `frontend/src/components/statements/AnalystCorrectionNotice.tsx` | 46 | ✓ VERIFIED | bg-amber-50 + border-l-4 border-amber-500 |
| `frontend/e2e/statement-detail.spec.ts` | 370 | ✓ VERIFIED | IR decision + AN correction Playwright tests |
| `frontend/src/pages/engagements/GateP4ReviewPage.tsx` | 280 | ✓ VERIFIED (partial) | Substantive page but prerequisite GET path broken (gap #4) |
| `frontend/src/components/gatep4/P4PrerequisitesChecklist.tsx` | 141 | ✓ VERIFIED | 4-item checklist; pass/fail indicators; blocker links |
| `frontend/src/components/gatep4/P4DecisionPanel.tsx` | 225 | ✓ VERIFIED (partial) | 4px accent left border; aria-disabled; PC role gate; POST path broken (gap #3) |
| `frontend/src/pages/PortfolioDashboardPage.tsx` | 205 | ✓ VERIFIED | PhaseStatCardRow + DashboardFilterBar + EngagementRegisterTable; CSV export |
| `frontend/src/components/dashboard/GateMiniStatusRow.tsx` | 104 | ✓ VERIFIED | 4-gate circles; emerald-600/yellow/gray; aria-labels |
| `frontend/src/hooks/usePortfolio.ts` | 220 | ✓ VERIFIED | GET /api/engagements; exportCSV as Blob download |
| `frontend/e2e/gate-p4.spec.ts` | 300 | ✓ VERIFIED | 6 Playwright tests |
| `frontend/e2e/portfolio-dashboard.spec.ts` | 365 | ✓ VERIFIED | 5 Playwright tests |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/src/routes/draft.ts` | `draft.service.ts` | All 7 service functions imported and called | ✓ WIRED | Lines 6-12: all imports; all handlers call service |
| `backend/src/services/draft.service.ts` | `backend/src/db/index.ts` | `db('draft_products')`, `db('draft_comments')` | ✓ WIRED | 12+ db() calls across 7 service functions |
| `backend/src/routes/draft.ts` | multer middleware | `upload.single('file')` on POST /file route | ✓ WIRED | Line 111: `upload.single('file')` applied |
| `backend/src/routes/statements.ts` | `statements.service.ts` | 4 service functions called | ✓ WIRED | Lines 5-8: all imports; handlers call service |
| `backend/src/services/statements.service.ts` | `backend/src/db/index.ts` | `db('draft_statements')`, `db('statement_evidence_links')`, `db('audit_events')` | ✓ WIRED | Multiple queries per function |
| `backend/src/routes/gatep4.ts` | `gatep4.service.ts` | `checkP4Prerequisites`, `recordP4Decision` | ✓ WIRED | Line 4: import; lines 28, 72: calls |
| `backend/src/services/gatep4.service.ts` | `backend/src/db/index.ts` | `db('gate_decisions')`, `db('draft_statements')`, `db('engagements')` | ✓ WIRED | Transactional P4 decision at lines 235-275 |
| `backend/src/routes/engagements.ts` | All sub-routers + /export | `draftRouter`, `statementsRouter`, `gateP4Router`; /export before /:id | ✓ WIRED | Lines 43, 96, 99, 108; /export registered line 43 before /:id at line 66 |
| `frontend/src/pages/DraftProductPage.tsx` | `/api/engagements/:id/draft` | `useDraftProduct` hook GET/POST/PATCH | ✓ WIRED | useDraftProduct hook imported and called; all paths use `/api/` prefix |
| `frontend/src/components/draft/ReviewCommentThread.tsx` | `/api/engagements/:id/draft/comments` | fetchComments + addComment props from useDraftProduct | ✗ BROKEN | useDraftProduct sends `{ text }` but backend expects `{ comment_text }` |
| `frontend/src/components/draft/DraftFileSection.tsx` | `/api/engagements/:id/draft/file` | FormData POST; download link | ✓ WIRED | Line 103: correct `/api/` path |
| `frontend/src/pages/StatementsPage.tsx` | `/api/engagements/:id/statements` | `useStatements` hook GET/POST/PATCH/DELETE | ✓ WIRED | All paths use `/api/` prefix |
| `frontend/src/hooks/useStatements.ts` | `/api/engagements/:id/statements/:sid` | PATCH with ref_status='waived' | ✗ BROKEN | DB constraint rejects 'waived'; API returns 422 |
| `frontend/src/pages/engagements/StatementDetailPage.tsx` | `/api/engagements/:id/statements/:sid` | GET list + PATCH for IR decision + AN correction | ✓ WIRED | All paths use `/api/` prefix |
| `frontend/src/pages/engagements/GateP4ReviewPage.tsx` | `/api/engagements/:id/gate/p4/prerequisites` | GET on page load | ✗ BROKEN | Missing `/api/` prefix — Vite does not proxy `/engagements/` |
| `frontend/src/components/gatep4/ApproveP4ConfirmDialog.tsx` | `/api/engagements/:id/gate/p4` | POST on confirm | ✗ BROKEN | Missing `/api/` prefix — same Vite proxy issue |
| `frontend/src/pages/PortfolioDashboardPage.tsx` | `/api/engagements` | `usePortfolio` GET + CSV export | ✓ WIRED | All paths use `/api/` prefix |
| `frontend/src/components/dashboard/EngagementRegisterTable.tsx` | `/api/engagements/export` | exportCSV Blob download via usePortfolio | ✓ WIRED | Triggered via exportCSV from hook |

---

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| F11: Draft product record — CRUD, file upload, comment thread | ✗ BLOCKED | Comment field mismatch: POST /draft/comments always fails (422) |
| F12: Draft statements — evidence linking, ref check status, waiver, discrepancy | ✗ BLOCKED | Waiver (ref_status='waived') rejected by DB constraint; discrepancy_type silently dropped |
| F13: Gate P4 — prerequisites, PC/EM/AD approval, terminal status | ✗ BLOCKED | Frontend API paths missing `/api/` prefix; both GET prerequisites and POST gate/p4 unreachable |
| F14: Portfolio dashboard — phase stat cards, filters, sortable table, CSV export | ✓ SATISFIED | All components wired; IR role CSV hiding correct; export Blob pattern correct |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `backend/migrations/002_core_tables.ts` | 205 | DB check constraint missing 'waived' | 🛑 Blocker | Any waiver attempt causes DB constraint violation |
| `frontend/src/hooks/useDraftProduct.ts` | 135 | Sends `{ text }` instead of `{ comment_text }` | 🛑 Blocker | 100% failure rate on comment submission |
| `frontend/src/pages/engagements/GateP4ReviewPage.tsx` | 38 | API path missing `/api/` prefix | 🛑 Blocker | P4 prerequisites panel never loads; prerequisite check always shows loading/error |
| `frontend/src/components/gatep4/ApproveP4ConfirmDialog.tsx` | 42 | API path missing `/api/` prefix | 🛑 Blocker | Gate P4 approval can never be submitted; terminal lifecycle action broken |
| `frontend/src/components/statements/ReferenceCheckDecisionPanel.tsx` | 97–99 | Sends `discrepancy_type` and `assigned_back_to` not in DB schema | ⚠️ Warning | Fields silently dropped; IR cannot categorize discrepancy type or assign back to AN via backend |
| `backend/src/services/statements.service.ts` | 254 | Comment documents 'waived not in DB schema' but frontend still sends it | ⚠️ Warning | Schema drift documented but not fixed; mismatch will surprise next developer |

---

### Human Verification Required

#### 1. Comment Thread Submission (after field name fix)
**Test:** On a draft-phase engagement, open Draft Product tab, type a review comment and click Submit  
**Expected:** Comment appears in thread with correct author name, timestamp, and text  
**Why human:** Field rename fix needs runtime browser verification; API mock in Playwright tests bypasses the actual field name contract

#### 2. Waiver Flow (after DB migration + service fix)
**Test:** As an EM user, navigate to Statements page, find a statement and click "Waive"; enter ≥10 char justification and confirm  
**Expected:** Statement shows "Waived" badge; P4 prerequisites no longer show that statement as a blocker  
**Why human:** DB migration must run first; constraint enforcement is database-level

#### 3. Gate P4 Approval (after API path fix)
**Test:** As a PC user, navigate to `/engagements/:id/gates/p4`; verify prerequisites load; enter ≥10 char comment; click Approve; confirm in dialog  
**Expected:** Redirect to engagement shell with green "Gate P4 Approved" banner; engagement phase changes to readiness or closed  
**Why human:** API path fixes require runtime verification; post-approval navigation state persistence must be observed in browser

#### 4. Portfolio Dashboard CSV Export with Active Filters
**Test:** Set "Phase = Draft" filter on portfolio dashboard; click "Export to CSV ↓"  
**Expected:** CSV downloads with only draft-phase engagements and all 16 expected columns  
**Why human:** Blob download initiation and file contents require browser execution; IR role should not see the Export button

---

### Additional Observations

#### Schema Drift: discrepancy_type and assigned_back_to
The DB schema for `draft_statements` (migration 002) does not include `discrepancy_type` or `assigned_back_to` columns. The frontend `ReferenceCheckDecisionPanel` sends both via the PATCH body, but neither the route nor the service processes them — they are silently discarded. The plan specification and UI-SPEC both require these fields for the reference check workflow (assigning discrepancy back to Analyst and categorizing the discrepancy type). This is a **Warning** severity gap: the UI collects data that is never stored.

#### Backend TypeScript Compilation
The pre-existing `rootDir` error (`src/db/index.ts` references `knexfile.ts` outside rootDir) is not caused by Phase 6 code. The frontend compiles cleanly with zero TypeScript errors — Phase 6 frontend is type-correct.

#### Positive Findings
- `/export` route correctly registered before `/:id` (critical ordering from plan spec verified ✓)
- IR role correctly excluded from CSV export button (`canExport = !user?.roles?.includes('IR')`)
- P4 outcome restricted to 'ready_for_issuance' for PC-only users (`!isPC` guard on Closed radio)
- Post-P4 approval navigation sends `{ p4Approved: true, p4Outcome, p4JobCode }` state; EngagementShellPage reads it correctly
- DraftStatusStepper is custom Tailwind (not shadcn) — 4 steps with correct labels and 3-state nodes
- ALLOWED_TRANSITIONS in draft.service.ts enforces server-side FSM correctly
- All sub-routers mounted in correct order in engagements.ts

---

### Gaps Summary

Four gaps block full goal achievement, grouped by concern:

**Concern 1 — Field name mismatch (draft comments):** The comment submission path is broken because `useDraftProduct.addComment` sends `{ text }` but the backend expects `{ comment_text }`. This is a one-line fix in either the hook or the route.

**Concern 2 — Waiver feature not wired to DB (reference check):** The waiver flow (a core F12 feature) is broken at the database level: `ref_status='waived'` violates the check constraint in `draft_statements`. The fix requires a migration to alter the constraint AND updating `validStatuses` in the service. Without this, the waiver button in the UI always produces an API error.

**Concern 3 — API path prefix (Gate P4):** Both Gate P4 frontend components (`GateP4ReviewPage` and `ApproveP4ConfirmDialog`) call `/engagements/...` instead of `/api/engagements/...`. The Vite dev server proxy only handles `/api/*`. This makes the entire Gate P4 UI non-functional — the terminal lifecycle action of the whole system cannot be completed.

These three concerns affect different features but share a common root: schema/contract drift that occurred when plans were adapted to the actual codebase during execution. The gaps are surgical: the backend logic is correct, the UI structure is complete, and the wiring only needs targeted fixes at the boundary points.

---

_Verified: 2026-06-07T01:00:00Z_  
_Verifier: Claude (pivota_spec-verifier)_
