# Contracts Database Schema

> **Note:** This document covers the contracts module in isolation. For the complete multi-module schema including all ERM, compliance, regulatory, and TPRM tables, see [`DATABASE_DESIGN.md`](./DATABASE_DESIGN.md) and [`full_schema.sql`](./full_schema.sql).

## Overview

This database schema supports comprehensive vendor contract management for enterprise procurement and vendor management systems. It tracks all types of contracts including Master Service Agreements (MSAs), Statements of Work (SOWs), Non-Disclosure Agreements (NDAs), amendments, and purchase orders.

## Schema Design

### Main Tables

#### 1. `contracts`
The primary table storing all contract information.

**Key Features:**
- Complete contract lifecycle tracking (Pending → Active → Expired/Terminated)
- Financial management with contract value tracking
- Automatic renewal and notice period management
- Document management integration via SharePoint links
- AI feature tracking for compliance and risk assessment
- Comprehensive audit trail with created/modified timestamps and users

**Important Fields:**
- `auto_renew`: Indicates if contract automatically renews
- `notice_period_days`: Days required for termination notice
- `evergreen`: Permanent contracts with no fixed end date
- `has_ai_features`: Tracks contracts involving AI/ML services
- `vendor_communications_direct`: Controls communication protocols

#### 2. `contract_business_owners`
Junction table linking contracts to business stakeholders with strategic oversight.

**Purpose:** Business owners are responsible for:
- Strategic contract decisions
- Budget approval
- Performance evaluation
- Renewal/termination decisions

#### 3. `contract_individuals_involved`
Junction table linking contracts to operational team members.

**Purpose:** Individuals involved handle:
- Day-to-day contract operations
- Vendor coordination
- Service delivery monitoring
- Issue resolution

## Data Types and Constraints

### Enumerations

**Contract Types:**
- Master Service Agreement
- Statement of Work
- NDA
- Amendment
- Purchase Order

**Contract Statuses:**
- `Pending`: Contract drafted but not yet effective
- `Active`: Currently in force
- `Expired`: Past end date, not renewed
- `Renewal Due`: Approaching end date, renewal decision needed
- `Terminated`: Ended before expiration date

### Financial Fields
- `value`: DECIMAL(15,2) - Supports contracts up to $999,999,999,999.99

### Audit Trail
All tables include:
- `created_on`: Auto-populated on insert
- `created_by`: User who created the record
- `modified_on`: Auto-updated on any change
- `modified_by`: User who last modified the record

## Indexing Strategy

The schema includes indexes optimized for common queries:

1. **Foreign Key Indexes:**
   - `idx_vendor_id`: Fast vendor contract lookups
   
2. **Status and Type Indexes:**
   - `idx_status`: Filter by contract status
   - `idx_type`: Group by contract type
   
3. **Date Indexes:**
   - `idx_end_date`: Critical for expiration tracking and renewal alerts
   
4. **Organizational Indexes:**
   - `idx_department`: Department-level reporting
   
5. **Audit Indexes:**
   - `idx_created_on`: Historical analysis
   - `idx_modified_on`: Recent changes tracking

## Common Use Cases

### 1. Expiration Monitoring
Track contracts expiring in the next 90 days to ensure timely renewals:

```sql
SELECT id, vendor_name, title, end_date,
       DATEDIFF(end_date, CURDATE()) AS days_until_expiration
FROM contracts
WHERE status = 'Active'
  AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
ORDER BY end_date ASC;
```

### 2. Notice Period Tracking
Identify contracts approaching their notice deadline:

```sql
SELECT id, vendor_name, title,
       DATE_SUB(end_date, INTERVAL notice_period_days DAY) AS notice_deadline
FROM contracts
WHERE status = 'Active'
  AND auto_renew = FALSE
  AND DATE_SUB(end_date, INTERVAL notice_period_days DAY)
      BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY);
```

### 3. Financial Reporting
Analyze contract spending by department:

```sql
SELECT department,
       COUNT(*) AS contract_count,
       SUM(value) AS total_value,
       AVG(value) AS avg_value
FROM contracts
WHERE status = 'Active'
GROUP BY department
ORDER BY total_value DESC;
```

### 4. Stakeholder Management
Get complete contract information with all stakeholders:

```sql
SELECT c.*,
       GROUP_CONCAT(DISTINCT bo.user_name) AS business_owners,
       GROUP_CONCAT(DISTINCT ii.user_name) AS individuals_involved
FROM contracts c
LEFT JOIN contract_business_owners bo ON c.id = bo.contract_id
LEFT JOIN contract_individuals_involved ii ON c.id = ii.contract_id
WHERE c.id = 'CON-001'
GROUP BY c.id;
```

### 5. AI Feature Compliance
Track all contracts with AI capabilities for regulatory compliance:

```sql
SELECT id, vendor_name, title, type, department
FROM contracts
WHERE has_ai_features = TRUE
  AND status IN ('Active', 'Renewal Due')
ORDER BY department, vendor_name;
```

## Data Denormalization

The schema uses strategic denormalization for performance:

1. **vendor_name in contracts table**
   - Avoids joins for common queries
   - Accepts potential inconsistency if vendor renamed
   - Update via trigger or application logic when vendor changes

2. **User information in junction tables**
   - `user_name`, `user_initials`, `user_department` stored directly
   - Provides historical accuracy if user changes departments
   - Improves query performance for stakeholder lists

## Migration Considerations

### From Application State
When migrating from the current TypeScript/React application:

1. **AppUser objects** → Extract `id`, `name`, `initials`, `department`
2. **Date formats** → Convert 'YYYY-MM-DD' strings to DATE type
3. **Boolean fields** → Map JavaScript booleans to MySQL BOOLEAN (TINYINT(1))
4. **Arrays** → Split into junction table records:
   - `businessOwners[]` → `contract_business_owners` records
   - `individualsInvolved[]` → `contract_individuals_involved` records

### Sample Insert

```sql
-- Insert main contract
INSERT INTO contracts (
    id, vendor_id, vendor_name, title, type, status,
    value, start_date, end_date, owner, department,
    description, auto_renew, notice_period_days,
    created_by, modified_by
) VALUES (
    'CON-001', 'VEN-001', 'Accenture',
    'Digital Transformation Consulting MSA',
    'Master Service Agreement', 'Active',
    2400000.00, '2023-01-01', '2025-12-31',
    'Emily Carter', 'Technology',
    'Master agreement covering all consulting services',
    FALSE, 90,
    'Emily Carter', 'Emily Carter'
);

-- Insert business owners
INSERT INTO contract_business_owners (
    contract_id, user_id, user_name, user_initials,
    user_department, created_by
) VALUES
    ('CON-001', 'USR-001', 'Emily Carter', 'EC', 'Technology', 'Emily Carter'),
    ('CON-001', 'USR-002', 'Marcus Johnson', 'MJ', 'Operations', 'Emily Carter');

-- Insert individuals involved
INSERT INTO contract_individuals_involved (
    contract_id, user_id, user_name, user_initials,
    user_department, created_by
) VALUES
    ('CON-001', 'USR-006', 'Kevin Patel', 'KP', 'Technology', 'Emily Carter'),
    ('CON-001', 'USR-007', 'Thomas Ward', 'TW', 'Legal', 'Emily Carter');
```

## Maintenance

### Regular Tasks

1. **Update Renewal Status**
   ```sql
   UPDATE contracts
   SET status = 'Renewal Due'
   WHERE status = 'Active'
     AND end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
     AND auto_renew = FALSE;
   ```

2. **Mark Expired Contracts**
   ```sql
   UPDATE contracts
   SET status = 'Expired',
       modified_on = CURRENT_TIMESTAMP,
       modified_by = 'SYSTEM_CRON'
   WHERE status = 'Active'
     AND end_date < CURDATE()
     AND auto_renew = FALSE;
   ```

3. **Archive Old Terminated Contracts**
   - Move to archive table after 7 years (adjust per retention policy)
   - Maintain audit trail

### Performance Optimization

1. **Partition by Year** (for large datasets):
   ```sql
   ALTER TABLE contracts
   PARTITION BY RANGE (YEAR(created_on)) (
       PARTITION p2023 VALUES LESS THAN (2024),
       PARTITION p2024 VALUES LESS THAN (2025),
       PARTITION p2025 VALUES LESS THAN (2026),
       PARTITION p_future VALUES LESS THAN MAXVALUE
   );
   ```

2. **Archive Historical Data**:
   - Move contracts older than 7 years to `contracts_archive` table
   - Keep indexes and structure identical
   - Update queries to UNION both tables when historical view needed

## Security Considerations

1. **Column-Level Encryption**: Consider encrypting sensitive fields:
   - `sharepoint_link`
   - `vendor_signatory`
   - `company_signatory`

2. **Row-Level Security**: Implement views per department:
   ```sql
   CREATE VIEW contracts_technology AS
   SELECT * FROM contracts
   WHERE department = 'Technology';
   ```

3. **Audit Logging**: Consider triggers for detailed change tracking:
   ```sql
   CREATE TRIGGER contracts_audit_update
   AFTER UPDATE ON contracts
   FOR EACH ROW
   INSERT INTO audit_log (table_name, record_id, action, changed_by, changed_on)
   VALUES ('contracts', NEW.id, 'UPDATE', NEW.modified_by, CURRENT_TIMESTAMP);
   ```

## Foreign Key Relationships

While not enforced in the CREATE statements above (to allow flexibility), consider adding foreign keys if referential integrity is critical:

```sql
ALTER TABLE contract_business_owners
ADD CONSTRAINT fk_cbo_contract
FOREIGN KEY (contract_id) REFERENCES contracts(id)
ON DELETE CASCADE;

ALTER TABLE contract_individuals_involved
ADD CONSTRAINT fk_cii_contract
FOREIGN KEY (contract_id) REFERENCES contracts(id)
ON DELETE CASCADE;
```

**Note**: CASCADE deletes ensure junction table records are removed when parent contract is deleted.
