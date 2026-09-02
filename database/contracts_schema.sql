-- ============================================================================
-- Contracts Schema for MariaDB
-- ============================================================================
-- This schema defines the contracts table and related junction tables for
-- managing vendor contracts including MSAs, SOWs, NDAs, amendments, and
-- purchase orders.
-- ============================================================================

-- Main Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    -- Primary Key
    id VARCHAR(20) NOT NULL
        COMMENT 'Unique contract identifier (e.g., CON-001)',

    -- Vendor Reference
    vendor_id VARCHAR(20) NOT NULL
        COMMENT 'Reference to the vendor record (e.g., VEN-001)',
    vendor_name VARCHAR(255) NOT NULL
        COMMENT 'Vendor name denormalized for reporting performance',

    -- Contract Core Fields
    title VARCHAR(500) NOT NULL
        COMMENT 'Contract title or name describing the agreement',
    type ENUM(
        'Master Service Agreement',
        'Statement of Work',
        'NDA',
        'Amendment',
        'Purchase Order'
    ) NOT NULL
        COMMENT 'Type of contract agreement',
    status ENUM(
        'Active',
        'Expired',
        'Pending',
        'Renewal Due',
        'Terminated'
    ) NOT NULL DEFAULT 'Pending'
        COMMENT 'Current status of the contract',

    -- Financial Information
    value DECIMAL(15,2) NOT NULL DEFAULT 0.00
        COMMENT 'Total contract value in USD',

    -- Date Fields
    start_date DATE NOT NULL
        COMMENT 'Contract effective start date',
    end_date DATE NOT NULL
        COMMENT 'Contract expiration or end date',

    -- Ownership and Organization
    owner VARCHAR(255) NOT NULL
        COMMENT 'Primary contract owner/manager responsible for this agreement',
    department VARCHAR(100) NOT NULL
        COMMENT 'Department or business unit that owns this contract',

    -- Description
    description TEXT
        COMMENT 'Detailed description of the contract scope and purpose',

    -- Renewal and Notice Settings
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Whether the contract automatically renews upon expiration',
    notice_period_days INT UNSIGNED NOT NULL DEFAULT 30
        COMMENT 'Number of days notice required for termination or non-renewal',
    evergreen BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Whether this is an evergreen contract with no fixed end date',

    -- Extended Attributes
    sharepoint_link VARCHAR(1000)
        COMMENT 'URL to contract documents in SharePoint or document management system',
    vendor_communications_direct BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Whether direct communication with vendor is permitted outside of contract owner',
    has_ai_features BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Whether the contracted service includes AI/ML capabilities',

    -- Stakeholders
    budget_manager VARCHAR(255)
        COMMENT 'Finance/budget manager responsible for contract spend',
    vendor_signatory VARCHAR(255)
        COMMENT 'Authorized signatory from the vendor organization',
    company_signatory VARCHAR(255)
        COMMENT 'Authorized signatory from the company',

    -- Audit Fields
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT 'Timestamp when the contract record was created',
    created_by VARCHAR(255) NOT NULL
        COMMENT 'User who created the contract record',
    modified_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        COMMENT 'Timestamp when the contract record was last modified',
    modified_by VARCHAR(255) NOT NULL
        COMMENT 'User who last modified the contract record',

    -- Constraints
    PRIMARY KEY (id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_status (status),
    INDEX idx_department (department),
    INDEX idx_end_date (end_date),
    INDEX idx_type (type),
    INDEX idx_created_on (created_on),
    INDEX idx_modified_on (modified_on)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Vendor contracts including MSAs, SOWs, NDAs, amendments, and purchase orders with complete lifecycle tracking';


-- Contract Business Owners Junction Table
CREATE TABLE IF NOT EXISTS contract_business_owners (
    -- Composite Primary Key
    contract_id VARCHAR(20) NOT NULL
        COMMENT 'Reference to the contract record',
    user_id VARCHAR(20) NOT NULL
        COMMENT 'Reference to the user who is a business owner',

    -- User Information (Denormalized)
    user_name VARCHAR(255) NOT NULL
        COMMENT 'Business owner full name',
    user_initials VARCHAR(10) NOT NULL
        COMMENT 'Business owner initials for UI display',
    user_department VARCHAR(100) NOT NULL
        COMMENT 'Business owner department',

    -- Audit Fields
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT 'Timestamp when the business owner assignment was created',
    created_by VARCHAR(255) NOT NULL
        COMMENT 'User who assigned the business owner',

    -- Constraints
    PRIMARY KEY (contract_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_contract_id (contract_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Business owners responsible for contract strategic oversight and decision-making';


-- Contract Individuals Involved Junction Table
CREATE TABLE IF NOT EXISTS contract_individuals_involved (
    -- Composite Primary Key
    contract_id VARCHAR(20) NOT NULL
        COMMENT 'Reference to the contract record',
    user_id VARCHAR(20) NOT NULL
        COMMENT 'Reference to the user involved in contract management',

    -- User Information (Denormalized)
    user_name VARCHAR(255) NOT NULL
        COMMENT 'Individual full name',
    user_initials VARCHAR(10) NOT NULL
        COMMENT 'Individual initials for UI display',
    user_department VARCHAR(100) NOT NULL
        COMMENT 'Individual department',

    -- Audit Fields
    created_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT 'Timestamp when the individual was assigned',
    created_by VARCHAR(255) NOT NULL
        COMMENT 'User who assigned the individual',

    -- Constraints
    PRIMARY KEY (contract_id, user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_contract_id (contract_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individuals involved in day-to-day contract operations and execution';


-- ============================================================================
-- Sample Queries
-- ============================================================================

-- Get all active contracts expiring in the next 90 days
/*
SELECT
    c.id,
    c.vendor_name,
    c.title,
    c.value,
    c.end_date,
    c.owner,
    c.department,
    DATEDIFF(c.end_date, CURDATE()) AS days_until_expiration
FROM contracts c
WHERE c.status = 'Active'
    AND c.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
ORDER BY c.end_date ASC;
*/

-- Get contract with all business owners
/*
SELECT
    c.id,
    c.vendor_name,
    c.title,
    c.status,
    c.value,
    GROUP_CONCAT(cbo.user_name ORDER BY cbo.user_name SEPARATOR ', ') AS business_owners
FROM contracts c
LEFT JOIN contract_business_owners cbo ON c.id = cbo.contract_id
WHERE c.id = 'CON-001'
GROUP BY c.id, c.vendor_name, c.title, c.status, c.value;
*/

-- Get total contract value by department
/*
SELECT
    c.department,
    COUNT(*) AS contract_count,
    SUM(c.value) AS total_value,
    AVG(c.value) AS avg_value
FROM contracts c
WHERE c.status = 'Active'
GROUP BY c.department
ORDER BY total_value DESC;
*/

-- Get contracts requiring renewal notice in next 30 days
/*
SELECT
    c.id,
    c.vendor_name,
    c.title,
    c.end_date,
    c.notice_period_days,
    DATE_SUB(c.end_date, INTERVAL c.notice_period_days DAY) AS notice_deadline,
    DATEDIFF(DATE_SUB(c.end_date, INTERVAL c.notice_period_days DAY), CURDATE()) AS days_until_notice_deadline
FROM contracts c
WHERE c.status = 'Active'
    AND c.auto_renew = FALSE
    AND DATE_SUB(c.end_date, INTERVAL c.notice_period_days DAY)
        BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY notice_deadline ASC;
*/

-- Get all contracts for a specific vendor with stakeholders
/*
SELECT
    c.id,
    c.title,
    c.type,
    c.status,
    c.value,
    c.start_date,
    c.end_date,
    c.owner,
    GROUP_CONCAT(DISTINCT cbo.user_name ORDER BY cbo.user_name SEPARATOR ', ') AS business_owners,
    GROUP_CONCAT(DISTINCT cii.user_name ORDER BY cii.user_name SEPARATOR ', ') AS individuals_involved
FROM contracts c
LEFT JOIN contract_business_owners cbo ON c.id = cbo.contract_id
LEFT JOIN contract_individuals_involved cii ON c.id = cii.contract_id
WHERE c.vendor_id = 'VEN-001'
GROUP BY c.id, c.title, c.type, c.status, c.value, c.start_date, c.end_date, c.owner
ORDER BY c.start_date DESC;
*/
