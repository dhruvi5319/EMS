---

## F16: Persona and Journey Artifacts

**Description:** Persona and Journey Artifacts provides a maintained set of user persona definitions and primary journey maps within the system. These artifacts are used to validate requirement clarity, guide UX design, and generate acceptance test scenarios for the four governance gates. Each feature in the EMS is linked to at least one persona and one journey.

**Terminology:**
- **Persona:** A representative user archetype that captures the role, responsibilities, and goals of a target user type.
- **User Journey:** A named end-to-end workflow path from a starting condition to a defined outcome, mapped to one or more features.
- **Feature-Persona Mapping:** A record linking each feature (F0–F17) to the primary persona(s) who use it.
- **Acceptance Scenario:** A test case derived from a journey step and gate rule, used to validate correct system behavior.

**Sub-features:**
- F16.1 — Persona definitions
- F16.2 — Primary journey definitions
- F16.3 — Feature-to-persona mapping
- F16.4 — Journey-to-gate scenario mapping

---

### F16.1 Persona Definitions

The following personas are defined and maintained:

| Persona | Abbreviation | Primary Responsibilities |
|---|---|---|
| Engagement Acceptance Lead | AL | Reviews intake requests; decides A1 approval or decline |
| Engagement Manager | EM | Manages engagement after A1; sets up team, planning, milestones; submits for P2 and P4 |
| Analyst | AN | Uploads evidence; links evidence to objectives; creates findings; indexes draft statements |
| QA Reviewer | QA | Reviews planning completeness (P2); reviews evidence sufficiency (P3) |
| Independent Referencer | IR | Reviews indexed statements against evidence; records reference status |
| Publishing Coordinator | PC | Reviews final readiness; approves P4 for issuance |
| Read-Only Stakeholder | RO | Views engagement status, milestones, gate status; no editing |
| Admin | AD | Manages users, roles, system configuration; can perform any authorized action |

---

### F16.2 Primary Journey Definitions

| Journey ID | Journey Name | Primary Persona | Start Condition | End Condition |
|---|---|---|---|---|
| J1 | Intake and Acceptance | AL | No request exists | Request accepted; Engagement Shell created (A1 approved) OR request declined |
| J2 | Planning Setup | EM | Engagement Shell exists (A1 approved) | Planning baseline approved (P2 approved) |
| J3 | Evidence Readiness | AN, QA | P2 approved | All objectives marked Sufficient; P3 approved |
| J4 | Draft Readiness | AN, IR | P3 approved; Draft Product created | All statements referenced; reference checks complete |
| J5 | Final Readiness | EM, PC | Reference checks complete | P4 approved; engagement status = Ready for Issuance or Closed |

---

### F16.3 Feature-to-Persona Mapping

| Feature | Primary Personas | Primary Journey |
|---|---|---|
| F00 Application Shell | All | All |
| F01 Core Data Objects | All | All |
| F02 Request Intake | AL | J1 |
| F03 Gate A1 | AL | J1 |
| F04 Engagement Shell | EM, RO | J2, J3, J4, J5 |
| F05 Team and Milestones | EM | J2 |
| F06 Planning Record | EM, AN | J2 |
| F07 Gate P2 | QA | J2 |
| F08 Evidence Registry | AN | J3 |
| F09 Evidence-Objective Link | AN, QA | J3 |
| F10 Gate P3 | QA | J3 |
| F11 Draft Product | EM, AN | J4 |
| F12 Indexing and Reference Check | AN, IR | J4 |
| F13 Gate P4 | EM, PC | J5 |
| F14 Portfolio Dashboard | AL, EM, RO | All |
| F15 Engagement Detail Dashboard | EM, QA, AN | J2–J5 |
| F16 Persona and Journey Artifacts | AD | — |
| F17 Acceptance Test Generation | AD, QA | All |

---

### F16.4 Journey-to-Gate Scenario Mapping

Key gate scenarios derived from journeys, used as the basis for F17 acceptance tests:

| Scenario ID | Journey | Gate | Positive Path | Negative Path |
|---|---|---|---|---|
| S-A1-APPROVE | J1 | A1 | All request fields present + risk level + rationale → Engagement Shell created | Missing required field → 422 blocked |
| S-A1-DECLINE | J1 | A1 | Rationale provided → Request closed | Missing rationale → 422 blocked |
| S-P2-APPROVE | J2 | P2 | ≥1 objective + risk notes + data reliability + independence + owner + team + milestones → Planning approved | Missing any prerequisite → blocked |
| S-P2-RETURN | J2 | P2 | QA enters return comment → Planning returned | Missing comment → 422 blocked |
| S-P3-APPROVE | J3 | P3 | All objectives sufficient + no gaps + all findings linked → P3 approved | Any objective `evidence_needed` → blocked |
| S-P4-APPROVE | J5 | P4 | P3 approved + all checks Passed/Waived + no blockers → P4 approved | Any `failed` or `in_review` → blocked |

---

**Note:** Persona and journey artifacts are specification/design artifacts. They are maintained in this document and referenced by F17 for acceptance test generation. No database storage is required for persona definitions in v1.

**API Surface (F16):** None required. Personas and journeys are static specification artifacts.  
**Schema Surface (F16):** No dedicated tables. Journey scenarios feed into F17 test cases.
