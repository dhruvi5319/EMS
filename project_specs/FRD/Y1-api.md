---

## Y1: REST API Catalog

All endpoints are prefixed with `/api/v1`. All requests and responses use `Content-Type: application/json` unless noted (multipart for file uploads). Authentication is required for all endpoints (session cookie or `Authorization: Bearer <token>`).

Standard response envelope:
```json
{
  "data": { ... },
  "meta": { "timestamp": "2026-06-04T00:00:00Z" }
}
```
Error response envelope:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "errors": [ { "field": "field_name", "message": "..." } ]
  }
}
```

---

### §Auth — Authentication and Users

| Method | Path | Description | Roles |
|---|---|---|---|
| `POST` | `/auth/login` | Login; returns session token | Public |
| `POST` | `/auth/logout` | Logout; revokes session | Authenticated |
| `GET` | `/users` | List all users | AD |
| `POST` | `/users` | Create user | AD |
| `GET` | `/users/{id}` | Get user by ID | AD |
| `PATCH` | `/users/{id}` | Update user fields | AD |
| `PUT` | `/users/{id}/roles` | Replace user's role list | AD |
| `GET` | `/users/me` | Get current user profile | Authenticated |

**POST /auth/login**
```
Request:  { "email": "string", "password": "string" }
Response: { "data": { "token": "string", "user": { "id", "email", "full_name", "roles": [] } } }
```

---

### §Requests

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/requests` | List requests (filterable by status) | AL, AD, RO |
| `POST` | `/requests` | Create new request (draft) | AL, AD |
| `GET` | `/requests/{id}` | Get request detail | AL, AD, EM, RO |
| `PATCH` | `/requests/{id}` | Update request (draft only) | AL, AD |
| `POST` | `/requests/{id}/submit` | Submit request for A1 | AL, AD |
| `POST` | `/requests/{id}/document` | Upload intake document (multipart) | AL, AD |
| `GET` | `/requests/{id}/document` | Download intake document | AL, AD, EM |

**POST /requests**
```
Request: {
  "request_type": "congressional_request|mandate|internal_proposal",
  "requester": "string?",
  "topic": "string?",
  "agency_program": "string?",
  "due_date": "YYYY-MM-DD?",
  "notes": "string?"
}
Response 201: { "data": { "id": "uuid", "status": "draft", ... } }
```

**POST /requests/{id}/document** — multipart/form-data
```
Field: file (binary, required)
Response 200: { "data": { "intake_document_name": "string", "intake_document_ref": "string" } }
```

---

### §Engagements

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements` | List engagements (filterable) | All (scoped by access) |
| `GET` | `/engagements/{id}` | Get engagement detail | All (scoped) |
| `PATCH` | `/engagements/{id}` | Update engagement metadata | EM, AD |
| `GET` | `/engagements/{id}/blockers` | Get computed blockers list | All (scoped) |
| `GET` | `/engagements` (CSV) | Export engagement register; `Accept: text/csv` | AL, EM, AN, QA, PC, RO, AD |

**PATCH /engagements/{id}**
```
Request: {
  "title": "string?",
  "phase": "string?",
  "status": "string?",
  "risk_level": "string?",
  "owner_id": "uuid?",
  "portfolio": "string?",
  "revision_note": "string? (required if phase changes)"
}
Response 200: { "data": { engagement object } }
```

---

### §Team and Milestones

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/team` | List team assignments | All (scoped) |
| `POST` | `/engagements/{id}/team` | Add team member | EM, AD |
| `DELETE` | `/engagements/{id}/team/{assignment_id}` | Remove team member | EM, AD |
| `GET` | `/engagements/{id}/milestones` | Get milestone dates and status | All (scoped) |
| `PUT` | `/engagements/{id}/milestones` | Set/update all milestone dates | EM, AD |

**POST /engagements/{id}/team**
```
Request: { "user_id": "uuid", "role": "AL|EM|AN|QA|IR|PC|RO" }
Response 201: { "data": { "id": "uuid", "user_id", "role", "assigned_at" } }
```

**PUT /engagements/{id}/milestones**
```
Request: {
  "planning_approval_target": "YYYY-MM-DD?",
  "evidence_readiness_target": "YYYY-MM-DD?",
  "draft_readiness_target": "YYYY-MM-DD?",
  "final_readiness_target": "YYYY-MM-DD?"
}
Response 200: { "data": { milestone object with computed status fields } }
```

---

### §Planning

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/planning` | Get planning record | All (scoped) |
| `POST` | `/engagements/{id}/planning` | Create planning record | EM, AD |
| `PATCH` | `/engagements/{id}/planning` | Update planning record | EM, AN, AD |
| `POST` | `/engagements/{id}/planning/submit` | Submit for P2 review | EM, AD |
| `GET` | `/engagements/{id}/planning/objectives` | List objectives | All (scoped) |
| `POST` | `/engagements/{id}/planning/objectives` | Add objective | EM, AN, AD |
| `PATCH` | `/engagements/{id}/planning/objectives/{obj_id}` | Update objective | EM, AN, AD |
| `DELETE` | `/engagements/{id}/planning/objectives/{obj_id}` | Delete objective (if no linked evidence) | EM, AD |
| `GET` | `/engagements/{id}/planning/revisions` | List planning revisions | EM, QA, AD |

**PATCH /engagements/{id}/planning** (post-P2 revision)
```
Request: {
  "design_approach": "string?",
  "schedule_notes": "string?",
  "risk_notes": "string?",
  "data_reliability_notes": "string?",
  "independence_status": "affirmed|pending|exception_noted?",
  "revision_note": "string (required if planning_record.status = approved)"
}
Response 200: { "data": { planning_record object } }
```

---

### §Gates

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/gates` | List all gate decisions for engagement | All (scoped) |
| `GET` | `/engagements/{id}/gates/{gate_type}` | Get gate decisions for one gate type | All (scoped) |
| `POST` | `/engagements/{id}/gates/a1/approve` | Approve Gate A1 | AL |
| `POST` | `/engagements/{id}/gates/a1/decline` | Decline Gate A1 | AL |
| `POST` | `/engagements/{id}/gates/p2/approve` | Approve Gate P2 | QA |
| `POST` | `/engagements/{id}/gates/p2/return` | Return Gate P2 | QA |
| `POST` | `/engagements/{id}/gates/p3/approve` | Approve Gate P3 | QA |
| `POST` | `/engagements/{id}/gates/p4/approve` | Approve Gate P4 | EM, PC, AD |

**POST /engagements/{id}/gates/a1/approve**
```
Request: { "risk_level": "low|medium|high", "rationale": "string (min 10 chars)" }
Response 201: {
  "data": {
    "gate_decision": { gate decision object },
    "engagement": { new engagement object }
  }
}
```

**POST /engagements/{id}/gates/p2/approve**
```
Request: { "rationale": "string (min 10 chars)" }
Response 201: { "data": { "gate_decision": { ... }, "planning_record": { "status": "approved" } } }
```

**POST /engagements/{id}/gates/p2/return**
```
Request: { "rationale": "string (min 10 chars)" }
Response 201: { "data": { "gate_decision": { ... }, "planning_record": { "status": "returned" } } }
```

**POST /engagements/{id}/gates/p3/approve**
```
Request: { "rationale": "string (min 10 chars)" }
Response 201: { "data": { "gate_decision": { ... }, "engagement": { "phase": "draft" } } }
```

**POST /engagements/{id}/gates/p4/approve**
```
Request: { "outcome": "ready_for_issuance|closed", "rationale": "string (min 10 chars)" }
Response 201: {
  "data": {
    "gate_decision": { ... },
    "engagement": { "status": "ready_for_issuance|closed" }
  }
}
```

---

### §Evidence

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/evidence` | List evidence items | All (scoped; restricted items filtered) |
| `POST` | `/engagements/{id}/evidence` | Create evidence item | AN, AD |
| `GET` | `/engagements/{id}/evidence/{ev_id}` | Get evidence item detail | All (scoped) |
| `PATCH` | `/engagements/{id}/evidence/{ev_id}` | Update evidence item | AN, AD |
| `DELETE` | `/engagements/{id}/evidence/{ev_id}` | Soft-delete evidence item | AN, AD |
| `POST` | `/engagements/{id}/evidence/{ev_id}/files` | Upload evidence file (multipart) | AN, AD |
| `GET` | `/engagements/{id}/evidence/{ev_id}/files/{file_id}` | Download evidence file | All (scoped; restricted enforced) |
| `POST` | `/engagements/{id}/evidence/{ev_id}/objectives` | Link evidence to objectives | AN, EM, AD |
| `DELETE` | `/engagements/{id}/evidence/{ev_id}/objectives/{obj_id}` | Unlink evidence from objective | AN, EM, AD |
| `GET` | `/engagements/{id}/evidence/gaps` | List objectives with no evidence | All (scoped) |
| `GET` | `/engagements/{id}/evidence` (CSV) | Export evidence registry; `Accept: text/csv` | AL, EM, AN, QA, PC, RO, AD |

**POST /engagements/{id}/evidence**
```
Request: {
  "evidence_type": "document|dataset|interview_note|meeting_note|other",
  "source": "string (required)",
  "date_received": "YYYY-MM-DD (required)",
  "custodian": "string?",
  "description": "string?",
  "sensitivity": "standard|restricted (default: standard)"
}
Response 201: { "data": { evidence item object } }
```

---

### §Findings

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/findings` | List findings | All (scoped) |
| `POST` | `/engagements/{id}/findings` | Create finding | AN, AD |
| `GET` | `/engagements/{id}/findings/{f_id}` | Get finding detail | All (scoped) |
| `PATCH` | `/engagements/{id}/findings/{f_id}` | Update finding | AN, AD |
| `DELETE` | `/engagements/{id}/findings/{f_id}` | Soft-delete finding | AN, AD |
| `POST` | `/engagements/{id}/findings/{f_id}/evidence` | Link finding to evidence | AN, AD |
| `DELETE` | `/engagements/{id}/findings/{f_id}/evidence/{ev_id}` | Unlink finding from evidence | AN, AD |

---

### §Draft

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/draft` | Get draft product | All (scoped) |
| `POST` | `/engagements/{id}/draft` | Create draft product | EM, AN, AD |
| `PATCH` | `/engagements/{id}/draft` | Update draft product | EM, AN, AD |
| `POST` | `/engagements/{id}/draft/file` | Attach draft file (multipart) | EM, AN, AD |
| `GET` | `/engagements/{id}/draft/file` | Download draft file | All (scoped) |
| `PATCH` | `/engagements/{id}/draft/status` | Advance/change draft status | EM, QA, AD |
| `GET` | `/engagements/{id}/draft/comments` | List review comments | All (scoped) |
| `POST` | `/engagements/{id}/draft/comments` | Add review comment | EM, AN, QA, AD |

---

### §Statements

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/draft/statements` | List draft statements | All (scoped) |
| `POST` | `/engagements/{id}/draft/statements` | Create draft statement | AN, EM, AD |
| `PATCH` | `/engagements/{id}/draft/statements/{s_id}` | Update statement | AN, EM, AD |
| `DELETE` | `/engagements/{id}/draft/statements/{s_id}` | Delete statement | AN, EM, AD |
| `POST` | `/engagements/{id}/draft/statements/{s_id}/evidence` | Link statement to evidence | AN, EM, AD |
| `DELETE` | `/engagements/{id}/draft/statements/{s_id}/evidence/{ev_id}` | Unlink statement from evidence | AN, EM, AD |
| `PATCH` | `/engagements/{id}/draft/statements/{s_id}/reference-status` | Set reference status (IR) | IR |
| `POST` | `/engagements/{id}/draft/statements/{s_id}/assign` | Assign to IR or Analyst | EM, AD |
| `POST` | `/engagements/{id}/draft/statements/{s_id}/waive` | Waive reference check | EM, AD |

**PATCH /engagements/{id}/draft/statements/{s_id}/reference-status**
```
Request: {
  "reference_status": "in_review|passed|failed",
  "discrepancy_notes": "string (required if failed)"
}
Response 200: { "data": { statement object } }
```

---

### §Dashboard

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/dashboard/portfolio` | Portfolio summary counts and engagement list | All |
| `GET` | `/dashboard/engagements/{id}` | Engagement detail dashboard metrics | All (scoped) |

**GET /dashboard/portfolio**
```
Query params: owner_id, risk_level, phase, status, due_date_from, due_date_to, gate_type, gate_status
Response 200: {
  "data": {
    "counts": { "active": 0, "in_planning": 0, ... },
    "engagements": [ { engagement list rows } ]
  }
}
```

**GET /dashboard/engagements/{id}**
```
Response 200: {
  "data": {
    "phase_summary": { ... },
    "gate_status": { "A1": { ... }, "P2": { ... }, "P3": { ... }, "P4": { ... } },
    "milestones": [ ... ],
    "evidence_metrics": { "total": 0, "objectives_with_evidence": 0, "gaps": 0 },
    "reference_metrics": { "total": 0, "passed": 0, "waived": 0, "failed": 0, "in_review": 0, "not_started": 0, "completion_pct": 0 },
    "blockers": [ { "type": "string", "message": "string", "object_id": "uuid?" } ]
  }
}
```

---

### §Audit

| Method | Path | Description | Roles |
|---|---|---|---|
| `GET` | `/engagements/{id}/audit` | List audit events for engagement | All (scoped); AD sees all |
| `GET` | `/engagements/{id}/audit` (CSV) | Export audit log; `Accept: text/csv` | AD |

**GET /engagements/{id}/audit**
```
Query params: action, from_date, to_date, page, per_page (default 50)
Response 200: {
  "data": { "events": [ { audit event objects } ], "total": 0 },
  "meta": { "page": 1, "per_page": 50 }
}
```
