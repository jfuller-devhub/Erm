-- =============================================================================
-- Vendor Management Application — Full Database Schema
-- Target: MariaDB 10.6+
-- Charset: utf8mb4 / COLLATE utf8mb4_unicode_ci
-- Generated: 2026-09-02
--
-- Module order (dependency-safe):
--   1.  Users & Config
--   2.  Vendor Management
--   3.  Contracts
--   4.  Enterprise Risk Management (ERM)
--   5.  Controls
--   6.  Key Risk Indicators (KRIs)
--   7.  Business Processes
--   8.  Compliance Frameworks
--   9.  Regulatory Register
--  10.  Legislative Bill Tracker
--  11.  Products & Benefits
--  12.  Employers
--  13.  Cross-Module Junction Tables
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- =============================================================================
-- MODULE 1: USERS & GLOBAL CONFIG
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_users (
    id               VARCHAR(20)  NOT NULL                 COMMENT 'Format: USR-###',
    name             VARCHAR(200) NOT NULL,
    initials         VARCHAR(5)   NOT NULL,
    department       VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NULL,
    is_active        TINYINT(1)   NOT NULL DEFAULT 1,
    created_on       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_on      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Application user directory; referenced throughout as owner/assignee FK';

-- Config lookup values (dropdown lists, field enumerations configurable by admins)
CREATE TABLE IF NOT EXISTS config_options (
    id          VARCHAR(20)  NOT NULL                 COMMENT 'Format: CFG-###',
    table_name  VARCHAR(100) NOT NULL                 COMMENT 'Logical entity this option belongs to (e.g. Vendor, Contract, Risk)',
    field_name  VARCHAR(100) NOT NULL                 COMMENT 'Field name the option populates',
    value       VARCHAR(255) NOT NULL,
    status      ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
    sort_order  INT          NOT NULL DEFAULT 0,
    created_on  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_on DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_config_options_table_field (table_name, field_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Admin-managed lookup values for dropdown fields across all modules';


-- =============================================================================
-- MODULE 2: VENDOR MANAGEMENT (TPRM)
-- =============================================================================

-- Vendor risk / tier levels (Critical, High, Medium, Low) configured by admins
CREATE TABLE IF NOT EXISTS vendor_levels (
    id           VARCHAR(20)  NOT NULL                 COMMENT 'Format: VL-###',
    level_number INT          NOT NULL,
    level_name   VARCHAR(100) NOT NULL                 COMMENT 'e.g. Critical Vendor, High Risk Vendor',
    description  TEXT         NULL,
    min_score    INT          NOT NULL DEFAULT 0       COMMENT 'Minimum calculated score (0–100)',
    max_score    INT          NOT NULL DEFAULT 100     COMMENT 'Maximum calculated score (0–100)',
    color        VARCHAR(50)  NULL                     COMMENT 'CSS variable or hex for badge display',
    sort_order   INT          NOT NULL DEFAULT 0,
    created_by   VARCHAR(200) NULL,
    created_on   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by  VARCHAR(200) NULL,
    modified_on  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vendor_levels_number (level_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tiered vendor risk classification levels; score bands drive automatic assignment';

-- Classification systems (e.g. "Vendor Risk Assessment", "Data Sensitivity Scoring")
CREATE TABLE IF NOT EXISTS vendor_classifications (
    id           VARCHAR(20)  NOT NULL                 COMMENT 'Format: VCLS-###',
    title        VARCHAR(200) NOT NULL,
    description  TEXT         NULL,
    weight       DECIMAL(5,2) NOT NULL DEFAULT 100.00  COMMENT 'Weight 0–100 in composite scoring',
    created_by   VARCHAR(200) NULL,
    created_on   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by  VARCHAR(200) NULL,
    modified_on  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Top-level classification dimensions used to score vendors into risk levels';

-- Discrete levels within a classification (e.g. "Level 5 – High Exposure")
CREATE TABLE IF NOT EXISTS vendor_classification_levels (
    id                VARCHAR(20)  NOT NULL             COMMENT 'Format: VCL-###',
    classification_id VARCHAR(20)  NOT NULL             COMMENT 'FK → vendor_classifications.id',
    level_number      INT          NOT NULL,
    level_label       VARCHAR(200) NOT NULL             COMMENT 'e.g. Level 5 – High Exposure',
    description       TEXT         NULL,
    score             INT          NOT NULL DEFAULT 0   COMMENT 'Numeric score contributed to composite',
    sort_order        INT          NOT NULL DEFAULT 0,
    created_by        VARCHAR(200) NULL,
    created_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by       VARCHAR(200) NULL,
    modified_on       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_vcl_classification (classification_id),
    CONSTRAINT fk_vcl_classification FOREIGN KEY (classification_id)
        REFERENCES vendor_classifications(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Discrete score levels within a vendor classification dimension';

-- Vendor master record
CREATE TABLE IF NOT EXISTS vendors (
    id                      VARCHAR(20)   NOT NULL              COMMENT 'Format: VEN-###',
    name                    VARCHAR(200)  NOT NULL,
    category                ENUM('Business Services','Facility Services','Software/Hardware/Technology','Events','Other') NOT NULL,
    status                  ENUM('Active','Inactive','Pending Review','Terminating','Selected Vendor') NOT NULL DEFAULT 'Active',
    tprm_status             ENUM('Under Consideration','Under Due Diligence','Contract Negotiation','Active (In Service)','Active (Under Scheduled Review)','Offboarding (Termination in Progress)','Terminated','Archived') NULL COMMENT 'Granular TPRM lifecycle status',
    vendor_level_id         VARCHAR(20)   NULL                  COMMENT 'FK → vendor_levels.id; set from risk scoring',
    department              VARCHAR(100)  NULL,
    primary_contact         VARCHAR(200)  NULL,
    email                   VARCHAR(255)  NULL,
    phone                   VARCHAR(50)   NULL,
    address                 TEXT          NULL,
    tax_id                  VARCHAR(50)   NULL,
    website                 VARCHAR(500)  NULL,
    notes                   TEXT          NULL,
    -- Governance
    dmba_vendor_manager_id  VARCHAR(20)   NULL                  COMMENT 'FK → app_users.id',
    department_owner        VARCHAR(100)  NULL,
    documentation_link      VARCHAR(1000) NULL                  COMMENT 'SharePoint or equivalent URL',
    baa_required            TINYINT(1)    NOT NULL DEFAULT 0    COMMENT 'Business Associate Agreement required flag',
    -- Classification scoring (denormalized for query performance)
    composite_score         INT           NULL                  COMMENT 'Calculated composite risk score 0–100',
    created_by              VARCHAR(200)  NULL,
    created_on              DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by             VARCHAR(200)  NULL,
    modified_on             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_vendors_status (status),
    INDEX idx_vendors_tprm_status (tprm_status),
    INDEX idx_vendors_level (vendor_level_id),
    CONSTRAINT fk_vendors_level FOREIGN KEY (vendor_level_id)
        REFERENCES vendor_levels(id) ON DELETE SET NULL,
    CONSTRAINT fk_vendors_manager FOREIGN KEY (dmba_vendor_manager_id)
        REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Vendor master record; central entity for all TPRM and contract relationships';

-- Individuals involved with a vendor (many-to-many)
CREATE TABLE IF NOT EXISTS vendor_individuals (
    vendor_id   VARCHAR(20) NOT NULL COMMENT 'FK → vendors.id',
    user_id     VARCHAR(20) NOT NULL COMMENT 'FK → app_users.id',
    role        VARCHAR(100) NULL,
    created_on  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id, user_id),
    CONSTRAINT fk_vi_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_vi_user   FOREIGN KEY (user_id)   REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='People within the organization involved with a vendor';

-- External and internal vendor contacts
CREATE TABLE IF NOT EXISTS vendor_contacts (
    id          VARCHAR(20)  NOT NULL                 COMMENT 'Format: VCT-###',
    vendor_id   VARCHAR(20)  NOT NULL                 COMMENT 'FK → vendors.id',
    name        VARCHAR(200) NOT NULL,
    title       VARCHAR(200) NULL,
    email       VARCHAR(255) NULL,
    phone       VARCHAR(50)  NULL,
    type        ENUM('External','Internal') NOT NULL DEFAULT 'External',
    department  VARCHAR(100) NULL,
    notes       TEXT         NULL,
    created_by  VARCHAR(200) NULL,
    created_on  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(200) NULL,
    modified_on DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_vc_vendor (vendor_id),
    CONSTRAINT fk_vc_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='External vendor contacts and internal liaisons associated with a vendor';

-- Vendor activity / audit feed entries
CREATE TABLE IF NOT EXISTS vendor_activity_log (
    id          VARCHAR(20)  NOT NULL                 COMMENT 'Format: VAL-###',
    vendor_id   VARCHAR(20)  NOT NULL                 COMMENT 'FK → vendors.id',
    user_id     VARCHAR(20)  NULL                     COMMENT 'FK → app_users.id',
    user_name   VARCHAR(200) NULL                     COMMENT 'Denormalized display name at time of action',
    action      VARCHAR(500) NOT NULL,
    logged_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_val_vendor (vendor_id),
    CONSTRAINT fk_val_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Activity feed entries for vendor record changes';

-- Scored classification selections for a vendor (one row per classification system)
CREATE TABLE IF NOT EXISTS vendor_classification_selections (
    vendor_id         VARCHAR(20) NOT NULL COMMENT 'FK → vendors.id',
    classification_id VARCHAR(20) NOT NULL COMMENT 'FK → vendor_classifications.id',
    level_id          VARCHAR(20) NOT NULL COMMENT 'FK → vendor_classification_levels.id; selected level',
    created_on        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_on       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id, classification_id),
    CONSTRAINT fk_vcs_vendor         FOREIGN KEY (vendor_id)         REFERENCES vendors(id)                    ON DELETE CASCADE,
    CONSTRAINT fk_vcs_classification FOREIGN KEY (classification_id) REFERENCES vendor_classifications(id)    ON DELETE CASCADE,
    CONSTRAINT fk_vcs_level          FOREIGN KEY (level_id)          REFERENCES vendor_classification_levels(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='The selected classification level for each dimension on a specific vendor';

-- Checklist items (the global catalog of activities)
CREATE TABLE IF NOT EXISTS vendor_checklist_items (
    id                    VARCHAR(20)  NOT NULL           COMMENT 'Format: CHK-###',
    name                  VARCHAR(300) NOT NULL,
    description           TEXT         NULL,
    category              VARCHAR(100) NOT NULL           COMMENT 'e.g. Compliance, Security, Financial',
    activity_type         VARCHAR(100) NOT NULL           COMMENT 'e.g. Due Diligence, Monitoring, Assessment',
    execution_start_date  VARCHAR(100) NULL               COMMENT 'Named trigger: Vendor Add Date, Vendor Activation Date, etc.',
    created_by            VARCHAR(200) NULL,
    created_on            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by           VARCHAR(200) NULL,
    modified_on           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master catalog of vendor checklist activity templates';

-- Assigns a checklist item to a vendor level (one row per CHK+VL pair)
CREATE TABLE IF NOT EXISTS vendor_level_checklist_associations (
    id                  VARCHAR(20)   NOT NULL            COMMENT 'Format: VLCA-###',
    checklist_item_id   VARCHAR(20)   NOT NULL            COMMENT 'FK → vendor_checklist_items.id',
    vendor_level_id     VARCHAR(20)   NOT NULL            COMMENT 'FK → vendor_levels.id',
    rrule               VARCHAR(500)  NULL                COMMENT 'RFC 5545 RRULE string for recurrence',
    advance_notice_days INT           NULL                COMMENT 'Days before due date to notify',
    grace_period_days   INT           NULL                COMMENT 'Days after due date before overdue escalation',
    evidence_required   TINYINT(1)    NOT NULL DEFAULT 0,
    evidence_type       VARCHAR(100)  NULL                COMMENT 'Document, Attestation, Screenshot, Certificate, Report, Other',
    created_by          VARCHAR(200)  NULL,
    created_on          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by         VARCHAR(200)  NULL,
    modified_on         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_vlca_item_level (checklist_item_id, vendor_level_id),
    INDEX idx_vlca_level (vendor_level_id),
    CONSTRAINT fk_vlca_item  FOREIGN KEY (checklist_item_id) REFERENCES vendor_checklist_items(id) ON DELETE CASCADE,
    CONSTRAINT fk_vlca_level FOREIGN KEY (vendor_level_id)   REFERENCES vendor_levels(id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Ties a checklist item to a vendor level with scheduling and evidence settings';

-- Per-vendor-status assignment for each VLCA (required vs optional per lifecycle stage)
CREATE TABLE IF NOT EXISTS vendor_status_assignments (
    association_id  VARCHAR(20)              NOT NULL COMMENT 'FK → vendor_level_checklist_associations.id',
    vendor_status   VARCHAR(100)             NOT NULL COMMENT 'One of the eight TPRM vendor statuses',
    assignment      ENUM('required','optional') NOT NULL,
    PRIMARY KEY (association_id, vendor_status),
    CONSTRAINT fk_vsa_association FOREIGN KEY (association_id)
        REFERENCES vendor_level_checklist_associations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Granular required/optional setting per vendor lifecycle status for each checklist association';

-- Assignee roles for a checklist association
CREATE TABLE IF NOT EXISTS vendor_checklist_assignees (
    association_id VARCHAR(20)  NOT NULL COMMENT 'FK → vendor_level_checklist_associations.id',
    assignee_role  VARCHAR(100) NOT NULL COMMENT 'e.g. Vendor Manager, Individuals Involved',
    PRIMARY KEY (association_id, assignee_role),
    CONSTRAINT fk_vca_association FOREIGN KEY (association_id)
        REFERENCES vendor_level_checklist_associations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Roles or user references responsible for completing a checklist item';


-- =============================================================================
-- MODULE 3: CONTRACTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS contracts (
    id                          VARCHAR(20)   NOT NULL            COMMENT 'Format: CON-###',
    vendor_id                   VARCHAR(20)   NOT NULL            COMMENT 'FK → vendors.id',
    vendor_name                 VARCHAR(200)  NULL                COMMENT 'Denormalized for historical record',
    title                       VARCHAR(300)  NOT NULL,
    type                        ENUM('Master Service Agreement','Statement of Work','NDA','Amendment','Purchase Order') NOT NULL,
    status                      ENUM('Active','Expired','Pending','Renewal Due','Terminated') NOT NULL DEFAULT 'Pending',
    value                       DECIMAL(15,2) NULL                COMMENT 'Total contract value in USD',
    start_date                  DATE          NULL,
    end_date                    DATE          NULL,
    owner                       VARCHAR(200)  NULL                COMMENT 'Contract owner name or user ref',
    department                  VARCHAR(100)  NULL,
    description                 TEXT          NULL,
    auto_renew                  TINYINT(1)    NOT NULL DEFAULT 0,
    notice_period_days          INT           NULL                COMMENT 'Days advance notice required for termination/non-renewal',
    sharepoint_link             VARCHAR(1000) NULL                COMMENT 'Link to contract document in SharePoint',
    vendor_communications_direct TINYINT(1)   NOT NULL DEFAULT 0  COMMENT 'Vendor communicates directly with participants',
    has_ai_features             TINYINT(1)    NOT NULL DEFAULT 0  COMMENT 'Contract covers AI-enabled product or service',
    evergreen                   TINYINT(1)    NOT NULL DEFAULT 0  COMMENT 'No fixed end date; renews indefinitely',
    budget_manager              VARCHAR(200)  NULL,
    vendor_signatory            VARCHAR(200)  NULL,
    company_signatory           VARCHAR(200)  NULL,
    created_by                  VARCHAR(200)  NULL,
    created_on                  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by                 VARCHAR(200)  NULL,
    modified_on                 DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_contracts_vendor (vendor_id),
    INDEX idx_contracts_status (status),
    INDEX idx_contracts_end_date (end_date),
    CONSTRAINT fk_contracts_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Contract records; each contract belongs to exactly one vendor';

-- Business owners on a contract (many-to-many)
CREATE TABLE IF NOT EXISTS contract_business_owners (
    contract_id VARCHAR(20) NOT NULL COMMENT 'FK → contracts.id',
    user_id     VARCHAR(20) NOT NULL COMMENT 'FK → app_users.id',
    created_on  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contract_id, user_id),
    CONSTRAINT fk_cbo_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cbo_user     FOREIGN KEY (user_id)     REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Individuals involved in a contract (many-to-many, e.g. plan participants)
CREATE TABLE IF NOT EXISTS contract_individuals (
    contract_id VARCHAR(20) NOT NULL COMMENT 'FK → contracts.id',
    user_id     VARCHAR(20) NOT NULL COMMENT 'FK → app_users.id',
    created_on  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (contract_id, user_id),
    CONSTRAINT fk_ci_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_user     FOREIGN KEY (user_id)     REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contract activity / change feed
CREATE TABLE IF NOT EXISTS contract_activity_log (
    id          VARCHAR(20)  NOT NULL             COMMENT 'Format: CAL-###',
    contract_id VARCHAR(20)  NOT NULL             COMMENT 'FK → contracts.id',
    vendor_id   VARCHAR(20)  NULL                 COMMENT 'FK → vendors.id (denormalized)',
    user_name   VARCHAR(200) NULL,
    action      VARCHAR(500) NOT NULL,
    logged_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cal_contract (contract_id),
    CONSTRAINT fk_cal_contract FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail of contract record changes and key lifecycle events';


-- =============================================================================
-- MODULE 4: ENTERPRISE RISK MANAGEMENT (ERM)
-- =============================================================================

CREATE TABLE IF NOT EXISTS risk_categories (
    id                 VARCHAR(20)  NOT NULL             COMMENT 'Format: RCAT-###',
    name               VARCHAR(200) NOT NULL,
    code               VARCHAR(20)  NOT NULL,
    description        TEXT         NULL,
    color_hex          VARCHAR(7)   NOT NULL DEFAULT '#6B7489',
    parent_category_id VARCHAR(20)  NULL                 COMMENT 'Self-referencing FK for category hierarchy',
    sort_order         INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_rc_parent (parent_category_id),
    CONSTRAINT fk_rc_parent FOREIGN KEY (parent_category_id)
        REFERENCES risk_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hierarchical risk category taxonomy (e.g. Cyber > Ransomware)';

CREATE TABLE IF NOT EXISTS risks (
    id                 VARCHAR(20)  NOT NULL             COMMENT 'Format: RSK-###',
    category_id        VARCHAR(20)  NULL                 COMMENT 'FK → risk_categories.id',
    owner_id           VARCHAR(20)  NULL                 COMMENT 'FK → app_users.id',
    department         VARCHAR(100) NULL,
    title              VARCHAR(300) NOT NULL,
    description        TEXT         NULL,
    status             ENUM('draft','active','closed','archived') NOT NULL DEFAULT 'draft',
    risk_type          ENUM('strategic','operational','financial','compliance','reputational','cyber') NOT NULL,
    appetite_level     ENUM('averse','minimal','cautious','open','hungry') NOT NULL DEFAULT 'cautious',
    review_frequency   ENUM('monthly','quarterly','semi_annual','annual') NOT NULL DEFAULT 'quarterly',
    next_review_date   DATE         NULL,
    is_enterprise_risk TINYINT(1)   NOT NULL DEFAULT 0   COMMENT 'When true, this is a top-level enterprise risk',
    enterprise_risk_id VARCHAR(20)  NULL                 COMMENT 'FK → risks.id; links to parent enterprise risk',
    created_by         VARCHAR(200) NULL,
    created_on         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by        VARCHAR(200) NULL,
    modified_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_risks_status (status),
    INDEX idx_risks_type (risk_type),
    INDEX idx_risks_owner (owner_id),
    INDEX idx_risks_enterprise (is_enterprise_risk),
    CONSTRAINT fk_risks_category   FOREIGN KEY (category_id)        REFERENCES risk_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_risks_owner      FOREIGN KEY (owner_id)           REFERENCES app_users(id)       ON DELETE SET NULL,
    CONSTRAINT fk_risks_enterprise FOREIGN KEY (enterprise_risk_id) REFERENCES risks(id)           ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Enterprise risk register; supports both enterprise-level and departmental risks';

-- Quantified risk assessment snapshots; one row = one assessment event
CREATE TABLE IF NOT EXISTS risk_assessments (
    id                VARCHAR(20)  NOT NULL             COMMENT 'Format: ASMT-###',
    risk_id           VARCHAR(20)  NOT NULL             COMMENT 'FK → risks.id',
    reviewer_id       VARCHAR(20)  NULL                 COMMENT 'FK → app_users.id',
    assessment_date   DATE         NOT NULL,
    assessment_type   ENUM('periodic','triggered','ad_hoc') NOT NULL DEFAULT 'periodic',
    likelihood_score  INT          NOT NULL             COMMENT '1–5 scale',
    impact_score      INT          NOT NULL             COMMENT '1–5 scale',
    velocity_score    INT          NULL                 COMMENT '1–5 scale; optional speed-of-onset factor',
    inherent_score    INT          NOT NULL             COMMENT 'likelihood × impact before controls',
    residual_score    INT          NOT NULL             COMMENT 'Post-control adjusted score',
    target_score      INT          NULL                 COMMENT 'Desired future residual score',
    risk_rating       ENUM('critical','high','medium','low','negligible') NOT NULL,
    notes             TEXT         NULL,
    is_current        TINYINT(1)   NOT NULL DEFAULT 0   COMMENT 'Only one row per risk may be current=1',
    created_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ra_risk (risk_id),
    INDEX idx_ra_current (risk_id, is_current),
    CONSTRAINT fk_ra_risk     FOREIGN KEY (risk_id)     REFERENCES risks(id)      ON DELETE CASCADE,
    CONSTRAINT fk_ra_reviewer FOREIGN KEY (reviewer_id) REFERENCES app_users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Scored risk assessment snapshots; is_current=1 identifies the active assessment per risk';

-- Mitigation/treatment actions for a risk
CREATE TABLE IF NOT EXISTS risk_mitigation_actions (
    id                  VARCHAR(20)   NOT NULL           COMMENT 'Format: MIT-###',
    risk_id             VARCHAR(20)   NOT NULL           COMMENT 'FK → risks.id',
    assigned_to_id      VARCHAR(20)   NULL               COMMENT 'FK → app_users.id',
    approved_by_id      VARCHAR(20)   NULL               COMMENT 'FK → app_users.id',
    title               VARCHAR(300)  NOT NULL,
    description         TEXT          NULL,
    action_type         ENUM('mitigate','accept','transfer','avoid') NOT NULL,
    status              ENUM('open','in_progress','complete','deferred','cancelled') NOT NULL DEFAULT 'open',
    priority            ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
    due_date            DATE          NULL,
    completion_date     DATE          NULL,
    cost_estimate       DECIMAL(15,2) NULL               COMMENT 'Estimated cost in USD',
    effectiveness_score INT           NULL               COMMENT '1–5; only populated after completion',
    created_on          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rma_risk (risk_id),
    INDEX idx_rma_status (status),
    CONSTRAINT fk_rma_risk        FOREIGN KEY (risk_id)        REFERENCES risks(id)      ON DELETE CASCADE,
    CONSTRAINT fk_rma_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES app_users(id)  ON DELETE SET NULL,
    CONSTRAINT fk_rma_approved_by FOREIGN KEY (approved_by_id) REFERENCES app_users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Treatment/mitigation actions planned or executed for a risk';


-- =============================================================================
-- MODULE 5: CONTROLS
-- =============================================================================

CREATE TABLE IF NOT EXISTS controls (
    id                VARCHAR(20)  NOT NULL             COMMENT 'Format: CTL-###',
    owner_id          VARCHAR(20)  NULL                 COMMENT 'FK → app_users.id',
    department        VARCHAR(100) NULL,
    name              VARCHAR(300) NOT NULL,
    description       TEXT         NULL,
    control_type      ENUM('preventive','detective','corrective','directive','compensating') NOT NULL,
    frequency         ENUM('continuous','daily','weekly','monthly','quarterly','annual') NOT NULL,
    effectiveness     ENUM('effective','partially_effective','ineffective','not_tested') NOT NULL DEFAULT 'not_tested',
    is_automated      TINYINT(1)   NOT NULL DEFAULT 0,
    last_tested_date  DATE         NULL,
    next_test_date    DATE         NULL,
    status            ENUM('active','inactive','in_design','deprecated') NOT NULL DEFAULT 'in_design',
    framework_ref     VARCHAR(200) NULL                 COMMENT 'Free-text cross-reference to framework requirement',
    created_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_controls_status (status),
    INDEX idx_controls_type (control_type),
    CONSTRAINT fk_controls_owner FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Internal control catalog; controls are mapped to risks, frameworks, and regulations';

-- Risk ↔ Control many-to-many
CREATE TABLE IF NOT EXISTS risk_controls (
    risk_id        VARCHAR(20)  NOT NULL               COMMENT 'FK → risks.id',
    control_id     VARCHAR(20)  NOT NULL               COMMENT 'FK → controls.id',
    coverage_level ENUM('full','substantial','partial','minimal') NOT NULL DEFAULT 'partial',
    is_primary     TINYINT(1)   NOT NULL DEFAULT 0     COMMENT 'Primary mitigating control for this risk',
    mapping_notes  TEXT         NULL,
    created_by_id  VARCHAR(20)  NULL                   COMMENT 'FK → app_users.id',
    created_on     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (risk_id, control_id),
    INDEX idx_rc_control (control_id),
    CONSTRAINT fk_rc_risk    FOREIGN KEY (risk_id)    REFERENCES risks(id)    ON DELETE CASCADE,
    CONSTRAINT fk_rc_control FOREIGN KEY (control_id) REFERENCES controls(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps controls to the risks they mitigate, with coverage and primacy flags';


-- =============================================================================
-- MODULE 6: KEY RISK INDICATORS (KRIs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS key_risk_indicators (
    id                    VARCHAR(20)  NOT NULL          COMMENT 'Format: KRI-###',
    name                  VARCHAR(300) NOT NULL,
    description           TEXT         NULL,
    unit                  VARCHAR(50)  NULL              COMMENT 'e.g. %, count, days',
    category              VARCHAR(100) NULL              COMMENT 'e.g. Cyber, Operational, Compliance',
    calculation_source    ENUM('auto_overdue_control_tests','auto_ineffective_controls','auto_open_high_critical_risks','auto_overdue_risk_reviews','auto_unmitigated_risks','auto_control_coverage','manual') NOT NULL DEFAULT 'manual',
    threshold_direction   ENUM('lower_is_better','higher_is_better') NOT NULL DEFAULT 'lower_is_better',
    green_threshold       DECIMAL(10,2) NOT NULL,
    amber_threshold       DECIMAL(10,2) NOT NULL,
    current_value         DECIMAL(10,2) NULL             COMMENT 'Persisted for manual KRIs; derived at runtime for auto KRIs',
    status                ENUM('green','amber','red','no_data') NOT NULL DEFAULT 'no_data',
    owner_id              VARCHAR(20)   NULL             COMMENT 'FK → app_users.id',
    is_active             TINYINT(1)    NOT NULL DEFAULT 1,
    created_on            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_kri_status (status),
    CONSTRAINT fk_kri_owner FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Key Risk Indicator definitions; auto KRIs derive values from live data at runtime';

-- Historical data points for each KRI (up to 6 retained for trend display)
CREATE TABLE IF NOT EXISTS kri_data_points (
    kri_id      VARCHAR(20)   NOT NULL COMMENT 'FK → key_risk_indicators.id',
    point_date  DATE          NOT NULL,
    value       DECIMAL(10,2) NOT NULL,
    entered_by  VARCHAR(200)  NULL,
    PRIMARY KEY (kri_id, point_date),
    CONSTRAINT fk_kdp_kri FOREIGN KEY (kri_id) REFERENCES key_risk_indicators(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historical measurement snapshots for KRI trend visualization';


-- =============================================================================
-- MODULE 7: BUSINESS PROCESSES
-- =============================================================================

CREATE TABLE IF NOT EXISTS processes (
    id                  VARCHAR(20)  NOT NULL            COMMENT 'Format: PRC-###',
    name                VARCHAR(300) NOT NULL,
    short_description   VARCHAR(500) NULL,
    purpose             TEXT         NULL,
    scope               TEXT         NULL,
    business_domain     VARCHAR(100) NULL,
    owner_id            VARCHAR(20)  NULL                COMMENT 'FK → app_users.id',
    status              ENUM('Draft','Active','Retired') NOT NULL DEFAULT 'Draft',
    effective_start_date DATE        NULL,
    effective_end_date   DATE        NULL,
    created_on          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_processes_status (status),
    CONSTRAINT fk_processes_owner FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Business process catalog; each process can have sub-processes and steps';

-- Tags on processes (normalized from the string array)
CREATE TABLE IF NOT EXISTS process_tags (
    process_id VARCHAR(20)  NOT NULL COMMENT 'FK → processes.id',
    tag        VARCHAR(100) NOT NULL,
    PRIMARY KEY (process_id, tag),
    CONSTRAINT fk_pt_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sub-processes within a process
CREATE TABLE IF NOT EXISTS sub_processes (
    id              VARCHAR(20)  NOT NULL COMMENT 'Format: SUB-###',
    process_id      VARCHAR(20)  NOT NULL COMMENT 'FK → processes.id',
    name            VARCHAR(300) NOT NULL,
    description     TEXT         NULL,
    objective       TEXT         NULL,
    boundary_start  TEXT         NULL,
    boundary_end    TEXT         NULL,
    owner_id        VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    sort_order      INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_sp_process (process_id),
    CONSTRAINT fk_sp_process FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    CONSTRAINT fk_sp_owner   FOREIGN KEY (owner_id)   REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Steps within a sub-process
CREATE TABLE IF NOT EXISTS process_steps (
    id                VARCHAR(20)  NOT NULL COMMENT 'Format: STP-###',
    sub_process_id    VARCHAR(20)  NOT NULL COMMENT 'FK → sub_processes.id',
    type              ENUM('Task','Decision','Hand-off') NOT NULL DEFAULT 'Task',
    description       TEXT         NULL,
    input             TEXT         NULL,
    output            TEXT         NULL,
    entry_criteria    TEXT         NULL,
    exit_criteria     TEXT         NULL,
    system_tool       VARCHAR(200) NULL,
    responsible_role  VARCHAR(200) NULL,
    sort_order        INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_pstep_sub (sub_process_id),
    CONSTRAINT fk_pstep_sub FOREIGN KEY (sub_process_id) REFERENCES sub_processes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step-to-step links (for flow/decision branching)
CREATE TABLE IF NOT EXISTS process_step_links (
    from_step_id VARCHAR(20) NOT NULL COMMENT 'FK → process_steps.id',
    to_step_id   VARCHAR(20) NOT NULL COMMENT 'FK → process_steps.id',
    PRIMARY KEY (from_step_id, to_step_id),
    CONSTRAINT fk_psl_from FOREIGN KEY (from_step_id) REFERENCES process_steps(id) ON DELETE CASCADE,
    CONSTRAINT fk_psl_to   FOREIGN KEY (to_step_id)   REFERENCES process_steps(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Process dependency graph
CREATE TABLE IF NOT EXISTS process_dependencies (
    process_id         VARCHAR(20) NOT NULL COMMENT 'FK → processes.id; the dependent process',
    depends_on_process VARCHAR(20) NOT NULL COMMENT 'FK → processes.id; the upstream process',
    PRIMARY KEY (process_id, depends_on_process),
    CONSTRAINT fk_pd_process    FOREIGN KEY (process_id)         REFERENCES processes(id) ON DELETE CASCADE,
    CONSTRAINT fk_pd_depends_on FOREIGN KEY (depends_on_process) REFERENCES processes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Process ↔ Risk links
CREATE TABLE IF NOT EXISTS process_risk_links (
    id              VARCHAR(20) NOT NULL COMMENT 'Format: PRL-###',
    process_id      VARCHAR(20) NOT NULL COMMENT 'FK → processes.id',
    sub_process_id  VARCHAR(20) NULL     COMMENT 'FK → sub_processes.id; NULL = process-level link',
    risk_id         VARCHAR(20) NOT NULL COMMENT 'FK → risks.id',
    notes           TEXT        NULL,
    linked_by_id    VARCHAR(20) NULL     COMMENT 'FK → app_users.id',
    linked_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_prl (process_id, sub_process_id, risk_id),
    INDEX idx_prl_risk (risk_id),
    CONSTRAINT fk_prl_process FOREIGN KEY (process_id)     REFERENCES processes(id)     ON DELETE CASCADE,
    CONSTRAINT fk_prl_sub     FOREIGN KEY (sub_process_id) REFERENCES sub_processes(id) ON DELETE SET NULL,
    CONSTRAINT fk_prl_risk    FOREIGN KEY (risk_id)        REFERENCES risks(id)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Links risks to processes or sub-processes for impact analysis';

-- Process ↔ Control links
CREATE TABLE IF NOT EXISTS process_control_links (
    id                VARCHAR(20)  NOT NULL COMMENT 'Format: PCL-###',
    process_id        VARCHAR(20)  NOT NULL COMMENT 'FK → processes.id',
    sub_process_id    VARCHAR(20)  NULL     COMMENT 'FK → sub_processes.id',
    control_id        VARCHAR(20)  NOT NULL COMMENT 'FK → controls.id',
    control_objective TEXT         NULL,
    is_key_control    TINYINT(1)   NOT NULL DEFAULT 0,
    testing_frequency ENUM('Continuous','Daily','Weekly','Monthly','Quarterly','Annual','Ad-hoc') NULL,
    linked_by_id      VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    linked_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pcl (process_id, sub_process_id, control_id),
    INDEX idx_pcl_control (control_id),
    CONSTRAINT fk_pcl_process FOREIGN KEY (process_id)     REFERENCES processes(id)     ON DELETE CASCADE,
    CONSTRAINT fk_pcl_sub     FOREIGN KEY (sub_process_id) REFERENCES sub_processes(id) ON DELETE SET NULL,
    CONSTRAINT fk_pcl_control FOREIGN KEY (control_id)     REFERENCES controls(id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Links controls to processes, flagging key controls and testing cadence';


-- =============================================================================
-- MODULE 8: COMPLIANCE FRAMEWORKS
-- =============================================================================

CREATE TABLE IF NOT EXISTS compliance_frameworks (
    id                    VARCHAR(20)  NOT NULL COMMENT 'Format: FWK-###',
    name                  VARCHAR(300) NOT NULL COMMENT 'e.g. HITRUST CSF v11.3, ISO 27001:2022',
    version               VARCHAR(50)  NULL,
    governing_body        VARCHAR(200) NULL     COMMENT 'e.g. HITRUST Alliance, ISO, AICPA, NIST',
    status                ENUM('active','sunset','draft') NOT NULL DEFAULT 'draft',
    certification_required TINYINT(1)  NOT NULL DEFAULT 0,
    effective_date        DATE         NULL,
    next_assessment_date  DATE         NULL,
    description           TEXT         NULL,
    created_on            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Compliance framework catalog (HITRUST, ISO 27001, SOC 2, NIST CSF, etc.)';

-- Hierarchical requirements within a framework
CREATE TABLE IF NOT EXISTS framework_requirements (
    id                    VARCHAR(20)  NOT NULL COMMENT 'Format: REQ-[H|I|S|N]-###',
    framework_id          VARCHAR(20)  NOT NULL COMMENT 'FK → compliance_frameworks.id',
    parent_requirement_id VARCHAR(20)  NULL     COMMENT 'FK → framework_requirements.id; NULL = domain/top-level node',
    reference_code        VARCHAR(50)  NOT NULL COMMENT 'e.g. 01a, A8.15, CC6.1, PR.AC-1',
    title                 VARCHAR(300) NOT NULL,
    description           TEXT         NULL,
    domain                VARCHAR(200) NULL     COMMENT 'Top-level domain/category label',
    maturity_level        INT          NULL     COMMENT '1–3 for HITRUST; NULL for other frameworks',
    is_required           TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order            INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_fr_framework (framework_id),
    INDEX idx_fr_parent (parent_requirement_id),
    CONSTRAINT fk_fr_framework FOREIGN KEY (framework_id)          REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
    CONSTRAINT fk_fr_parent    FOREIGN KEY (parent_requirement_id) REFERENCES framework_requirements(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tree-structured requirements within a compliance framework; leaf nodes map to controls';

-- Control ↔ Framework Requirement mappings
CREATE TABLE IF NOT EXISTS control_requirement_mappings (
    id                      VARCHAR(20)  NOT NULL COMMENT 'Format: CRM-###',
    control_id              VARCHAR(20)  NOT NULL COMMENT 'FK → controls.id',
    requirement_id          VARCHAR(20)  NOT NULL COMMENT 'FK → framework_requirements.id',
    implementation_status   ENUM('not_started','in_progress','implemented','not_applicable') NOT NULL DEFAULT 'not_started',
    maturity_score          INT          NULL     COMMENT '1–5; primarily used for HITRUST',
    evidence_description    TEXT         NULL,
    gap_notes               TEXT         NULL,
    last_assessed_date      DATE         NULL,
    assessor_id             VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    remediation_target_date DATE         NULL,
    created_on              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_crm (control_id, requirement_id),
    INDEX idx_crm_requirement (requirement_id),
    CONSTRAINT fk_crm_control      FOREIGN KEY (control_id)     REFERENCES controls(id)              ON DELETE CASCADE,
    CONSTRAINT fk_crm_requirement  FOREIGN KEY (requirement_id) REFERENCES framework_requirements(id) ON DELETE CASCADE,
    CONSTRAINT fk_crm_assessor     FOREIGN KEY (assessor_id)    REFERENCES app_users(id)              ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps internal controls to framework requirements with implementation status and maturity';


-- =============================================================================
-- MODULE 9: REGULATORY REGISTER
-- =============================================================================

CREATE TABLE IF NOT EXISTS regulations (
    id                   VARCHAR(20)  NOT NULL            COMMENT 'Format: REG-###',
    regulation_number    VARCHAR(100) NULL                COMMENT 'Official citation (e.g. EU-GDPR-2016/679)',
    title                VARCHAR(300) NOT NULL,
    description          TEXT         NULL,
    regulatory_body      VARCHAR(200) NULL                COMMENT 'e.g. SEC, EU Parliament, FINRA',
    jurisdiction         VARCHAR(200) NULL                COMMENT 'e.g. Federal - USA, EU, California',
    category             VARCHAR(100) NULL                COMMENT 'e.g. Financial, Privacy, Safety',
    impact_level         ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
    status               ENUM('monitoring','in-review','in-progress','compliant','non-compliant','not-applicable','archived') NOT NULL DEFAULT 'monitoring',
    stage                ENUM('proposed','committee','passed','effective','amended','repealed') NOT NULL DEFAULT 'proposed',
    proposed_date        DATE         NULL,
    publication_date     DATE         NULL,
    effective_date       DATE         NULL,
    compliance_deadline  DATE         NULL,
    review_date          DATE         NULL,
    primary_owner_id     VARCHAR(20)  NULL                COMMENT 'FK → app_users.id',
    compliance_status    ENUM('not-started','assessment','planning','implementing','testing','compliant','partial','non-compliant') NOT NULL DEFAULT 'not-started',
    compliance_score     INT          NULL                COMMENT 'Calculated 0–100 compliance score',
    official_url         VARCHAR(1000) NULL,
    internal_notes       TEXT         NULL,
    created_by           VARCHAR(200) NULL,
    created_on           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          VARCHAR(200) NULL,
    modified_on          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_reg_status (status),
    INDEX idx_reg_impact (impact_level),
    CONSTRAINT fk_reg_owner FOREIGN KEY (primary_owner_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Regulatory obligation register; tracks lifecycle from proposed bill through compliance';

-- Stakeholders on a regulation (many-to-many)
CREATE TABLE IF NOT EXISTS regulation_stakeholders (
    regulation_id VARCHAR(20) NOT NULL COMMENT 'FK → regulations.id',
    user_id       VARCHAR(20) NOT NULL COMMENT 'FK → app_users.id',
    PRIMARY KEY (regulation_id, user_id),
    CONSTRAINT fk_rs_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rs_user       FOREIGN KEY (user_id)       REFERENCES app_users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Discrete requirements within a regulation (mapped from the reg text)
CREATE TABLE IF NOT EXISTS regulation_requirements (
    id                   VARCHAR(20)  NOT NULL COMMENT 'Format: RREQ-###',
    regulation_id        VARCHAR(20)  NOT NULL COMMENT 'FK → regulations.id',
    requirement_number   VARCHAR(50)  NULL     COMMENT 'Official section (e.g. Art. 5.1.a, §1798.100)',
    title                VARCHAR(300) NOT NULL,
    description          TEXT         NULL,
    requirement_type     ENUM('must','should','may','must-not') NOT NULL DEFAULT 'must',
    citation             VARCHAR(300) NULL,
    section              VARCHAR(200) NULL,
    applicability        TEXT         NULL,
    interpretation_notes TEXT         NULL,
    status               ENUM('identified','in-analysis','mapped','implemented','verified') NOT NULL DEFAULT 'identified',
    gap_analysis         TEXT         NULL,
    remediation_plan     TEXT         NULL,
    assigned_to_id       VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    due_date             DATE         NULL,
    priority             ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
    created_by           VARCHAR(200) NULL,
    created_on           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by          VARCHAR(200) NULL,
    modified_on          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rreq_regulation (regulation_id),
    CONSTRAINT fk_rreq_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
    CONSTRAINT fk_rreq_assignee   FOREIGN KEY (assigned_to_id) REFERENCES app_users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Parsed and tracked requirements extracted from a specific regulation';

-- Controls linked to regulation requirements
CREATE TABLE IF NOT EXISTS regulation_requirement_controls (
    requirement_id VARCHAR(20) NOT NULL COMMENT 'FK → regulation_requirements.id',
    control_id     VARCHAR(20) NOT NULL COMMENT 'FK → controls.id',
    PRIMARY KEY (requirement_id, control_id),
    CONSTRAINT fk_rrc_req     FOREIGN KEY (requirement_id) REFERENCES regulation_requirements(id) ON DELETE CASCADE,
    CONSTRAINT fk_rrc_control FOREIGN KEY (control_id)     REFERENCES controls(id)               ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Regulation ↔ Control mappings (regulation-level, not requirement-level)
CREATE TABLE IF NOT EXISTS regulation_controls (
    regulation_id         VARCHAR(20)  NOT NULL COMMENT 'FK → regulations.id',
    control_id            VARCHAR(20)  NOT NULL COMMENT 'FK → controls.id',
    requirement_text      TEXT         NULL     COMMENT 'Specific regulatory text this control satisfies',
    coverage_level        ENUM('full','partial','none') NOT NULL DEFAULT 'partial',
    is_primary            TINYINT(1)   NOT NULL DEFAULT 0,
    implementation_status ENUM('not-started','in-progress','implemented','tested','verified') NOT NULL DEFAULT 'not-started',
    evidence_provided     TINYINT(1)   NOT NULL DEFAULT 0,
    mapping_notes         TEXT         NULL,
    gap_description       TEXT         NULL,
    created_by            VARCHAR(200) NULL,
    created_on            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by           VARCHAR(200) NULL,
    modified_on           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (regulation_id, control_id),
    INDEX idx_regctl_control (control_id),
    CONSTRAINT fk_regctl_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE,
    CONSTRAINT fk_regctl_control    FOREIGN KEY (control_id)    REFERENCES controls(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Regulation-level control coverage mapping with implementation and verification status';

-- Documents attached to a regulation
CREATE TABLE IF NOT EXISTS regulation_documents (
    id                  VARCHAR(20)  NOT NULL COMMENT 'Format: DOC-###',
    regulation_id       VARCHAR(20)  NOT NULL COMMENT 'FK → regulations.id',
    file_name           VARCHAR(300) NOT NULL,
    file_size           BIGINT       NULL     COMMENT 'File size in bytes',
    file_type           VARCHAR(100) NULL     COMMENT 'MIME type',
    uploaded_date       DATE         NULL,
    document_type       ENUM('regulation-text','guidance','legal-opinion','impact-assessment','internal-memo','training-material','audit-report','correspondence','other') NOT NULL DEFAULT 'other',
    version             VARCHAR(50)  NULL,
    description         TEXT         NULL,
    is_official         TINYINT(1)   NOT NULL DEFAULT 0,
    file_url            VARCHAR(1000) NULL,
    previous_version_id VARCHAR(20)  NULL     COMMENT 'FK → regulation_documents.id; version chain',
    uploaded_by         VARCHAR(200) NULL,
    updated_on          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by          VARCHAR(200) NULL,
    PRIMARY KEY (id),
    INDEX idx_rd_regulation (regulation_id),
    CONSTRAINT fk_rd_regulation FOREIGN KEY (regulation_id)     REFERENCES regulations(id)          ON DELETE CASCADE,
    CONSTRAINT fk_rd_prev_ver   FOREIGN KEY (previous_version_id) REFERENCES regulation_documents(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Documents attached to regulations; supports version chaining via previous_version_id';

-- Document tags (normalized)
CREATE TABLE IF NOT EXISTS regulation_document_tags (
    document_id VARCHAR(20)  NOT NULL COMMENT 'FK → regulation_documents.id',
    tag         VARCHAR(100) NOT NULL,
    PRIMARY KEY (document_id, tag),
    CONSTRAINT fk_rdt_document FOREIGN KEY (document_id) REFERENCES regulation_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Threaded comments on regulations
CREATE TABLE IF NOT EXISTS regulation_comments (
    id               VARCHAR(20)  NOT NULL COMMENT 'Format: CMT-###',
    regulation_id    VARCHAR(20)  NOT NULL COMMENT 'FK → regulations.id',
    comment_type     ENUM('note','analysis','decision','update','risk','question') NOT NULL DEFAULT 'note',
    content          TEXT         NOT NULL,
    parent_comment_id VARCHAR(20) NULL     COMMENT 'FK → regulation_comments.id; NULL = top-level',
    is_internal      TINYINT(1)   NOT NULL DEFAULT 1,
    created_by       VARCHAR(200) NULL,
    created_on       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by       VARCHAR(200) NULL,
    updated_on       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rcmt_regulation (regulation_id),
    INDEX idx_rcmt_parent (parent_comment_id),
    CONSTRAINT fk_rcmt_regulation FOREIGN KEY (regulation_id)     REFERENCES regulations(id)        ON DELETE CASCADE,
    CONSTRAINT fk_rcmt_parent     FOREIGN KEY (parent_comment_id) REFERENCES regulation_comments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Threaded discussion comments on regulation records (notes, analysis, decisions, questions)';

-- Comment mentions (normalized from the mentions string array)
CREATE TABLE IF NOT EXISTS regulation_comment_mentions (
    comment_id  VARCHAR(20)  NOT NULL COMMENT 'FK → regulation_comments.id',
    mentioned   VARCHAR(200) NOT NULL COMMENT 'User ID or name string of mentioned person',
    PRIMARY KEY (comment_id, mentioned),
    CONSTRAINT fk_rcm_comment FOREIGN KEY (comment_id) REFERENCES regulation_comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- MODULE 10: LEGISLATIVE BILL TRACKER
-- =============================================================================

CREATE TABLE IF NOT EXISTS bills (
    id                    VARCHAR(20)  NOT NULL COMMENT 'Format: BILL-###',
    bill_number           VARCHAR(100) NOT NULL COMMENT 'Official number (e.g. H.R. 1234, S.B. 567)',
    title                 VARCHAR(300) NOT NULL,
    summary               TEXT         NULL,
    legislature           VARCHAR(200) NULL     COMMENT 'e.g. 117th Congress, California State Assembly',
    sponsor               VARCHAR(200) NULL,
    introduced_date       DATE         NULL,
    status                ENUM('introduced','in-committee','committee-passed','floor-debate','passed-chamber','other-chamber','conference','passed-both','signed','vetoed','failed') NOT NULL DEFAULT 'introduced',
    current_committee     VARCHAR(300) NULL,
    regulation_id         VARCHAR(20)  NULL     COMMENT 'FK → regulations.id; set when bill becomes regulation',
    assigned_to_id        VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    priority              ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
    internal_notes        TEXT         NULL,
    official_url          VARCHAR(1000) NULL,
    created_by            VARCHAR(200) NULL,
    created_on            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by           VARCHAR(200) NULL,
    modified_on           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bills_status (status),
    INDEX idx_bills_regulation (regulation_id),
    CONSTRAINT fk_bills_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id)  ON DELETE SET NULL,
    CONSTRAINT fk_bills_assignee   FOREIGN KEY (assigned_to_id) REFERENCES app_users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks proposed legislation through the legislative lifecycle into enacted regulations';

-- Related regulations for a bill (many-to-many)
CREATE TABLE IF NOT EXISTS bill_related_regulations (
    bill_id       VARCHAR(20) NOT NULL COMMENT 'FK → bills.id',
    regulation_id VARCHAR(20) NOT NULL COMMENT 'FK → regulations.id',
    PRIMARY KEY (bill_id, regulation_id),
    CONSTRAINT fk_brr_bill       FOREIGN KEY (bill_id)       REFERENCES bills(id)       ON DELETE CASCADE,
    CONSTRAINT fk_brr_regulation FOREIGN KEY (regulation_id) REFERENCES regulations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bill_amendments (
    id               VARCHAR(20)  NOT NULL COMMENT 'Format: AMND-###',
    bill_id          VARCHAR(20)  NOT NULL COMMENT 'FK → bills.id',
    amendment_number VARCHAR(50)  NOT NULL,
    description      TEXT         NULL,
    proposed_date    DATE         NULL,
    status           ENUM('proposed','adopted','rejected') NOT NULL DEFAULT 'proposed',
    impact           TEXT         NULL,
    created_on       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ba_bill (bill_id),
    CONSTRAINT fk_ba_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Amendments proposed against a tracked bill';

CREATE TABLE IF NOT EXISTS bill_votes (
    id               VARCHAR(20)  NOT NULL COMMENT 'Format: VOTE-###',
    bill_id          VARCHAR(20)  NOT NULL COMMENT 'FK → bills.id',
    chamber          VARCHAR(100) NOT NULL COMMENT 'e.g. House, Senate',
    vote_date        DATE         NOT NULL,
    result           ENUM('passed','failed') NOT NULL,
    votes_for        INT          NOT NULL DEFAULT 0,
    votes_against    INT          NOT NULL DEFAULT 0,
    votes_abstained  INT          NOT NULL DEFAULT 0,
    created_on       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bv_bill (bill_id),
    CONSTRAINT fk_bv_bill FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Recorded chamber votes on a tracked bill';

-- Threaded comments on bills
CREATE TABLE IF NOT EXISTS bill_comments (
    id                VARCHAR(20)  NOT NULL COMMENT 'Format: BILL-CMT-###',
    bill_id           VARCHAR(20)  NOT NULL COMMENT 'FK → bills.id',
    comment_type      ENUM('note','analysis','decision','update','risk','question') NOT NULL DEFAULT 'note',
    content           TEXT         NOT NULL,
    parent_comment_id VARCHAR(20)  NULL     COMMENT 'FK → bill_comments.id; NULL = top-level',
    is_internal       TINYINT(1)   NOT NULL DEFAULT 1,
    created_by        VARCHAR(200) NULL,
    created_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by        VARCHAR(200) NULL,
    updated_on        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bcmt_bill (bill_id),
    INDEX idx_bcmt_parent (parent_comment_id),
    CONSTRAINT fk_bcmt_bill   FOREIGN KEY (bill_id)           REFERENCES bills(id)          ON DELETE CASCADE,
    CONSTRAINT fk_bcmt_parent FOREIGN KEY (parent_comment_id) REFERENCES bill_comments(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Threaded discussion comments on legislative bill records';


-- =============================================================================
-- MODULE 11: PRODUCTS & BENEFITS
-- =============================================================================

CREATE TABLE IF NOT EXISTS products (
    id                              VARCHAR(20)  NOT NULL COMMENT 'Format: PRD-###',
    name                            VARCHAR(300) NOT NULL,
    type                            ENUM('Benefit','Service') NOT NULL,
    category                        VARCHAR(100) NOT NULL,
    description                     TEXT         NULL,
    status                          ENUM('Active','Draft','Retired','Sunset') NOT NULL DEFAULT 'Draft',
    owner_id                        VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    effective_start_date            DATE         NULL,
    effective_end_date              DATE         NULL,
    -- Roadmap narrative fields
    roadmap_purpose_alignment       TEXT         NULL,
    roadmap_planning                TEXT         NULL,
    roadmap_protection              TEXT         NULL,
    roadmap_price_competitiveness   TEXT         NULL,
    roadmap_performance_measurement TEXT         NULL,
    roadmap_participant_experience  TEXT         NULL,
    created_on                      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on                      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_products_status (status),
    INDEX idx_products_type (type),
    CONSTRAINT fk_products_owner FOREIGN KEY (owner_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Product and benefits catalog; products link to vendors and processes';

-- Product tags
CREATE TABLE IF NOT EXISTS product_tags (
    product_id VARCHAR(20)  NOT NULL COMMENT 'FK → products.id',
    tag        VARCHAR(100) NOT NULL,
    PRIMARY KEY (product_id, tag),
    CONSTRAINT fk_prodtag_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product ↔ Vendor associations
CREATE TABLE IF NOT EXISTS product_vendors (
    product_id VARCHAR(20) NOT NULL COMMENT 'FK → products.id',
    vendor_id  VARCHAR(20) NOT NULL COMMENT 'FK → vendors.id',
    PRIMARY KEY (product_id, vendor_id),
    CONSTRAINT fk_pv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pv_vendor  FOREIGN KEY (vendor_id)  REFERENCES vendors(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product ↔ Process associations
CREATE TABLE IF NOT EXISTS product_process_associations (
    product_id     VARCHAR(20) NOT NULL COMMENT 'FK → products.id',
    process_id     VARCHAR(20) NOT NULL COMMENT 'FK → processes.id',
    sub_process_id VARCHAR(20) NULL     COMMENT 'FK → sub_processes.id',
    PRIMARY KEY (product_id, process_id),
    CONSTRAINT fk_ppa_product FOREIGN KEY (product_id)     REFERENCES products(id)     ON DELETE CASCADE,
    CONSTRAINT fk_ppa_process FOREIGN KEY (process_id)     REFERENCES processes(id)    ON DELETE CASCADE,
    CONSTRAINT fk_ppa_sub     FOREIGN KEY (sub_process_id) REFERENCES sub_processes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product roadmap items
CREATE TABLE IF NOT EXISTS product_roadmap_items (
    id          VARCHAR(20)  NOT NULL COMMENT 'Format: RMP-###',
    product_id  VARCHAR(20)  NOT NULL COMMENT 'FK → products.id',
    name        VARCHAR(300) NOT NULL,
    description TEXT         NULL,
    owner_id    VARCHAR(20)  NULL     COMMENT 'FK → app_users.id',
    start_date  DATE         NULL,
    end_date    DATE         NULL,
    created_on  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pri_product (product_id),
    CONSTRAINT fk_pri_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_pri_owner   FOREIGN KEY (owner_id)   REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- MODULE 12: EMPLOYERS
-- =============================================================================

CREATE TABLE IF NOT EXISTS employers (
    id          VARCHAR(20)  NOT NULL COMMENT 'Format: EMP-### (auto-generated code)',
    code        VARCHAR(20)  NOT NULL COMMENT 'Unique short code, e.g. ACME-001',
    name        VARCHAR(300) NOT NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_by  VARCHAR(200) NULL,
    created_on  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by VARCHAR(200) NULL,
    modified_on DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_employers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Employer entities; may be plan sponsors, affiliates, subsidiaries, or funding entities';

CREATE TABLE IF NOT EXISTS employer_relationships (
    id                  VARCHAR(20) NOT NULL COMMENT 'Format: ERL-###',
    employer_id         VARCHAR(20) NOT NULL COMMENT 'FK → employers.id; the primary employer',
    related_employer_id VARCHAR(20) NOT NULL COMMENT 'FK → employers.id; the related entity',
    relationship_type   ENUM('Affiliate','Subsidiary','Non-Related Entity','Department','Other','Funding Entity') NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_er_pair (employer_id, related_employer_id),
    INDEX idx_er_related (related_employer_id),
    CONSTRAINT fk_er_employer FOREIGN KEY (employer_id)         REFERENCES employers(id) ON DELETE CASCADE,
    CONSTRAINT fk_er_related  FOREIGN KEY (related_employer_id) REFERENCES employers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Directed relationship graph between employer entities';


-- =============================================================================
-- MODULE 13: ADDITIONAL CROSS-MODULE JUNCTION TABLES
-- =============================================================================

-- Vendor ↔ Process associations
CREATE TABLE IF NOT EXISTS vendor_process_associations (
    vendor_id      VARCHAR(20) NOT NULL COMMENT 'FK → vendors.id',
    process_id     VARCHAR(20) NOT NULL COMMENT 'FK → processes.id',
    sub_process_id VARCHAR(20) NULL     COMMENT 'FK → sub_processes.id; NULL = process-level',
    PRIMARY KEY (vendor_id, process_id),
    INDEX idx_vpa_process (process_id),
    CONSTRAINT fk_vpa_vendor  FOREIGN KEY (vendor_id)      REFERENCES vendors(id)       ON DELETE CASCADE,
    CONSTRAINT fk_vpa_process FOREIGN KEY (process_id)     REFERENCES processes(id)     ON DELETE CASCADE,
    CONSTRAINT fk_vpa_sub     FOREIGN KEY (sub_process_id) REFERENCES sub_processes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Associates vendors with the business processes they support';

-- Vendor ↔ Risk associations
CREATE TABLE IF NOT EXISTS vendor_risks (
    vendor_id          VARCHAR(20) NOT NULL COMMENT 'FK → vendors.id',
    risk_id            VARCHAR(20) NOT NULL COMMENT 'FK → risks.id',
    relationship_notes TEXT        NULL,
    created_by_id      VARCHAR(20) NULL     COMMENT 'FK → app_users.id',
    created_on         DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (vendor_id, risk_id),
    INDEX idx_vr_risk (risk_id),
    CONSTRAINT fk_vr_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
    CONSTRAINT fk_vr_risk   FOREIGN KEY (risk_id)   REFERENCES risks(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Associates risks identified through vendor relationships';

-- Vendor ↔ Product associations (alternate path to product_vendors)
-- Handled via product_vendors table; no duplicate junction needed.

-- KRI ↔ Risk associations (a KRI may monitor multiple risks)
CREATE TABLE IF NOT EXISTS kri_risk_links (
    kri_id  VARCHAR(20) NOT NULL COMMENT 'FK → key_risk_indicators.id',
    risk_id VARCHAR(20) NOT NULL COMMENT 'FK → risks.id',
    PRIMARY KEY (kri_id, risk_id),
    INDEX idx_krl_risk (risk_id),
    CONSTRAINT fk_krl_kri  FOREIGN KEY (kri_id)  REFERENCES key_risk_indicators(id) ON DELETE CASCADE,
    CONSTRAINT fk_krl_risk FOREIGN KEY (risk_id) REFERENCES risks(id)               ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Associates KRIs with the risks they measure';

SET FOREIGN_KEY_CHECKS = 1;
