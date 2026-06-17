---
phase: 02-application-shell
plan: "GAP-01"
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/layout/TopBar.tsx
autonomous: true
gap_closure: true

features:
  implements: ["F0"]
  depends_on: []
  enables: []

must_haves:
  truths:
    - "Pressing Ctrl+K / ⌘K from anywhere in the app focuses the search input and opens the overlay"
    - "Clicking the search bar in the top bar opens the overlay"
    - "Typing a single character shows 'Type at least 2 characters to search.' with no API call"
    - "Typing 2+ characters shows engagement results with title, job code, phase badge, and owner name"
    - "Pressing Escape closes the overlay"
  artifacts:
    - path: "frontend/src/components/layout/TopBar.tsx"
      provides: "TopBar renders <GlobalSearchBar /> in the center slot (not the disabled stub)"
      contains: "GlobalSearchBar"
    - path: "frontend/src/components/search/GlobalSearchBar.tsx"
      provides: "Fully interactive search bar with ⌘K/Ctrl+K, overlay, and keyboard nav"
      exports: ["GlobalSearchBar"]
  key_links:
    - from: "frontend/src/components/layout/TopBar.tsx"
      to: "frontend/src/components/search/GlobalSearchBar.tsx"
      via: "import { GlobalSearchBar } and render <GlobalSearchBar /> in center flex slot"
      pattern: "GlobalSearchBar"

integration_contracts:
  requires: []
  provides:
    - artifact: "frontend/src/components/layout/TopBar.tsx"
      exports: ["TopBar"]
      shape: |
        TopBar renders <GlobalSearchBar /> in the center flex slot.
        The disabled <input> stub (lines 34–44) is removed.
      verify: "grep -n 'GlobalSearchBar' frontend/src/components/layout/TopBar.tsx && echo CONTRACT_OK"
---

<objective>
Mount `GlobalSearchBar` in `TopBar.tsx` by replacing the disabled stub input with the fully-implemented component.

Purpose: `GlobalSearchBar` is complete and correct (`frontend/src/components/search/GlobalSearchBar.tsx`) but was never imported or rendered anywhere. `TopBar.tsx` still carries the original disabled `<input>` placeholder from Phase 1. The UAT failures for Tests 4 and 5 share this single root cause — the keyboard listener and interactive input never enter the DOM.

Output: `TopBar.tsx` updated — one import added, stub block removed, `<GlobalSearchBar />` rendered in its place. No other files change.
</objective>

<feature_dependencies>
Implements: F0: Global search — ⌘K/Ctrl+K overlay, min-2-char guard, debounced engagement results
Depends on: None (GlobalSearchBar already fully implemented in 02-04-PLAN.md; this plan only wires the mount point)
Enables: None
</feature_dependencies>

<execution_context>
@/root/.config/opencode/pivota_spec-framework/workflows/execute-plan.md
@/root/.config/opencode/pivota_spec-framework/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-application-shell/02-04-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace disabled stub with &lt;GlobalSearchBar /&gt; in TopBar.tsx</name>
  <files>frontend/src/components/layout/TopBar.tsx</files>
  <action>
The current `TopBar.tsx` (lines 34–44) renders a disabled, non-interactive `<input>` stub:

```tsx
{/* Search — center slot */}
<div className="flex-1 mx-6">
  <div className="max-w-md mx-auto" id="global-search-container">
    <input
      type="text"
      placeholder="Search engagements, requests..."
      disabled
      className="w-full h-9 rounded-[var(--r-md)] border border-[var(--c-border)] px-3 text-[13px] text-[var(--c-text-3)] bg-[var(--c-sunken)] cursor-not-allowed font-sans"
      aria-label="Global search (coming soon)"
    />
  </div>
</div>
```

Make these two changes:

**1. Add import at the top of the file** (after the existing imports):
```tsx
import { GlobalSearchBar } from '@/components/search/GlobalSearchBar';
```

**2. Replace the entire stub block** (the `{/* Search — center slot */}` comment through the closing `</div>`) with:
```tsx
{/* Global search */}
<GlobalSearchBar />
```

`GlobalSearchBar` already manages its own `flex-1 mx-6 max-w-[640px]` wrapper — no extra wrapper div is needed. The surrounding `<header>` flex container will position it correctly between the wordmark and the user menu.

**Do NOT change** anything else in `TopBar.tsx` — the wordmark div, user menu div, header classNames, and logout handler must remain exactly as they are.
  </action>
  <verify>
# 1. Import is present
grep -n "import.*GlobalSearchBar.*from" frontend/src/components/layout/TopBar.tsx && echo "IMPORT_OK"

# 2. GlobalSearchBar is rendered (JSX element in file)
grep -n "&lt;GlobalSearchBar" frontend/src/components/layout/TopBar.tsx || grep -n '<GlobalSearchBar' frontend/src/components/layout/TopBar.tsx && echo "RENDERED_OK"

# 3. Disabled stub is gone
grep -n 'cursor-not-allowed\|aria-label="Global search (coming soon)"\|disabled' frontend/src/components/layout/TopBar.tsx && echo "STUB_STILL_PRESENT — FAIL" || echo "STUB_REMOVED_OK"

# 4. TypeScript compiles without errors
cd frontend && npx tsc --noEmit 2>&1 | tail -20 && echo "TSC_OK"
  </verify>
  <done>
`frontend/src/components/layout/TopBar.tsx` imports `GlobalSearchBar` from `@/components/search/GlobalSearchBar` and renders `&lt;GlobalSearchBar /&gt;` in the center flex slot. The disabled `&lt;input&gt;` stub and its wrapper divs are removed. `npx tsc --noEmit` exits 0. The browser: clicking the search area focuses the input; pressing Ctrl+K / ⌘K from anywhere in the app focuses the input and opens the overlay; typing 1 character shows "Type at least 2 characters to search."; typing 2+ characters triggers the debounced API call and shows results; Escape closes the overlay.
  </done>
</task>

</tasks>

<verification>
```bash
# 1. Import present
grep -n 'GlobalSearchBar' frontend/src/components/layout/TopBar.tsx && echo PASS

# 2. Disabled stub removed
grep -n 'cursor-not-allowed\|coming soon' frontend/src/components/layout/TopBar.tsx && echo "FAIL — stub still present" || echo "PASS — stub removed"

# 3. GlobalSearchBar component still exports correctly (unchanged)
grep -n 'export function GlobalSearchBar' frontend/src/components/search/GlobalSearchBar.tsx && echo PASS

# 4. Ctrl+K listener in GlobalSearchBar (unchanged — just confirming it's wired)
grep -n 'ctrlKey\|metaKey' frontend/src/components/search/GlobalSearchBar.tsx && echo PASS

# 5. TypeScript clean
cd frontend && npx tsc --noEmit 2>&1 | tail -5 && echo "TSC PASS"
```

**Manual verification (UAT re-run):**
1. Open http://localhost:5173 and log in.
2. Press Ctrl+K — the search input in the top bar focuses and the overlay becomes active.
3. Type `a` (single character) — overlay shows "Type at least 2 characters to search."; no network request fires.
4. Type a second character (e.g. `ab`) — overlay shows loading skeletons then results (or "No engagements found.").
5. Press Escape — overlay closes.
6. Click directly on the search bar — input is focusable and the overlay opens on typing.
</verification>

<success_criteria>
- `TopBar.tsx` contains `import { GlobalSearchBar }` and renders `<GlobalSearchBar />` — verified by grep
- No `disabled`, `cursor-not-allowed`, or `"Global search (coming soon)"` text remains in `TopBar.tsx`
- `npx tsc --noEmit` in `frontend/` exits 0 (no TypeScript errors introduced)
- UAT Test 4: Ctrl+K / ⌘K opens the overlay — passes
- UAT Test 5: Single character shows min-chars guard; 2+ characters triggers search — passes
</success_criteria>

<output>
After completion, create `.planning/phases/02-application-shell/02-GAP-01-SUMMARY.md`
</output>
