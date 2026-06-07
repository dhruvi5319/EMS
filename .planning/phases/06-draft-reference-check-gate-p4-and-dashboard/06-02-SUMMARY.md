---
phase: 06-draft-reference-check-gate-p4-and-dashboard
plan: "02"
subsystem: api
tags: [statements, reference-check, evidence-linking, knex, express, audit-events]

# Dependency graph
requires:
  - phase: 05-evidence-findings-and-gate-p3
    provides: evidence_items table, finding_evidence_links pattern, audit_events pattern
  - phase: 06-draft-reference-check-gate-p4-and-dashboard
    provides: draft_products table (06-01), engagement-to-draft-product FK

provides:
  - "GET /api/engagements/:id/statements with ref_status/assigned_to filters + priority sort"
  - "POST /api/engagements/:id/statements (≥1 evidence required, 422 otherwise)"
  - "PATCH /api/engagements/:id/statements/:statement_id with evidence replacement, discrepancy validation"
  - "DELETE /api/engagements/:id/statements/:statement_id (blocked on passed status, 409)"
  - "STATEMENT_DISCREPANCY_ASSIGNED audit event when ref_status=failed + assigned_to provided"

affects:
  - 06-03-gate-p4
  - 06-04-dashboard-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "draft_product_id FK bridge: statements join to engagements via draft_products"
    - "Evidence link replacement pattern: delete all + insert new"
    - "Priority sort via CASE WHEN in ORDER BY for workflow state ordering"

key-files:
  created:
    - backend/src/services/statements.service.ts
    - backend/src/routes/statements.ts
  modified:
    - backend/src/routes/engagements.ts

key-decisions:
  - "Adapted to actual DB schema: draft_product_id FK (not engagement_id direct), display_order (not sequence_number), no waived/assigned_back_to columns"
  - "STATEMENT_DISCREPANCY_ASSIGNED audit event uses action/object_type/after_state (consistent with existing audit pattern)"
  - "/export placeholder registered BEFORE /:id in engagements.ts to prevent param capture"
  - "deleteStatement blocks only on ref_status=passed (waived not in DB schema check constraint)"

patterns-established:
  - "Statements bridge pattern: join draft_statements → draft_products → engagements for ownership scoping"
  - "Evidence ID map pattern: batch fetch all evidence links then map by statement_id"

# Metrics
duration: 3min
completed: 2026-06-07
---

# Phase 6 Plan 02: Draft Statements API (F12) Summary

**Statements CRUD API with evidence multi-linking, priority sort, discrepancy validation, and STATEMENT_DISCREPANCY_ASSIGNED audit trail — adapted to actual draft_products FK bridge schema**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-07T00:16:11Z
- **Completed:** 2026-06-07T00:19:04Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Statements service with listStatements (priority sort: not_started→in_review→failed→passed), createStatement (≥1 evidence required), updateStatement (evidence replacement, discrepancy validation), deleteStatement (blocked on passed)
- statementsRouter with 4 routes and correct role guards (read: all authenticated; write: AN/EM/AD; update: AN/EM/IR/AD)
- statementsRouter mounted at `/:id/statements` in engagements.ts with `/export` placeholder registered before `/:id` to prevent parameterized route capture

## Task Commits

Each task was committed atomically:

1. **Task 1: Statements service** - `616274d` (feat)
2. **Task 2: Statements router + wire into engagements.ts** - `799bbd0` (feat)

## Files Created/Modified

- `backend/src/services/statements.service.ts` — listStatements, createStatement, updateStatement, deleteStatement with full business logic
- `backend/src/routes/statements.ts` — Express router with 4 endpoints and role guards
- `backend/src/routes/engagements.ts` — Added statementsRouter mount + /export placeholder before /:id

## Decisions Made

- **Adapted to actual DB schema**: The plan spec described `engagement_id` direct FK, `sequence_number`, `assigned_back_to`, `discrepancy_type`, and `waived` ref_status. The actual migration 002 has `draft_product_id` FK (bridge via draft_products), `display_order`, only `assigned_to` (IR user), no `discrepancy_type`, and no `waived` in check constraint. Implementation adapted to actual schema.
- **Audit event format**: Used `action`/`object_type`/`object_id`/`after_state` (not `action_code`/`target_type`/`target_id`/`metadata`) to match existing audit_events pattern from Phase 5.
- **Discrepancy assignment trigger**: Since `assigned_back_to` doesn't exist in schema, the STATEMENT_DISCREPANCY_ASSIGNED audit event triggers when `ref_status=failed` AND `assigned_to` is provided (IR user assignment for discrepancy review).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted to actual draft_statements schema**
- **Found during:** Task 1 (Statements service)
- **Issue:** Plan spec had `engagement_id` direct column, `sequence_number`, `assigned_back_to`, `discrepancy_type`, and `waived` ref_status. Actual migration 002 schema has `draft_product_id` FK, `display_order`, single `assigned_to`, no `discrepancy_type`, and no `waived` in check constraint.
- **Fix:** Implemented service using actual schema — join via `draft_products` for engagement scoping; `display_order` for ordering; single `assigned_to` for IR assignment; omitted `waived` status; audit event triggers on `ref_status=failed + assigned_to`
- **Files modified:** backend/src/services/statements.service.ts
- **Verification:** TypeScript compiles clean, all 4 exports present

**2. [Rule 1 - Bug] Audit event format adapted**
- **Found during:** Task 1 (Statements service)
- **Issue:** Plan spec used `action_code`/`target_type`/`target_id`/`metadata` column names. Actual audit_events schema uses `action`/`object_type`/`object_id`/`after_state` (as per Phase 5 findings service pattern).
- **Fix:** Used correct column names matching existing pattern
- **Files modified:** backend/src/services/statements.service.ts
- **Verification:** grep confirms STATEMENT_DISCREPANCY_ASSIGNED with correct fields

---

**Total deviations:** 2 auto-fixed (2 schema adaptation bugs)
**Impact on plan:** Both adaptations required to match actual DB schema. All F12 behaviors implemented correctly against actual data model. No scope creep.

## Issues Encountered

None beyond schema adaptations documented above.

## Next Phase Readiness

- F12 statements API complete — ready for F13 Gate P4 prerequisites check (06-03-PLAN.md)
- Gate P4 needs: all statements for engagement have ref_status IN (passed) — can query via draft_products join
- /export placeholder in place for 06-03-PLAN.md

## Self-Check: PASSED

- `backend/src/services/statements.service.ts` — FOUND
- `backend/src/routes/statements.ts` — FOUND
- `06-02-SUMMARY.md` — FOUND
- Commit `616274d` (Task 1) — FOUND
- Commit `799bbd0` (Task 2) — FOUND

---
*Phase: 06-draft-reference-check-gate-p4-and-dashboard*
*Completed: 2026-06-07*
