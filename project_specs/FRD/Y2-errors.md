---

## Y2: Cross-Feature Error Catalog

This catalog lists all application error codes, their HTTP status codes, the features that produce them, and guidance for client handling. All error responses follow the standard envelope defined in `Y1-api.md`.

---

### §Authentication and Authorization Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `UNAUTHORIZED` | 401 | F00 | "Authentication required." | Redirect to login |
| `AUTH_INVALID` | 401 | F00 | "Invalid username or password." | Show login error |
| `AUTH_LOCKED` | 403 | F00 | "Account locked. Try again in 15 minutes." | Show lockout message |
| `FORBIDDEN` | 403 | All | "You do not have permission to perform this action." | Show access denied message |
| `RESTRICTED_ACCESS_DENIED` | 403 | F08 | "You are not authorized to download restricted evidence files." | Hide download link for unauthorized roles |

---

### §Validation Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `VALIDATION_ERROR` | 422 | All | Field-level errors in `errors` array | Highlight affected fields |
| `NOT_FOUND` | 404 | All | "{Entity} not found." | Show 404 page or inline message |
| `FILE_TYPE_NOT_ALLOWED` | 422 | F02, F08, F11 | "File type not permitted. Allowed: [list]." | Show file type error near upload field |
| `FILE_TOO_LARGE` | 422 | F02, F08, F11 | "File exceeds maximum size of {n} MB." | Show size error near upload field |
| `FILE_LIMIT_EXCEEDED` | 422 | F08 | "Maximum of 20 files per evidence item." | Disable upload button when limit reached |
| `STORAGE_ERROR` | 503 | F02, F08, F11 | "File could not be saved. Please try again." | Show retry option |

---

### §Request Lifecycle Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `REQUEST_NOT_EDITABLE` | 409 | F02 | "Request cannot be edited after submission." | Hide Edit button for non-draft requests |
| `REQUEST_ALREADY_SUBMITTED` | 409 | F02 | "Request has already been submitted." | Disable Submit button |

---

### §Gate Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `GATE_PREREQUISITE_FAILED` | 409 | F03, F07, F10, F13 | Specific prerequisite message (see feature chunk) | Display blockers list; disable gate button |
| `GATE_FIELDS_INCOMPLETE` | 422 | F03, F07 | "Required fields missing: [field list]." | Highlight missing fields on review form |
| `GATE_ALREADY_DECIDED` | 409 | F03 | "This request has already been accepted or declined." | Hide decision controls |
| `P2_PREREQUISITE_FAILED` | 422 | F06 | Specific P2 blocker message | Highlight the failing section |
| `PHASE_PREREQUISITE_FAILED` | 409 | F10, F11, F13 | "Required gate has not been approved." | Show gate status and link to gate page |

---

### §Team and Assignment Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `ASSIGNMENT_DUPLICATE` | 409 | F05 | "This user already holds this role on the engagement." | Disable duplicate assignment |
| `TEAM_MIN_VIOLATED` | 409 | F05 | "Cannot remove the last Engagement Manager from the team." | Block remove action |
| `REFERENCE_CHECK_PREREQ` | 422 | F12 | "Statement must be linked to at least one evidence item before reference check can begin." | Show link evidence prompt |

---

### §Evidence and Link Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `EVIDENCE_LINKED` | 409 | F08 | "Cannot delete evidence — it is linked to objectives or findings. Unlink first." | Show which links must be removed |
| `CROSS_ENGAGEMENT_LINK` | 422 | F09, F10, F12 | "{Entity} does not belong to this engagement." | Filter selectors to same engagement |
| `LINK_DUPLICATE` | 409 | F09, F10, F12 | "This item is already linked." | Suppress duplicate link UI action |
| `EVIDENCE_REQUIRED` | 422 | F10 | "Cannot set status — no evidence is linked to this objective." | Show "add evidence" prompt |
| `FINDING_EVIDENCE_REQUIRED` | 409 | F09 | "Cannot unlink — this evidence is the only link for a finding under review." | Show affected finding |
| `OBJECTIVE_HAS_EVIDENCE` | 409 | F06 | "Cannot delete objective — it has linked evidence items." | Show unlink prompt |

---

### §Draft Product and Status Errors

| Code | HTTP | Feature | Message | Client Action |
|---|---|---|---|---|
| `DRAFT_EXISTS` | 409 | F11 | "A draft product record already exists for this engagement." | Navigate to existing draft |
| `INVALID_STATUS_TRANSITION` | 409 | F11 | "Status cannot transition from {from} to {to}." | Show allowed transitions |
| `STATUS_LOCKED` | 422 | F04 | "Status can only be set through gate approval." | Remove manual status option from UI |

---

### §Audit Action Codes (for `audit_events.action` field)

| Action Code | Triggered By | Feature |
|---|---|---|
| `REQUEST_CREATED` | Create request (draft) | F02 |
| `REQUEST_UPDATED` | Edit request | F02 |
| `REQUEST_SUBMITTED` | Submit request | F02 |
| `REQUEST_DOCUMENT_UPLOADED` | Upload intake document | F02 |
| `GATE_A1_APPROVED` | A1 approval | F03 |
| `GATE_A1_DECLINED` | A1 decline | F03 |
| `ENGAGEMENT_UPDATED` | Edit engagement metadata | F04 |
| `TEAM_MEMBER_ASSIGNED` | Add team member | F05 |
| `TEAM_MEMBER_REMOVED` | Remove team member | F05 |
| `MILESTONES_UPDATED` | Set milestone dates | F05 |
| `PLANNING_RECORD_CREATED` | Create planning record | F06 |
| `PLANNING_RECORD_UPDATED` | Edit planning record | F06 |
| `PLANNING_SUBMITTED_FOR_REVIEW` | Submit planning for P2 | F06 |
| `PLANNING_RECORD_REVISED` | Edit post-P2 approval | F06 |
| `GATE_P2_APPROVED` | P2 approval | F07 |
| `GATE_P2_RETURNED` | P2 return | F07 |
| `EVIDENCE_ITEM_CREATED` | Create evidence item | F08 |
| `EVIDENCE_ITEM_UPDATED` | Update evidence item | F08 |
| `EVIDENCE_ITEM_DELETED` | Delete evidence item | F08 |
| `EVIDENCE_FILE_UPLOADED` | Upload evidence file | F08 |
| `EVIDENCE_FILE_DOWNLOADED` | Download evidence file | F08 |
| `EVIDENCE_RESTRICTED` | Change sensitivity to restricted | F08 |
| `EVIDENCE_OBJECTIVE_LINKED` | Link evidence to objective | F09 |
| `EVIDENCE_OBJECTIVE_UNLINKED` | Unlink evidence from objective | F09 |
| `EVIDENCE_CSV_EXPORTED` | Export evidence registry CSV | F09 |
| `FINDING_CREATED` | Create finding | F10 |
| `FINDING_EVIDENCE_LINKED` | Link finding to evidence | F10 |
| `OBJECTIVE_STATUS_UPDATED` | Update objective status | F10 |
| `GATE_P3_APPROVED` | P3 approval | F10 |
| `DRAFT_PRODUCT_CREATED` | Create draft product | F11 |
| `DRAFT_PRODUCT_UPDATED` | Update draft product | F11 |
| `DRAFT_FILE_ATTACHED` | Attach draft file | F11 |
| `DRAFT_FILE_DOWNLOADED` | Download draft file | F11 |
| `DRAFT_STATUS_CHANGED` | Advance draft status | F11 |
| `DRAFT_COMMENT_ADDED` | Add review comment | F11 |
| `STATEMENT_CREATED` | Create draft statement | F12 |
| `STATEMENT_EVIDENCE_LINKED` | Link statement to evidence | F12 |
| `REFERENCE_CHECK_ASSIGNED` | Assign to IR | F12 |
| `REFERENCE_STATUS_CHANGED` | IR updates reference status | F12 |
| `REFERENCE_FAILED_DISCREPANCY` | Reference check failed | F12 |
| `REFERENCE_CHECK_WAIVED` | Waive reference check | F12 |
| `GATE_P4_APPROVED` | P4 approval | F13 |
| `ENGAGEMENT_CLOSED` | Close engagement | F13 |
| `ENGAGEMENT_REGISTER_EXPORTED` | Export engagement register CSV | F14 |
| `USER_ROLE_ASSIGNED` | Admin assigns user role | F00 |
| `USER_ROLE_REMOVED` | Admin removes user role | F00 |
| `USER_LOGIN` | Successful login | F00 |
| `USER_LOGIN_FAILED` | Failed login attempt | F00 |
| `USER_ACCOUNT_LOCKED` | Account locked after repeated failures | F00 |
| `AUDIT_LOG_EXPORTED` | Admin exports audit log CSV | F00 |
