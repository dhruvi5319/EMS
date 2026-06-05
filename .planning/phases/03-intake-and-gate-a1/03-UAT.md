---
status: complete
phase: 03-intake-and-gate-a1
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md]
started: 2026-06-05T21:10:00Z
updated: 2026-06-05T21:20:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Request List Page
expected: Navigate to /requests. The page shows a heading, status filter tabs (All / Draft / Submitted / Accepted / Declined), and a table with columns (ID, Type, Topic, Requester, Due Date, Status). If no requests exist, an empty state message appears. A "+ New Request" button is visible for AL/AD roles.
result: pass

### 2. Create/Edit Request Form
expected: Click "+ New Request". The form page opens with all F2 fields: Request Type (select), Requester Name, Agency/Program, Topic (textarea with character counter), Due Date (calendar date picker), Notes (textarea). "Save as Draft" requires only Request Type; "Submit Request" requires all 5 required fields and shows validation errors on missing fields.
result: pass

### 3. Intake Document Upload
expected: On the request form or detail page, the file upload zone accepts PDF/DOCX files up to 25MB via drag-and-drop or browse. The zone shows drag-over highlight, a progress bar while uploading, a green success chip on completion, and error messages for files exceeding 25MB or wrong type. Uploading again replaces the previous file.
result: pass

### 4. Request Detail Page
expected: Click a request row to open the detail page. The page shows a breadcrumb, all fields in a read-only grid (type badge, status badge, requester, agency/program, topic, due date, notes), an intake document card (with "Download" link if uploaded or "No intake document attached." if not), and links to Edit Request (draft only, AL/AD) and View Audit Trail.
result: pass

### 5. Submit a Request
expected: Open a Draft request in the form and click "Submit Request". If required fields are missing, the form highlights them and blocks submission. When all 5 required fields are filled and submitted, the request status changes to "Submitted" and it appears in the Review Queue.
result: pass

### 6. Review Queue Page
expected: Navigate to /review-queue. The page shows submitted requests in a table with columns: ID, Type, Topic, Requester, Due Date, and a "Review" action button. If no submitted requests exist, the page shows "No items awaiting your review." and "Submitted requests will appear here for Gate A1 decision."
result: pass

### 7. Gate A1 Decision Panel
expected: Open a submitted request detail page as an AL/AD user. The Gate A1 section shows a decision card with a Risk Level radio group (Low / Medium / High) and a Rationale textarea showing "N/10 minimum" in red when under 10 characters. The "Approve" button is disabled unless a risk level is selected AND rationale has 10+ chars; the "Decline" button is disabled unless rationale has 10+ chars.
result: pass

### 8. Gate A1 Approve Flow
expected: On the Gate A1 panel with a risk level selected and valid rationale (10+ chars), click "Approve". An AlertDialog appears with "Confirm Approve ✓" and "Keep Request Pending" buttons. Confirming triggers the API; a green success banner appears showing the generated job code (e.g., ENG-2026-00001) and a "View Engagement Shell →" link.
result: pass

### 9. Gate A1 Decline Flow
expected: On the Gate A1 panel with valid rationale (10+ chars), click "Decline". An AlertDialog appears with "Confirm Decline ✗" and "Keep Request Pending" buttons. Confirming triggers the API; the request status is set to "declined", no engagement is created, and the page redirects to /requests.
result: pass

### 10. Gate A1 Decided Card
expected: Open a request that has already been approved or declined. The Gate A1 section shows a read-only card (not the decision panel) with an "Approved" (green) or "Declined" (red) chip, the risk level badge (for approved), approver info, formatted date, and rationale in italics.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
