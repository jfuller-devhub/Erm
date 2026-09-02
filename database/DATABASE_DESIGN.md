# Database Design — Vendor Management Application
**Target:** MariaDB 10.6+  
**Charset:** utf8mb4 / utf8mb4_unicode_ci  
**Last updated:** 2026-09-02

---

## Overview

This application is a multi-module governance platform covering Third-Party Risk Management (TPRM), Enterprise Risk Management (ERM), Controls, Compliance Frameworks, Regulatory Tracking, Legislative Monitoring, Products/Benefits, and Employer management. All modules share a common user directory and a consistent audit trail convention.

### Audit Trail Convention

Every entity table that represents user-created or user-modified data includes these four columns:

| Column | Type | Description |
|---|---|---|
| `created_by` | VARCHAR(200) | Display name of the user who created the record |
| `created_on` | DATETIME | Timestamp of creation (DEFAULT CURRENT_TIMESTAMP) |
| `modified_by` | VARCHAR(200) | Display name of last modifier |
| `modified_on` | DATETIME | Timestamp of last modification (ON UPDATE CURRENT_TIMESTAMP) |

Junction/relationship tables typically carry only `created_on`.

### ID Format Convention

All primary keys follow a module-prefix pattern with zero-padded integers:

| Prefix | Entity |
|---|---|
| USR-### | App Users |
| VEN-### | Vendors |
| VCT-### | Vendor Contacts |
| VL-### | Vendor Levels |
| VCLS-### | Vendor Classifications |
| VCL-### | Vendor Classification Levels |
| CHK-### | Vendor Checklist Items |
| VLCA-### | Vendor Level Checklist Associations |
| CON-### | Contracts |
| RSK-### | Risks |
| RCAT-### | Risk Categories |
| ASMT-### | Risk Assessments |
| MIT-### | Risk Mitigation Actions |
| CTL-### | Controls |
| CRM-### | Control-Requirement Mappings |
| KRI-### | Key Risk Indicators |
| PRC-### | Processes |
| SUB-### | Sub-Processes |
| STP-### | Process Steps |
| PRL-### | Process-Risk Links |
| PCL-### | Process-Control Links |
| FWK-### | Compliance Frameworks |
| REQ-[H\|I\|S\|N]-### | Framework Requirements |
| REG-### | Regulations |
| RREQ-### | Regulation Requirements |
| DOC-### | Regulation Documents |
| CMT-### | Regulation Comments |
| BILL-### | Bills |
| BILL-CMT-### | Bill Comments |
| PRD-### | Products |
| EMP-### | Employers |

---

## Module Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        app_users  config_options                    │
│                     (shared across all modules)                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
    ┌───────────────────────┼────────────────────────┐
    │                       │                        │
    ▼                       ▼                        ▼
┌──────────┐         ┌────────────┐         ┌──────────────┐
│  VENDOR  │◄────────│  CONTRACT  │         │     ERM      │
│ MGMT     │         │            │         │ (Risks,      │
│          │         └────────────┘         │  Assessments,│
│ vendors  │                               │  Mitigations)│
│ levels   │         ┌────────────┐         └──────┬───────┘
│ classif. │◄────────│  PROCESS   │◄────────────────┤
│ checklist│         │            │                 │
└──────┬───┘         └────────────┘         ┌───────▼──────┐
       │                    ▲               │   CONTROLS   │
       ▼                    │               └──────┬───────┘
┌──────────────┐   ┌────────┴─────┐               │
│   PRODUCTS   │   │    KRIs      │       ┌────────▼───────┐
│   BENEFITS   │   └──────────────┘       │  COMPLIANCE    │
└──────────────┘                          │  FRAMEWORKS    │
                                          │  (HITRUST, ISO,│
┌──────────────┐   ┌──────────────┐       │  SOC2, NIST)  │
│  EMPLOYERS   │   │  REGULATORY  │◄──────┘
└──────────────┘   │  REGISTER    │
                   └──────┬───────┘
                          ▼
                   ┌──────────────┐
                   │ LEGISLATIVE  │
                   │ BILL TRACKER │
                   └──────────────┘
```

---

## Module 1: Users & Global Config

### `app_users`
Central user directory. Referenced as FK throughout for ownership, assignment, reviewer, and approver fields.

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | USR-### |
| name | VARCHAR(200) | Full display name |
| initials | VARCHAR(5) | e.g. EC |
| department | VARCHAR(100) | |
| email | VARCHAR(255) | NULL allowed |
| is_active | TINYINT(1) | Soft-delete flag |

### `config_options`
Admin-managed lookup values that populate dropdowns in the UI. Rows are identified by `(table_name, field_name)` pairs.

---

## Module 2: Vendor Management (TPRM)

### Entity Relationship

```
vendor_levels ◄─────────────── vendor_level_checklist_associations ──► vendor_checklist_items
     │                                      │
     │                           vendor_status_assignments
     │                           vendor_checklist_assignees
     │
vendors ──► vendor_contacts
     │  ──► vendor_individuals
     │  ──► vendor_activity_log
     │  ──► vendor_classification_selections ──► vendor_classification_levels ──► vendor_classifications
     │  ──► vendor_process_associations ──► processes
     └──► vendor_risks ──► risks
```

### `vendor_levels`
Configures the risk tier system (e.g. Critical, High, Medium, Low). Score bands define which tier a vendor falls into based on their composite classification score.

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | VL-### |
| level_number | INT UNIQUE | Ordinal position |
| level_name | VARCHAR(100) | e.g. "Critical Vendor" |
| min_score / max_score | INT | Score band 0–100 |
| color | VARCHAR(50) | CSS variable for badge |

### `vendor_classifications`
Classification dimensions used for risk scoring (e.g. "Data Sensitivity", "Business Criticality"). Each dimension has a weight in the composite score.

### `vendor_classification_levels`
Discrete levels within a classification dimension (e.g. "Level 5 – High Exposure"). Each level has a numeric score contributing to the composite.

**Scoring model:** `composite_score = Σ(classification.weight × selected_level.score) / Σ(weight)` → maps to a `vendor_level` via its score band.

### `vendors`
The core entity. Key fields:

| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(20) PK | VEN-### |
| status | ENUM | General status (Active, Inactive, etc.) |
| tprm_status | ENUM | Granular TPRM lifecycle (8 values) |
| vendor_level_id | VARCHAR(20) FK | Computed from classification scoring |
| composite_score | INT | Denormalized for query performance |
| baa_required | TINYINT(1) | Business Associate Agreement flag |
| has_ai_features | — | Captured at contract level |

**TPRM Status Values:**
1. Under Consideration
2. Under Due Diligence
3. Contract Negotiation
4. Active (In Service)
5. Active (Under Scheduled Review)
6. Offboarding (Termination in Progress)
7. Terminated
8. Archived

### `vendor_checklist_items`
Master catalog of compliance/monitoring activities (e.g. "Annual Risk Assessment", "SOC 2 Review"). Not vendor-specific; they are templates.

### `vendor_level_checklist_associations` (VLCA)
Ties a checklist item to a vendor level. Stores scheduling (RRULE), advance notice, grace period, and evidence settings.

### `vendor_status_assignments`
Child rows of a VLCA. One row per vendor status value, storing whether the activity is `required` or `optional` at that lifecycle stage. This allows a single checklist item to have different enforcement rules depending on where the vendor is in its lifecycle.

**Example:** "SOC 2 Review" may be `required` for Active vendors and `optional` for vendors Under Due Diligence.

---

## Module 3: Contracts

### `contracts`
One vendor → many contracts. Key fields:

| Column | Type | Notes |
|---|---|---|
| type | ENUM | MSA, SOW, NDA, Amendment, PO |
| status | ENUM | Active, Expired, Pending, Renewal Due, Terminated |
| auto_renew | TINYINT(1) | |
| notice_period_days | INT | Advance termination notice required |
| evergreen | TINYINT(1) | No fixed end date |
| has_ai_features | TINYINT(1) | AI-enabled service flag |
| vendor_communications_direct | TINYINT(1) | Vendor contacts participants directly |

Supporting tables: `contract_business_owners`, `contract_individuals`, `contract_activity_log`.

---

## Module 4: Enterprise Risk Management (ERM)

### `risk_categories`
Self-referencing hierarchy for risk taxonomy (e.g. Technology → Cyber → Ransomware).

### `risks`
Risk register entries. Supports both enterprise-level risks (`is_enterprise_risk = 1`) and departmental risks that can optionally roll up to an enterprise risk via `enterprise_risk_id`.

| Column | Type | Notes |
|---|---|---|
| risk_type | ENUM | strategic, operational, financial, compliance, reputational, cyber |
| appetite_level | ENUM | averse, minimal, cautious, open, hungry |
| review_frequency | ENUM | monthly, quarterly, semi_annual, annual |
| is_enterprise_risk | TINYINT(1) | Promotes risk to board-level visibility |

### `risk_assessments`
Scored snapshots of a risk at a point in time. Only one row per risk has `is_current = 1`.

**Scoring model:**
- `inherent_score = likelihood_score × impact_score` (1–25 range)
- `residual_score` = post-control adjusted score
- Rating bands: critical=20–25, high=12–19, medium=6–11, low=3–5, negligible=1–2

| Column | Type | Notes |
|---|---|---|
| likelihood_score | INT | 1–5 |
| impact_score | INT | 1–5 |
| velocity_score | INT NULL | 1–5; speed-of-onset factor |
| inherent_score | INT | Pre-control score |
| residual_score | INT | Post-control score |
| target_score | INT NULL | Desired future state |
| is_current | TINYINT(1) | Enforces single current assessment per risk |

### `risk_mitigation_actions`
Treatment actions for a risk. `action_type` encodes the treatment strategy (mitigate/accept/transfer/avoid).

---

## Module 5: Controls

### `controls`
Internal control catalog. Controls are the primary mitigating mechanism mapped to risks, framework requirements, and regulations.

| Column | Type | Notes |
|---|---|---|
| control_type | ENUM | preventive, detective, corrective, directive, compensating |
| frequency | ENUM | continuous through annual |
| effectiveness | ENUM | effective, partially_effective, ineffective, not_tested |
| is_automated | TINYINT(1) | |
| framework_ref | VARCHAR(200) | Free-text cross-reference |

### `risk_controls`
Many-to-many mapping between risks and controls with `coverage_level` (full/substantial/partial/minimal) and `is_primary` flag.

---

## Module 6: Key Risk Indicators (KRIs)

### `key_risk_indicators`
KRI definitions. Two categories:
- **Auto KRIs:** Derive `current_value` at runtime from live data (e.g. count of overdue control tests, count of open high/critical risks). `calculation_source` identifies the derivation rule.
- **Manual KRIs:** `current_value` is persisted and updated via user entry.

Status thresholds use `threshold_direction` to interpret whether higher or lower values are better.

### `kri_data_points`
Up to 6 historical data points retained per KRI for trend sparklines.

---

## Module 7: Business Processes

### Hierarchy
```
processes
  └── sub_processes
        └── process_steps ──► process_step_links (flow graph)
```

### `processes`
Business process catalog. Processes can declare dependencies on other processes via `process_dependencies`.

### `process_steps`
`type` ∈ {Task, Decision, Hand-off}. Steps form a directed graph via `process_step_links`.

### Cross-module junctions
- `process_risk_links` — links risks to processes or sub-processes
- `process_control_links` — links controls to processes, flagging key controls and testing cadence

---

## Module 8: Compliance Frameworks

### `compliance_frameworks`
Supported frameworks: HITRUST CSF v11.3, ISO 27001:2022, SOC 2 Type II, NIST CSF 2.0.

### `framework_requirements`
Tree-structured requirements (domain nodes → leaf requirements). Leaf nodes map to controls via `control_requirement_mappings`.

| Prefix | Framework |
|---|---|
| REQ-H-### | HITRUST CSF |
| REQ-I-### | ISO 27001 |
| REQ-S-### | SOC 2 |
| REQ-N-### | NIST CSF |

### `control_requirement_mappings`
Tracks implementation status and maturity score for each control-requirement pairing. `maturity_score` (1–5) is primarily used for HITRUST.

**Implementation status progression:** not_started → in_progress → implemented → not_applicable

---

## Module 9: Regulatory Register

### `regulations`
Full regulatory obligation lifecycle management.

| Column | Type | Notes |
|---|---|---|
| status | ENUM | monitoring → compliant/non-compliant |
| stage | ENUM | proposed → effective → repealed |
| compliance_status | ENUM | 8-step implementation progression |
| compliance_score | INT | 0–100 calculated score |

### `regulation_requirements`
Parsed requirements from regulation text (e.g. GDPR Art. 5.1.a). Independently tracked for implementation status, gap analysis, and remediation planning.

### `regulation_controls`
Regulation-level control mapping (separate from requirement-level mapping). Tracks `coverage_level` and `implementation_status` through a 5-step verification lifecycle: not-started → in-progress → implemented → tested → verified.

### `regulation_documents`
Document attachments with version chaining via `previous_version_id`.

### `regulation_comments`
Threaded discussion with types: note, analysis, decision, update, risk, question. Supports `@mentions` via `regulation_comment_mentions`.

---

## Module 10: Legislative Bill Tracker

### `bills`
Tracks proposed legislation through its legislative lifecycle. When a bill is enacted, `regulation_id` is set to link it to the created regulation record.

**Bill lifecycle:**
introduced → in-committee → committee-passed → floor-debate → passed-chamber → other-chamber → conference → passed-both → signed (or vetoed/failed)

### `bill_amendments` / `bill_votes`
Structured tracking of amendments and chamber votes.

### `bill_comments`
Identical structure to `regulation_comments`; scoped to bill records.

---

## Module 11: Products & Benefits

### `products`
Catalog of benefit plans and services (e.g. Defined Contribution Plans, Mental Health Navigation). 

`type` ∈ {Benefit, Service} determines which category set is applicable.

Roadmap fields capture 6P strategic assessment dimensions:
- Purpose Alignment
- Planning
- Protection
- Price Competitiveness
- Performance Measurement
- Participant Experience

Supporting tables: `product_tags`, `product_vendors`, `product_process_associations`, `product_roadmap_items`.

---

## Module 12: Employers

### `employers`
Employer entities: plan sponsors, affiliates, subsidiaries, funding entities, departments.

Auto-generated `code` field (e.g. ACME-001) using name prefix + sequential number.

### `employer_relationships`
Directed relationship graph. `relationship_type` ∈ {Affiliate, Subsidiary, Non-Related Entity, Department, Other, Funding Entity}.

---

## Cross-Module Junctions Summary

| Table | Left Entity | Right Entity | Notes |
|---|---|---|---|
| `vendor_risks` | vendors | risks | Vendor-sourced risk identification |
| `vendor_process_associations` | vendors | processes | Process support mapping |
| `vendor_individuals` | vendors | app_users | Internal people involved |
| `product_vendors` | products | vendors | Vendors delivering a product |
| `product_process_associations` | products | processes | Processes supporting a product |
| `kri_risk_links` | KRIs | risks | KRIs monitoring specific risks |
| `bill_related_regulations` | bills | regulations | Related regulatory context for a bill |
| `regulation_stakeholders` | regulations | app_users | Cross-functional stakeholder team |
| `regulation_requirement_controls` | regulation_requirements | controls | Requirement-level control evidence |

---

## Key Business Rules

1. **Vendor level assignment** is computed from the weighted composite of `vendor_classification_selections`. The `composite_score` column on `vendors` is denormalized for performance.

2. **Checklist enforcement** is controlled at two levels:
   - Which checklist items apply to a vendor level (`vendor_level_checklist_associations`)
   - Whether each item is required or optional at each TPRM lifecycle status (`vendor_status_assignments`)

3. **Risk assessment currency**: Only one `risk_assessments` row per risk may have `is_current = 1`. Application code must enforce this invariant (or use a trigger).

4. **Enterprise risks**: When `is_enterprise_risk = 1`, a risk is visible in board/executive reporting. Departmental risks may optionally reference an enterprise risk via `enterprise_risk_id`.

5. **Control effectiveness scoring** follows this precedence: `effective > partially_effective > ineffective > not_tested`. KRI `auto_control_coverage` calculates the ratio of `effective` controls.

6. **Document versioning**: `regulation_documents.previous_version_id` forms a linked list traversable to reconstruct document history.

7. **Bill-to-Regulation promotion**: When a tracked bill is signed into law, a new `regulations` record is created and `bills.regulation_id` is set. The bill record is retained for legislative history.

---

## Files in This Directory

| File | Description |
|---|---|
| `DATABASE_DESIGN.md` | This file — full design documentation |
| `full_schema.sql` | Complete MariaDB DDL for all modules |
| `contracts_schema.sql` | Standalone contracts module schema (legacy; superseded by full_schema.sql) |
| `contracts_seed_data.sql` | Sample contract data for development |
| `CONTRACTS_SCHEMA_README.md` | Contracts module field-level reference |
