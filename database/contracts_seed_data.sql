-- ============================================================================
-- Contracts Seed Data
-- ============================================================================
-- Sample data migration from the application mock data to MariaDB
-- This script demonstrates the data transformation from TypeScript objects
-- to relational database records
-- ============================================================================

-- Clear existing data (use with caution in production)
-- DELETE FROM contract_individuals_involved;
-- DELETE FROM contract_business_owners;
-- DELETE FROM contracts;

-- ============================================================================
-- Contracts
-- ============================================================================

INSERT INTO contracts (
    id, vendor_id, vendor_name, title, type, status,
    value, start_date, end_date, owner, department,
    description, auto_renew, notice_period_days, evergreen,
    sharepoint_link, vendor_communications_direct, has_ai_features,
    budget_manager, vendor_signatory, company_signatory,
    created_on, created_by, modified_on, modified_by
) VALUES
-- CON-001: Accenture Digital Transformation MSA
(
    'CON-001',
    'VEN-001',
    'Accenture',
    'Digital Transformation Consulting MSA',
    'Master Service Agreement',
    'Active',
    2400000.00,
    '2023-01-01',
    '2025-12-31',
    'Emily Carter',
    'Technology',
    'Master agreement covering all consulting and implementation services for the enterprise digital transformation program.',
    FALSE,
    90,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-001',
    FALSE,
    FALSE,
    'Alan Foster',
    'Sarah Mitchell',
    'Emily Carter',
    '2022-12-01 09:00:00',
    'Emily Carter',
    '2024-12-15 14:30:00',
    'Emily Carter'
),

-- CON-002: Accenture Q1 2024 SOW
(
    'CON-002',
    'VEN-001',
    'Accenture',
    'Q1 2024 Cloud Migration SOW',
    'Statement of Work',
    'Active',
    450000.00,
    '2024-01-01',
    '2024-03-31',
    'Emily Carter',
    'Technology',
    'Statement of Work for Q1 2024 cloud infrastructure migration activities under the master agreement.',
    FALSE,
    30,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-002',
    FALSE,
    FALSE,
    'Alan Foster',
    'Sarah Mitchell',
    'Emily Carter',
    '2023-12-10 11:00:00',
    'Emily Carter',
    '2024-01-05 09:15:00',
    'Kevin Patel'
),

-- CON-003: Microsoft Enterprise Agreement
(
    'CON-003',
    'VEN-002',
    'Microsoft',
    'Microsoft 365 Enterprise Agreement',
    'Master Service Agreement',
    'Active',
    1800000.00,
    '2024-01-01',
    '2026-12-31',
    'Kevin Patel',
    'Technology',
    'Enterprise licensing agreement for Microsoft 365, Azure, and related cloud services.',
    TRUE,
    90,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-003',
    TRUE,
    TRUE,
    'Alan Foster',
    'James Hopper',
    'Kevin Patel',
    '2023-11-15 10:00:00',
    'Kevin Patel',
    '2025-01-20 16:45:00',
    'Emily Carter'
),

-- CON-004: Salesforce CRM License Agreement
(
    'CON-004',
    'VEN-003',
    'Salesforce',
    'Salesforce CRM License Agreement',
    'Master Service Agreement',
    'Active',
    850000.00,
    '2023-01-01',
    '2025-12-31',
    'Rachel Kim',
    'Sales',
    'Annual subscription for Salesforce Sales Cloud, Marketing Cloud, and Einstein AI features.',
    TRUE,
    60,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-004',
    FALSE,
    TRUE,
    'Alan Foster',
    'Linda Torres',
    'Rachel Kim',
    '2022-11-20 13:30:00',
    'Rachel Kim',
    '2024-12-01 10:20:00',
    'Rachel Kim'
),

-- CON-005: JLL Facilities Management Agreement
(
    'CON-005',
    'VEN-004',
    'JLL',
    'Corporate Facilities Management Agreement',
    'Master Service Agreement',
    'Active',
    1200000.00,
    '2023-07-01',
    '2026-06-30',
    'Donna Harris',
    'Facilities',
    'Comprehensive facilities management services for all corporate offices including maintenance, security, and janitorial services.',
    FALSE,
    180,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-005',
    FALSE,
    FALSE,
    'Alan Foster',
    'Robert Kane',
    'Donna Harris',
    '2023-05-10 14:00:00',
    'Donna Harris',
    '2024-10-11 11:30:00',
    'Marcus Johnson'
),

-- CON-006: Deloitte Audit Services Agreement
(
    'CON-006',
    'VEN-005',
    'Deloitte',
    'Annual External Audit Services',
    'Master Service Agreement',
    'Active',
    350000.00,
    '2024-01-01',
    '2024-12-31',
    'Alan Foster',
    'Finance',
    'Annual financial audit and SOX compliance attestation services.',
    TRUE,
    90,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-006',
    FALSE,
    FALSE,
    'Alan Foster',
    'Angela Brooks',
    'Alan Foster',
    '2023-10-15 09:00:00',
    'Alan Foster',
    '2025-02-01 15:00:00',
    'Sarah Okonkwo'
),

-- CON-007: AWS Cloud Services Agreement
(
    'CON-007',
    'VEN-006',
    'Amazon Web Services',
    'AWS Enterprise Support Agreement',
    'Master Service Agreement',
    'Active',
    2200000.00,
    '2023-01-01',
    '2025-12-31',
    'Kevin Patel',
    'Technology',
    'Cloud infrastructure services with enterprise support including compute, storage, database, and AI/ML services.',
    FALSE,
    90,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-007',
    FALSE,
    TRUE,
    'Alan Foster',
    'Kevin Zhao',
    'Kevin Patel',
    '2022-11-01 10:30:00',
    'Kevin Patel',
    '2024-11-28 14:15:00',
    'Emily Carter'
),

-- CON-008: Workday NDA
(
    'CON-008',
    'VEN-007',
    'Workday',
    'Mutual Non-Disclosure Agreement',
    'NDA',
    'Active',
    0.00,
    '2024-02-01',
    '2027-01-31',
    'Thomas Ward',
    'Legal',
    'Mutual NDA for evaluation of Workday HR and Finance modules.',
    FALSE,
    30,
    FALSE,
    'https://company.sharepoint.com/sites/contracts/CON-008',
    FALSE,
    FALSE,
    NULL,
    'Patricia Collins',
    'Thomas Ward',
    '2024-01-15 11:00:00',
    'Thomas Ward',
    '2024-02-10 09:30:00',
    'Thomas Ward'
);

-- ============================================================================
-- Contract Business Owners
-- ============================================================================

INSERT INTO contract_business_owners (
    contract_id, user_id, user_name, user_initials, user_department, created_on, created_by
) VALUES
-- CON-001 Business Owners
('CON-001', 'USR-001', 'Emily Carter', 'EC', 'Technology', '2022-12-01 09:00:00', 'Emily Carter'),
('CON-001', 'USR-002', 'Marcus Johnson', 'MJ', 'Operations', '2022-12-01 09:00:00', 'Emily Carter'),

-- CON-002 Business Owners
('CON-002', 'USR-001', 'Emily Carter', 'EC', 'Technology', '2023-12-10 11:00:00', 'Emily Carter'),

-- CON-003 Business Owners
('CON-003', 'USR-006', 'Kevin Patel', 'KP', 'Technology', '2023-11-15 10:00:00', 'Kevin Patel'),
('CON-003', 'USR-001', 'Emily Carter', 'EC', 'Technology', '2023-11-15 10:00:00', 'Kevin Patel'),

-- CON-004 Business Owners
('CON-004', 'USR-003', 'Rachel Kim', 'RK', 'Sales', '2022-11-20 13:30:00', 'Rachel Kim'),
('CON-004', 'USR-010', 'Jennifer Walsh', 'JW', 'Marketing', '2022-11-20 13:30:00', 'Rachel Kim'),

-- CON-005 Business Owners
('CON-005', 'USR-005', 'Donna Harris', 'DH', 'Facilities', '2023-05-10 14:00:00', 'Donna Harris'),
('CON-005', 'USR-002', 'Marcus Johnson', 'MJ', 'Operations', '2023-05-10 14:00:00', 'Donna Harris'),

-- CON-006 Business Owners
('CON-006', 'USR-004', 'Alan Foster', 'AF', 'Finance', '2023-10-15 09:00:00', 'Alan Foster'),
('CON-006', 'USR-012', 'Sarah Okonkwo', 'SO', 'Compliance', '2023-10-15 09:00:00', 'Alan Foster'),

-- CON-007 Business Owners
('CON-007', 'USR-006', 'Kevin Patel', 'KP', 'Technology', '2022-11-01 10:30:00', 'Kevin Patel'),
('CON-007', 'USR-001', 'Emily Carter', 'EC', 'Technology', '2022-11-01 10:30:00', 'Kevin Patel'),

-- CON-008 Business Owners
('CON-008', 'USR-007', 'Thomas Ward', 'TW', 'Legal', '2024-01-15 11:00:00', 'Thomas Ward'),
('CON-008', 'USR-008', 'Monica Shaw', 'MS', 'HR', '2024-01-15 11:00:00', 'Thomas Ward');

-- ============================================================================
-- Contract Individuals Involved
-- ============================================================================

INSERT INTO contract_individuals_involved (
    contract_id, user_id, user_name, user_initials, user_department, created_on, created_by
) VALUES
-- CON-001 Individuals Involved
('CON-001', 'USR-006', 'Kevin Patel', 'KP', 'Technology', '2022-12-01 09:00:00', 'Emily Carter'),
('CON-001', 'USR-007', 'Thomas Ward', 'TW', 'Legal', '2022-12-01 09:00:00', 'Emily Carter'),

-- CON-002 Individuals Involved
('CON-002', 'USR-006', 'Kevin Patel', 'KP', 'Technology', '2023-12-10 11:00:00', 'Emily Carter'),
('CON-002', 'USR-009', 'Gary Bennett', 'GB', 'Operations', '2023-12-10 11:00:00', 'Emily Carter'),

-- CON-003 Individuals Involved
('CON-003', 'USR-001', 'Emily Carter', 'EC', 'Technology', '2023-11-15 10:00:00', 'Kevin Patel'),

-- CON-004 Individuals Involved
('CON-004', 'USR-010', 'Jennifer Walsh', 'JW', 'Marketing', '2022-11-20 13:30:00', 'Rachel Kim'),

-- CON-005 Individuals Involved
('CON-005', 'USR-002', 'Marcus Johnson', 'MJ', 'Operations', '2023-05-10 14:00:00', 'Donna Harris'),

-- CON-006 Individuals Involved
('CON-006', 'USR-007', 'Thomas Ward', 'TW', 'Legal', '2023-10-15 09:00:00', 'Alan Foster'),
('CON-006', 'USR-012', 'Sarah Okonkwo', 'SO', 'Compliance', '2023-10-15 09:00:00', 'Alan Foster'),

-- CON-007 Individuals Involved
('CON-007', 'USR-001', 'Emily Carter', 'EC', 'Technology', '2022-11-01 10:30:00', 'Kevin Patel'),

-- CON-008 Individuals Involved
('CON-008', 'USR-008', 'Monica Shaw', 'MS', 'HR', '2024-01-15 11:00:00', 'Thomas Ward'),
('CON-008', 'USR-004', 'Alan Foster', 'AF', 'Finance', '2024-01-15 11:00:00', 'Thomas Ward');

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Count records in each table
/*
SELECT 'contracts' AS table_name, COUNT(*) AS record_count FROM contracts
UNION ALL
SELECT 'contract_business_owners', COUNT(*) FROM contract_business_owners
UNION ALL
SELECT 'contract_individuals_involved', COUNT(*) FROM contract_individuals_involved;
*/

-- Verify contract with stakeholders
/*
SELECT
    c.id,
    c.vendor_name,
    c.title,
    c.value,
    GROUP_CONCAT(DISTINCT cbo.user_name ORDER BY cbo.user_name SEPARATOR ', ') AS business_owners,
    GROUP_CONCAT(DISTINCT cii.user_name ORDER BY cii.user_name SEPARATOR ', ') AS individuals_involved
FROM contracts c
LEFT JOIN contract_business_owners cbo ON c.id = cbo.contract_id
LEFT JOIN contract_individuals_involved cii ON c.id = cii.contract_id
GROUP BY c.id, c.vendor_name, c.title, c.value
ORDER BY c.id;
*/

-- Total contract value by status
/*
SELECT
    status,
    COUNT(*) AS contract_count,
    SUM(value) AS total_value,
    AVG(value) AS avg_value
FROM contracts
GROUP BY status
ORDER BY total_value DESC;
*/
