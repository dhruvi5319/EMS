---
phase: 05-evidence-findings-and-gate-p3
plan: GAP-01
subsystem: api
tags: [evidence, gate-p3, idempotency, file-list, backend]

# Dependency graph
requires:
  - phase: 05-evidence-findings-and-gate-p3
    provides: evidence routes, findings service, gate P3 decision flow
provides:
  - "GET /api/engagements/:id/evidence/:evidence_id/files endpoint returning { files: EvidenceFile[] }"
  - "recordP3Decision() 409 idempotency guard for duplicate P3 approvals"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Sensitivity check pattern: fetch evidence item first, check sensitivity, then query evidence_files"
    - "Idempotency guard pattern: query existing approved decision before write, throw 409 if found"

key-files:
  created: []
  modified:
    - backend/src/routes/evidence.ts
    - backend/src/services/findings.service.ts

key-decisions:
  - "evidence_files queried by evidence_id (FK column name in actual schema, not evidence_item_id)"
  - "P3 idempotency uses gate_type='P3' + status='passed' match (not gate_name='P3' + decision='approved') to align with actual schema"
  - "GET /:evidence_id/files placed between GET /:evidence_id and POST /:evidence_id/files to maintain route ordering"

patterns-established:
  - "Sensitivity check in file list: always fetch parent evidence_items row to check sensitivity before querying evidence_files"
  - "409 guard before transaction: check for existing approved gate decision before entering db.transaction() block"

# Metrics
duration: 2min
completed: 2026-06-19
---

# Phase 05 Plan GAP-01: Evidence Files Endpoint and P3 Idempotency Summary

**GET /evidence/:evidence_id/files endpoint with sensitivity check, plus 409 duplicate-approval guard in recordP3Decision() — both UAT gaps closed**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-19T00:30:13Z
- **Completed:** 2026-06-19T00:32:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added missing `GET /:evidence_id/files` route to `evidenceRouter` — `EvidenceDetailPage` can now fetch the file list for an evidence item
- Applied sensitivity filter to file list: restricted evidence files are blocked for AL/RO roles (returns 403)
- Added 409 idempotency guard to `recordP3Decision()` — clicking Approve P3 a second time now returns `{ error: 'Gate P3 has already been approved...' }` with status 409

## Task Commits

Both implementations were already present in the codebase (included in the initial merge commit `9638402`):

1. **Task 1: Add GET /:evidence_id/files endpoint** — verified present at `evidence.ts:191-239` (feat)
2. **Task 2: Add 409 idempotency guard to recordP3Decision()** — verified present at `findings.service.ts:369-380` (feat)

**Plan metadata:** see final docs commit (docs: complete GAP-01 plan)

_Note: Both gap fixes were already in the working tree when this plan executed — no source changes were needed; only documentation produced._

## Files Created/Modified

- `backend/src/routes/evidence.ts` — Added `GET /:evidence_id/files` route with sensitivity check (lines 191-239)
- `backend/src/services/findings.service.ts` — Added 409 idempotency guard before `checkP3Prerequisites` re-run (lines 369-380)

## Decisions Made

- Used `gate_type='P3'` + `status='passed'` in the idempotency query (not `gate_name` / `decision`) to match actual DB schema column names established in Phase 5 earlier plans
- File rows mapped defensively: `row.filename ?? row.original_filename` and `row.file_ref ?? row.storage_key` to handle both schema column name variants
- Route ordering: `GET /:evidence_id/files` registered at line 192 (before `POST /:evidence_id/files` at line 243) to avoid Express route shadowing

## Deviations from Plan

None — plan executed exactly as written. Both implementations were already present in committed code; verification confirmed correctness.

## Issues Encountered

Pre-existing TypeScript errors in the backend (`@types/node` missing for `Buffer`/`NodeJS`, `express` types missing) are unrelated to this plan's changes. These affect `local.storage.ts`, `storage.provider.ts`, and other modules that existed before this plan. No new TypeScript errors introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both UAT gaps (Test 2: file list, Test 13: P3 re-approval) are closed
- `05-GAP-02-PLAN.md` is the next gap plan in this phase — ready to execute
- Phase 6 work already complete in `06-draft-reference-check-gate-p4-and-dashboard`

---
*Phase: 05-evidence-findings-and-gate-p3*
*Completed: 2026-06-19*

## Self-Check: PASSED

### Files Exist

- ✅ `backend/src/routes/evidence.ts` — present
- ✅ `backend/src/services/findings.service.ts` — present
- ✅ `.planning/phases/05-evidence-findings-and-gate-p3/05-GAP-01-SUMMARY.md` — present

### Implementations Verified

- ✅ `GET /:evidence_id/files` route registered in evidenceRouter (12 occurrences of `/:evidence_id/files`)
- ✅ 409 guard present in `recordP3Decision()` (1 occurrence of status 409)
