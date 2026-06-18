---
phase: 04-engagement-setup-and-gate-p2
plan: GAP-05
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/src/services/team.service.ts
autonomous: true
gap_closure: true

features:
  implements: ["F5"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Setting milestone dates and clicking Save succeeds without error; page stays visible and shows status chips"
  artifacts:
    - path: "backend/src/services/team.service.ts"
      provides: "mapMilestone() correctly converts knex Date objects to YYYY-MM-DD strings"
      contains: "instanceof Date"
  key_links:
    - from: "backend/src/services/team.service.ts mapMilestone()"
      to: "MilestoneRecord.target_date"
      via: "instanceof Date guard before toISOString().split('T')[0]"
      pattern: "instanceof Date.*toISOString"

integration_contracts:
  requires: []
  provides:
    - artifact: "backend/src/services/team.service.ts"
      exports: ["mapMilestone", "upsertMilestones", "listMilestones"]
      shape: "mapMilestone uses Date instanceof check: row.target_date instanceof Date ? row.target_date.toISOString().split('T')[0] : String(row.target_date).slice(0, 10)"
      verify: "grep -n 'instanceof Date' backend/src/services/team.service.ts && echo CONTRACT_OK"
---

<objective>
Fix the milestone date mapping bug that causes "Invalid time value" when saving milestones.

Purpose: knex returns PostgreSQL `date` columns as JavaScript `Date` objects (not strings). The existing code `String(row.target_date).slice(0, 10)` calls `String()` on a `Date` object, which produces a locale-formatted string like `"Mon Jun 16 2026 00:00:00 GMT+0000"` — slicing that gives `"Mon Jun 16"`, not `"2026-06-16"`. Downstream, `parseISO("Mon Jun 16")` returns `Invalid Date`, which is truthy, passes the `.filter()`, and then `.toISOString()` throws `"Invalid time value"`. The fix: check `instanceof Date` first and use `.toISOString().split('T')[0]` to get the correct ISO date string.

Output: `team.service.ts` with corrected `mapMilestone()` function.
</objective>

<feature_dependencies>
Implements: F5: Milestones — milestone save returns valid YYYY-MM-DD target_date without error
Depends on: None
Enables: None (unblocks full Gate P2 workflow UAT Test 4)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/phases/04-engagement-setup-and-gate-p2/04-GAP-03-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix mapMilestone() date handling in team.service.ts</name>
  <files>backend/src/services/team.service.ts</files>
  <action>
In `backend/src/services/team.service.ts`, locate `mapMilestone()` (currently at line ~92). Change the `target_date` extraction on line ~96 from:

```ts
const target_date = row.target_date ? String(row.target_date).slice(0, 10) : null;
```

To:

```ts
const target_date = row.target_date
  ? row.target_date instanceof Date
    ? row.target_date.toISOString().split('T')[0]
    : String(row.target_date).slice(0, 10)
  : null;
```

Root cause: knex returns PostgreSQL `date` columns as JavaScript `Date` objects. `String(new Date(...))` produces a locale string such as `"Mon Jun 16 2026 00:00:00 GMT+0000"` — `slice(0, 10)` then yields `"Mon Jun 16"` instead of `"2026-06-16"`. The `instanceof Date` branch uses `.toISOString()` which always produces the canonical `"2026-06-16T00:00:00.000Z"` format; `.split('T')[0]` extracts `"2026-06-16"`. The `String(...).slice(0, 10)` fallback is kept for any code path that may already have a pre-formatted string.

No other changes to the file.
  </action>
  <verify>
```bash
grep -n 'instanceof Date' backend/src/services/team.service.ts && echo "FIX PRESENT"
```
Expected output: the line containing the `instanceof Date` guard followed by `FIX PRESENT`.

Also confirm no TypeScript errors in the service:
```bash
cd backend && npx tsc --noEmit 2>&1 | grep team.service || echo "No TS errors in team.service.ts"
```
  </verify>
  <done>
`team.service.ts` `mapMilestone()` contains the `instanceof Date` guard. POST to `/api/engagements/:id/team/milestones` with valid dates returns 200 with correctly formatted `YYYY-MM-DD` `target_date` values. No "Invalid time value" error is thrown.
  </done>
</task>

</tasks>

<verification>
```bash
grep -n 'instanceof Date' backend/src/services/team.service.ts && echo "VERIFIED"
```
</verification>

<success_criteria>
- `team.service.ts` `mapMilestone()` uses `instanceof Date ? .toISOString().split('T')[0] : String(...).slice(0, 10)` for `target_date`
- No other changes introduced
- File compiles without TypeScript errors
- Milestone save no longer throws "Invalid time value"
</success_criteria>

<output>
After completion, create `.planning/phases/04-engagement-setup-and-gate-p2/04-GAP-05-SUMMARY.md`
</output>
