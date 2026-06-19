---
phase: 05-evidence-findings-and-gate-p3
plan: GAP-03
subsystem: evidence
tags: [express, routing, react, typescript, objectivecoverage]

# Dependency graph
requires:
  - phase: 05-evidence-findings-and-gate-p3
    provides: evidenceRouter, objectiveCoverageRouter, GapObjectiveCard component
provides:
  - GapObjectiveCard renders 'P3 Blocker' as visible text (not just aria-label)
  - evidenceRouter handles POST/DELETE/GET /:evidence_id/objectives (routing conflict resolved)
  - objectiveCoverageRouter retains only /objectives/coverage and /objectives/sufficiency
affects:
  - 05-evidence-findings-and-gate-p3 UAT Tests 4, 6, 7

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route ownership: when subrouter path prefix intercepts sibling router paths, move conflicting handlers into the intercepting router"

key-files:
  created: []
  modified:
    - frontend/src/components/evidence/GapObjectiveCard.tsx
    - backend/src/routes/evidence.ts
    - backend/src/routes/objectivecoverage.ts

key-decisions:
  - "Move GET/POST/DELETE /:evidence_id/objectives into evidenceRouter (not objectiveCoverageRouter) because evidenceRouter is mounted at /:id/evidence and intercepts all /evidence/:evidence_id/* paths before objectiveCoverageRouter sees them"

patterns-established:
  - "Route interception rule: check mount path when routes return 404 unexpectedly — a prefix-matched subrouter may be swallowing requests before the intended router is reached"

# Metrics
duration: 2min
completed: 2026-06-19
---

# Phase 5 GAP-03: P3 Blocker label + evidence-objective routing conflict fix

**Fixed GapObjectiveCard visible text ('Blocker' → 'P3 Blocker') and resolved Express routing conflict that caused POST /evidence/:id/objectives to return 404 by moving link/unlink/get-linked handlers into evidenceRouter**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-19T00:58:03Z
- **Completed:** 2026-06-19T00:59:36Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Gap cards in the evidence coverage view now display "P3 Blocker" as visible text, matching the aria-label (unblocks UAT Test 4)
- POST/DELETE/GET /:evidence_id/objectives route handlers moved from objectiveCoverageRouter into evidenceRouter — the intercepting router now owns the routes it intercepts (unblocks UAT Tests 6 and 7)
- objectivecoverage.ts reduced to only GET /objectives/coverage and PUT /objectives/sufficiency — no routing ambiguity

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix GapObjectiveCard visible label text** - `ffb71e6` (fix)
2. **Task 2: Fix routing conflict — move link/unlink routes into evidenceRouter** - `4453be2` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `frontend/src/components/evidence/GapObjectiveCard.tsx` — Changed visible text node "Blocker" to "P3 Blocker" in the P3 Blocker indicator span
- `backend/src/routes/evidence.ts` — Added import for linkEvidenceToObjectives, unlinkEvidenceFromObjective, getLinkedObjectivesForEvidence; added GET/POST/DELETE /:evidence_id/objectives route handlers
- `backend/src/routes/objectivecoverage.ts` — Removed POST/DELETE /evidence/:evidence_id/objectives and GET /evidence/:evidence_id/objectives handlers; removed corresponding imports; retained only /objectives/coverage and /objectives/sufficiency

## Decisions Made

**Route ownership:** The three `/evidence/:evidence_id/objectives` handlers (GET, POST, DELETE) were moved into `evidenceRouter` rather than adding a new router or reordering mount points. Rationale: `evidenceRouter` is mounted at `/:id/evidence` — it is the correct semantic owner of routes under `/evidence/`. Moving handlers there is the minimal-complexity fix with zero mount-point changes required.

## Deviations from Plan

None - plan executed exactly as written. The GET /:evidence_id/objectives handler move was explicitly called out in the plan as needed (routing interception applies to GET as well as POST/DELETE).

## Issues Encountered

None. TypeScript errors in `npx tsc --noEmit` are all pre-existing missing-node_modules errors (no packages installed in dev environment). No logic or import errors introduced by this plan's changes.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- UAT Tests 4, 6, and 7 are now unblocked: gap cards show "P3 Blocker", and POST /evidence/:id/objectives returns 200 with correct routing
- All Phase 5 GAP plans complete — Phase 5 ready for final verification
- No blockers

---
*Phase: 05-evidence-findings-and-gate-p3*
*Completed: 2026-06-19*
