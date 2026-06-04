# Functional Requirements Document (FRD)
## Lightweight Engagement Management System (EMS)

**Project Acronym:** EMS  
**Version:** 1.0  
**Date:** 2026-06-04  
**Status:** Active  
**Source PRD:** PRD-EMS.md v1.0  

---

## Scope Statement

This FRD specifies the functional behavior of every feature in the EMS MVP (Features F0–F17). It transforms the product requirements defined in PRD-EMS.md into implementation-ready specifications covering inputs, outputs, validation rules, error handling, role-based access control, database schema, and REST API contracts. Developers must be able to implement each feature from the corresponding chunk without ambiguity or additional requirements discovery.

---

## How to Read This Document

- **Feature chunks** (`F00`–`F17`) each cover one PRD feature with description, terminology, sub-features, process, inputs, outputs, validation, error states, per-feature API summary, and per-feature schema surface.
- **Cross-feature chunks** (`Y0`–`Y3`) consolidate the full database DDL, REST API catalog, cross-feature error catalog, and integration points.
- **Feature IDs** use zero-padded two-digit numbers (`F00`, `F01`, …, `F17`) to match PRD feature IDs `F0`–`F17`.
- **Gate IDs** follow PRD naming: `A1`, `P2`, `P3`, `P4`.
- **Role abbreviations** used in permission tables:

| Abbreviation | Role |
|---|---|
| AL | Engagement Acceptance Lead |
| EM | Engagement Manager |
| AN | Analyst |
| QA | QA Reviewer |
| IR | Independent Referencer |
| PC | Publishing Coordinator |
| RO | Read-Only Stakeholder |
| AD | Admin |

- **HTTP method conventions:** `GET` = read, `POST` = create, `PUT` = replace, `PATCH` = partial update, `DELETE` = remove.
- **Validation failure response:** HTTP 422 with an `errors` array unless a different code is specified.
- **Authorization failure response:** HTTP 403 with error code `FORBIDDEN`.
- **Authentication failure response:** HTTP 401 with error code `UNAUTHORIZED`.

---

## Master Table of Contents

| Chunk | File | Coverage |
|---|---|---|
| Header | `00-header.md` | This file — conventions, TOC, shared terminology |
| F00 | `F00-application-shell.md` | Basic Application Shell |
| F01 | `F01-core-data-objects.md` | Core Data Objects |
| F02 | `F02-request-intake.md` | Request Intake |
| F03 | `F03-gate-a1.md` | Acceptance Decision — Gate A1 |
| F04 | `F04-engagement-shell.md` | Engagement Shell |
| F05 | `F05-team-milestones.md` | Team and Milestones |
| F06 | `F06-planning-record.md` | Lightweight Planning Record |
| F07 | `F07-gate-p2.md` | Planning Approval — Gate P2 |
| F08 | `F08-evidence-registry.md` | Evidence Registry |
| F09 | `F09-evidence-objective-link.md` | Evidence-to-Objective Link |
| F10 | `F10-gate-p3.md` | Findings and Sufficiency — Gate P3 |
| F11 | `F11-draft-product.md` | Draft Product Record |
| F12 | `F12-indexing-reference-check.md` | Basic Indexing and Reference Check |
| F13 | `F13-gate-p4.md` | Final Readiness — Gate P4 |
| F14 | `F14-portfolio-dashboard.md` | Portfolio Dashboard |
| F15 | `F15-engagement-detail-dashboard.md` | Engagement Detail Dashboard |
| F16 | `F16-persona-journey.md` | Persona and Journey Artifacts |
| F17 | `F17-acceptance-tests.md` | Basic Acceptance Test Generation |
| Y0 | `Y0-schema.md` | Full Database DDL |
| Y1 | `Y1-api.md` | REST API Catalog |
| Y2 | `Y2-errors.md` | Cross-Feature Error Catalog |
| Y3 | `Y3-integrations.md` | External Integration Points |

---

## Shared Cross-Cutting Terminology

| Term | Definition |
|---|---|
| **Engagement** | A structured body of work performed in response to a request, mandate, or internal decision. |
| **Request** | The intake record that initiates the engagement workflow. |
| **Engagement Shell** | The main record for an accepted engagement, including metadata, phase, status, owner, team, milestones, and artifacts. |
| **Gate A1** | Acceptance approval gate. Passing A1 creates an engagement shell. |
| **Gate P2** | Planning approval gate. Passing P2 locks the lightweight planning baseline. |
| **Gate P3** | Evidence readiness gate. Passing P3 confirms evidence is sufficient to proceed to draft readiness work. |
| **Gate P4** | Final readiness gate. Passing P4 confirms reference checks and final review are complete. |
| **Planning Baseline** | The approved set of objectives, design approach, schedule, risk notes, data reliability notes, and independence affirmations locked by Gate P2. |
| **Objective** | A research question or work objective that evidence and findings must support. |
| **Evidence Item** | A document, dataset, interview note, or other item collected to support engagement objectives. |
| **Finding** | A draft conclusion or observation supported by evidence. |
| **Draft Product** | A working report or product record prepared from findings and reviewed before final readiness. |
| **Indexing** | Linking a draft statement or finding to supporting evidence. |
| **Reference Check** | Independent verification that an indexed statement is supported by the linked evidence. |
| **Audit Event** | A timestamped, immutable record of an important action: approval, status change, upload, or review decision. |
| **Blocker** | Any condition that prevents a gate from passing or a phase from advancing. |
| **Restricted Evidence** | Evidence flagged as sensitive; visible only to authorized roles assigned to the engagement. |
| **RBAC** | Role-Based Access Control — the authorization model governing all create/read/update/delete operations. |
| **Gate Decision** | The formal record of a gate outcome: gate type, status (Approved/Declined/Returned), approver, timestamp, rationale. |

---

## Role Permission Matrix (Summary)

| Action Category | AL | EM | AN | QA | IR | PC | RO | AD |
|---|---|---|---|---|---|---|---|---|
| Login/Logout | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/Edit Request | ✓ | — | — | — | — | — | — | ✓ |
| Approve/Decline Gate A1 | ✓ | — | — | — | — | — | — | — |
| Edit Engagement Metadata | — | ✓ | — | — | — | — | — | ✓ |
| Manage Team/Milestones | — | ✓ | — | — | — | — | — | ✓ |
| Edit Planning Record | — | ✓ | ✓ | — | — | — | — | — |
| Approve/Return Gate P2 | — | — | — | ✓ | — | — | — | — |
| Upload Evidence | — | — | ✓ | — | — | — | — | — |
| Link Evidence to Objectives | — | — | ✓ | — | — | — | — | — |
| Create Findings | — | — | ✓ | — | — | — | — | — |
| Approve Gate P3 | — | — | — | ✓ | — | — | — | — |
| Create/Edit Draft Product | — | ✓ | ✓ | — | — | — | — | — |
| Perform Reference Check | — | — | — | — | ✓ | — | — | — |
| Approve Gate P4 | — | ✓ | — | — | — | ✓ | — | — |
| View Dashboards | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export CSV | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| Manage Users/Roles | — | — | — | — | — | — | — | ✓ |
| Export Audit Log | — | — | — | — | — | — | — | ✓ |

---

## Gate Prerequisite Summary

| Gate | Key Prerequisites |
|---|---|
| **A1** | Request status = Submitted; all required request fields present |
| **P2** | A1 = Approved; ≥1 objective exists; owner assigned; team assigned; milestones set; risk notes, data reliability notes, and independence status present |
| **P3** | P2 = Approved; all objectives have ≥1 linked evidence item; no objective marked "Evidence Needed" |
| **P4** | P3 = Approved; all reference checks = Passed or Waived; no open blockers |

---

*End of header chunk. See feature chunks F00–F17 and cross-feature chunks Y0–Y3 for full specifications.*
