---
status: complete
phase: 03-intake-and-gate-a1
source: [03-GAP-01-SUMMARY.md]
started: 2026-06-18T15:35:00Z
updated: 2026-06-18T17:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Intake Document Upload
expected: On a draft request detail page (as AL/AD user), the file upload zone is visible and functional — accepts PDF/DOCX up to 25MB via drag-and-drop or browse button. Shows drag-over highlight, progress bar while uploading, green success chip on completion, and error messages for oversized or wrong-type files. Uploading a second file replaces the first.
result: pass

### 2. Gate A1 Approve Flow (no blank screen)
expected: On a submitted request, fill in Risk Level and Rationale (10+ chars), click Approve, confirm in AlertDialog. The page stays on the request detail — NO blank screen. A green success banner appears in-place showing the generated job code (e.g. ENG-2026-00001) and a "View Engagement Shell →" link.
result: pass

### 3. Gate A1 Decided Card (real data + navigation)
expected: On an already-approved request, the Gate A1 section shows a read-only decided card with: real approver name (not placeholder), risk level badge, formatted date, rationale in italics. "View Gate History →" button navigates to the engagement audit trail. "View Audit Trail →" link (bottom of page) also navigates correctly to the engagement audit trail — not /dashboard.
result: pass
fix: "Changed 'u.full_name' to 'u.display_name' in both SELECT clauses of GET /api/requests/:id/gate/decision (approved path line 28, declined path line 57) in backend/src/routes/gate.ts — column name matched users table schema, resolving PostgreSQL error that was silently swallowed by frontend catch()"
gap: GAP-02
status: resolved

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0

## Gaps

- truth: "Gate A1 decided card shows real approver name, risk level badge, formatted date, rationale in italics; View Gate History navigates to engagement audit trail; View Audit Trail link visible and navigates correctly"
  status: resolved
  resolution: "Changed 'u.full_name' to 'u.display_name' in both SELECT clauses of GET /api/requests/:id/gate/decision (lines 28 and 57 of backend/src/routes/gate.ts). PostgreSQL error was silently swallowed by frontend catch(); fix corrects the column name mismatch with users table schema (migration 001 defines display_name). gateDecision now populated correctly — approver name, rationale, and View Audit Trail link all render."
  gap: GAP-02
  test: 3
  debug_session: ".planning/debug/gate-a1-decided-card-missing-data.md"
