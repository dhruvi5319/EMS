---
status: complete
phase: 02-application-shell
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md, 02-GAP-01-SUMMARY.md
started: 2026-06-05T20:00:00Z
updated: 2026-06-18T00:00:00Z
gap_closed: 2026-06-17
gap_plan: 02-GAP-01-PLAN.md
gap_verified: 2026-06-18
---

## Current Test

[testing complete]

## Tests

### 1. Stack Startup and Login
expected: Run `docker compose up` from the project root. All 4 services start without errors (postgres, minio, backend on port 3001, frontend on port 5173). Navigate to http://localhost:5173 — you are redirected to the login page. Log in with the admin seed credentials. You are taken to the Dashboard page.
result: pass

### 2. Role-Filtered Navigation
expected: While logged in as an admin (AD role), you see all navigation sections in the sidebar: Dashboard, Engagements, Requests, Evidence, Review Queue, Reports, Admin. Log out and log in as a non-admin user (e.g. AN role) — Requests, Review Queue, Reports, and Admin sections are hidden from the sidebar.
result: pass

### 3. Forbidden Page — Direct URL Access
expected: While logged in as a non-admin user, navigate directly to http://localhost:5173/admin/users. Instead of being redirected, the page stays at that URL but shows a 403 "Access Denied" screen with a ShieldX icon and a "← Go back to Dashboard" link. The sidebar and top bar remain visible.
result: pass

### 4. Global Search — Overlay Opens
expected: Press ⌘K (Mac) or Ctrl+K (Windows/Linux) anywhere in the app. A search overlay appears in the top bar area. Type at least 2 characters — results appear with engagement title, job code, phase badge, and owner name. Pressing Escape closes the overlay.
result: pass
gap_fix: 02-GAP-01-PLAN.md — GlobalSearchBar wired into TopBar.tsx, disabled stub removed
reverified: 2026-06-18

### 5. Global Search — Minimum Chars Guard
expected: Click into the search bar and type a single character (e.g., "a"). The overlay shows a "Type at least 2 characters" message and no results appear. No API call is made. Typing a second character triggers the search.
result: pass
gap_fix: 02-GAP-01-PLAN.md — GlobalSearchBar now mounted; min-chars logic reachable
reverified: 2026-06-18

### 6. User Management — Create and Manage Users
expected: Navigate to /admin/users (as admin). You see a "User Management" page with a table of users and a "+ Create User" button. Click it — a dialog opens with Full Name, Username, Email, Password fields and role checkboxes (AL/EM/AN/QA/IR/PC/RO/AD). Fill in details, select at least one role, submit. The new user appears in the table. Click Edit Roles on the user — pre-populated role checkboxes appear and can be changed. Click Deactivate — an alert dialog asks for confirmation. After confirming, the user shows as "Deactivated" status.
result: pass

### 7. Audit Trail — View and Filter Events
expected: Navigate to /engagements/1/audit (or any valid engagement ID). You see an "Audit Trail — [ID]" page with a filter row (action type select, date from/to, Apply Filters button) and a timeline of audit event cards. Each card shows timestamp, actor name, role badges, a monospace action code badge, and a summary. The "Apply Filters" button filters the list; "Clear filters" resets it. If there are more than 20 events, a "Load More" button appears.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

- truth: "Pressing Ctrl+K / ⌘K opens a search overlay in the top bar area; clicking the search bar also opens the overlay; typing 2+ characters shows results"
  status: fixed
  reason: "User reported: On cmd K nothing opens and when I try to click the search bar which is on top, right besides the logout button and the user name symbol, I cannot click it as well"
  severity: major
  test: 4
  root_cause: "TopBar.tsx renders a hardcoded disabled <input> stub instead of <GlobalSearchBar />. The GlobalSearchBar component is fully implemented but never imported or rendered anywhere in the component tree, so the keydown listener is never registered and the bar is never interactive."
  fix: "02-GAP-01-PLAN.md — Replaced disabled stub with <GlobalSearchBar /> in TopBar.tsx"
  fix_verified: 2026-06-18
  artifacts:
    - path: "frontend/src/components/layout/TopBar.tsx"
      issue: "Lines 34-44 render a disabled input placeholder stub; GlobalSearchBar is never imported or used"
    - path: "frontend/src/components/search/GlobalSearchBar.tsx"
      issue: "Fully implemented but orphaned — no import site exists in the entire frontend/src"
  missing:
    - "Import GlobalSearchBar in TopBar.tsx"
    - "Replace the disabled stub input div with <GlobalSearchBar />"
  debug_session: ".planning/debug/global-search-not-opening.md"

- truth: "Typing a single character in the search bar shows a 'Type at least 2 characters' prompt; typing 2+ characters triggers a search"
  status: fixed
  reason: "User reported: Same issue as before — search bar is not clickable and Ctrl+K / ⌘K does not open the overlay"
  severity: major
  test: 5
  root_cause: "Same root cause as Test 4 — GlobalSearchBar is not mounted, so none of its interaction logic (min chars guard, API call, overlay) is reachable."
  fix: "02-GAP-01-PLAN.md — GlobalSearchBar now mounted in TopBar.tsx"
  fix_verified: 2026-06-18
  artifacts:
    - path: "frontend/src/components/layout/TopBar.tsx"
      issue: "Disabled stub renders instead of GlobalSearchBar"
  missing:
    - "Fix is shared with Test 4: mount GlobalSearchBar in TopBar.tsx"
  debug_session: ".planning/debug/global-search-not-opening.md"
