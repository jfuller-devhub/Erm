# Regulatory Compliance Tracking Feature Plan

## Executive Summary

A comprehensive regulatory compliance tracking system to monitor regulations across their lifecycle—from proposed legislation under consideration through implementation and ongoing compliance. This feature will integrate with existing Controls, Risks, and Processes to provide end-to-end regulatory compliance management.

---

## Feature Overview

### Purpose
Enable the organization to:
- Track proposed, in-process, and active regulations
- Monitor regulatory changes and deadlines
- Assign ownership and accountability for compliance
- Link regulations to implementing controls
- Maintain audit trail with documents and commentary
- Assess compliance readiness and gaps

### User Personas
- **Compliance Officers**: Primary owners, track regulatory landscape
- **Risk Managers**: Assess regulatory risk exposure
- **Control Owners**: Implement controls to meet requirements
- **Legal Team**: Review and interpret legislation
- **Executives**: Dashboard view of compliance status

---

## Data Model

### 1. Regulation Entity

```typescript
interface Regulation {
  // Core Identity
  id: string;                        // e.g., "REG-001"
  regulationNumber: string;          // Official number (e.g., "HR-1234", "EU-GDPR-2016/679")
  title: string;
  description: string;
  
  // Classification
  regulatoryBody: string;            // e.g., "SEC", "EU Parliament", "FINRA", "FDA"
  jurisdiction: string;              // e.g., "Federal - USA", "EU", "California"
  category: RegulationCategory;      // From config (Financial, Privacy, Safety, etc.)
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  
  // Status & Lifecycle
  status: RegulationStatus;
  stage: RegulationStage;            // More granular than status
  
  // Dates
  proposedDate: string | null;       // When first proposed
  publicationDate: string | null;    // Official publication
  effectiveDate: string | null;      // When it becomes enforceable
  complianceDeadline: string | null; // Internal deadline for compliance
  reviewDate: string | null;         // Next review date
  
  // Ownership & Assignment
  primaryOwner: AppUser | null;      // Compliance officer
  stakeholders: AppUser[];           // Cross-functional team
  department: string;
  
  // Relationships
  relatedBills: string[];            // Bill IDs
  linkedControlIds: string[];        // CTL-xxx
  linkedRiskIds: string[];           // RSK-xxx
  linkedProcessIds: string[];        // PRC-xxx
  supersedes: string | null;         // Previous regulation ID
  supersededBy: string | null;       // Newer regulation ID
  
  // Compliance Tracking
  complianceStatus: ComplianceStatus;
  gapAnalysisCompleted: boolean;
  readinessScore: number;            // 0-100
  estimatedCost: number | null;
  
  // Documents & References
  officialUrl: string | null;
  attachmentIds: string[];           // Document IDs
  
  // Metadata
  tags: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

type RegulationStatus = 
  | 'monitoring'        // Under consideration, proposed
  | 'in-review'         // Being analyzed
  | 'in-progress'       // Implementation underway
  | 'compliant'         // Fully compliant
  | 'non-compliant'     // Gap identified
  | 'not-applicable'    // Determined not applicable
  | 'archived';         // No longer relevant

type RegulationStage = 
  | 'proposed'          // Bill proposed
  | 'committee'         // In legislative committee
  | 'passed'            // Passed but not effective
  | 'effective'         // Currently in force
  | 'amended'           // Under amendment
  | 'repealed';         // No longer in force

type ComplianceStatus = 
  | 'not-started'
  | 'assessment'        // Gap analysis underway
  | 'planning'          // Compliance plan created
  | 'implementing'      // Controls being implemented
  | 'testing'           // Testing compliance
  | 'compliant'         // Fully compliant
  | 'partial'           // Partially compliant
  | 'non-compliant';    // Not compliant

interface RegulationCategory {
  id: string;
  name: string;
  description: string;
  colorHex: string;
}
```

### 2. Bill/Legislation Entity

```typescript
interface Bill {
  id: string;                        // e.g., "BILL-001"
  billNumber: string;                // e.g., "H.R. 1234", "S.B. 567"
  title: string;
  summary: string;
  
  // Metadata
  legislature: string;               // e.g., "117th Congress", "California State Assembly"
  sponsor: string;                   // Primary sponsor name
  introducedDate: string;
  
  // Status
  status: BillStatus;
  currentCommittee: string | null;
  
  // Relationship
  regulationId: string | null;       // Parent regulation if passed
  relatedRegulationIds: string[];    // Other related regs
  
  // Tracking
  amendments: BillAmendment[];
  votes: BillVote[];
  officialUrl: string | null;
  attachmentIds: string[];
  
  // Internal tracking
  assignedTo: AppUser | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  internalNotes: string;
  
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

type BillStatus = 
  | 'introduced'
  | 'in-committee'
  | 'committee-passed'
  | 'floor-debate'
  | 'passed-chamber'
  | 'other-chamber'
  | 'conference'
  | 'passed-both'
  | 'signed'
  | 'vetoed'
  | 'failed';

interface BillAmendment {
  id: string;
  amendmentNumber: string;
  description: string;
  proposedDate: string;
  status: 'proposed' | 'adopted' | 'rejected';
  impact: string;                    // Impact description
}

interface BillVote {
  id: string;
  chamber: string;                   // "House", "Senate"
  voteDate: string;
  result: 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
  votesAbstained: number;
}
```

### 3. Regulation Comment/Note Entity

```typescript
interface RegulationComment {
  id: string;
  regulationId: string;
  
  // Content
  commentText: string;
  commentType: 'note' | 'analysis' | 'decision' | 'update' | 'risk-identified';
  
  // Attribution
  author: AppUser;
  createdAt: string;
  updatedAt: string | null;
  
  // Threading
  parentCommentId: string | null;    // For replies
  
  // Mentions & Tags
  mentions: AppUser[];               // @mentioned users
  tags: string[];
  
  // Attachments
  attachmentIds: string[];
  
  // Visibility
  isInternal: boolean;               // vs. public/shared externally
}
```

### 4. Regulation Document Entity

```typescript
interface RegulationDocument {
  id: string;
  regulationId: string | null;       // Or billId
  billId: string | null;
  
  // File metadata
  fileName: string;
  fileSize: number;                  // bytes
  fileType: string;                  // MIME type
  fileUrl: string;                   // Storage URL or base64
  
  // Document details
  documentType: DocumentType;
  version: string;
  description: string;
  officialDocument: boolean;         // Official vs. internal
  
  // Dates
  documentDate: string;              // Date of the document itself
  uploadedAt: string;
  uploadedBy: AppUser;
  
  // Metadata
  tags: string[];
  language: string;                  // "en", "es", etc.
}

type DocumentType = 
  | 'legislation-text'
  | 'amendment'
  | 'impact-assessment'
  | 'legal-opinion'
  | 'implementation-guide'
  | 'gap-analysis'
  | 'compliance-report'
  | 'correspondence'
  | 'other';
```

### 5. Regulation-Control Mapping

```typescript
interface RegulationControlMapping {
  regulationId: string;
  controlId: string;
  
  // Mapping details
  requirementText: string;           // Specific requirement being addressed
  coverageLevel: 'full' | 'partial' | 'none';
  isPrimary: boolean;                // Primary control for this requirement
  
  // Status
  implementationStatus: 'not-started' | 'in-progress' | 'implemented' | 'tested' | 'verified';
  evidenceProvided: boolean;
  
  // Notes
  mappingNotes: string;
  gapDescription: string | null;
  
  // Metadata
  createdAt: string;
  createdBy: AppUser | null;
}
```

---

## UI Components & Pages

### 1. Regulation Register (List View)

**Route**: `/regulations`

**Layout**: Grid/Table with filters and search

**Features**:
- Filter by status, regulatory body, jurisdiction, category, impact level
- Search by regulation number, title, keywords
- Sort by effective date, compliance deadline, priority
- Bulk actions (assign owner, change status, export)
- Quick stats tiles (Total Active, Upcoming Deadlines, Non-Compliant, Monitoring)

**Columns**:
- Regulation ID + Number
- Title
- Regulatory Body
- Status badge
- Compliance Status badge
- Effective Date
- Compliance Deadline (red if overdue)
- Owner
- Linked Controls count
- Actions (view, edit, delete)

### 2. Regulation Detail Page

**Route**: `/regulations/:id`

**Tabs**:

#### **Overview Tab**
- Regulation summary header (ID, number, title, status badges)
- Description card
- Classification card (regulatory body, jurisdiction, category, impact)
- Dates card (proposed, publication, effective, compliance deadline)
- Ownership card (primary owner, stakeholders, department)
- Compliance tracking card (status, readiness score, gap analysis, estimated cost)
- Audit trail card

#### **Requirements Tab**
- List of specific regulatory requirements (text entries)
- Each requirement can be linked to controls
- Coverage assessment (which requirements are covered, gaps)
- Requirement detail: text, applicable sections, linked controls

#### **Controls Tab**
- Grid of linked controls
- Coverage level indicator (full/partial/none)
- Implementation status
- Evidence tracking
- Add control mapping button
- Gap analysis view

#### **Bills & Legislation Tab**
- Related bills list
- Bill timeline (introduced → committee → passed → signed)
- Amendments tracking
- Voting history
- Link to new bill button

#### **Documents Tab**
- Document grid/list
- Upload document button
- Document preview/download
- Version history
- Document metadata (type, date, official flag)
- Organize by type

#### **Activity & Comments Tab**
- Timeline of all comments and updates
- Threaded discussions
- Add comment box with rich text
- Comment types (note, analysis, decision, update, risk)
- @mentions support
- Filter by comment type, author, date range

#### **Related Items Tab**
- Linked risks
- Linked processes
- Related regulations (supersedes, related topics)
- Impact on other regulations

### 3. Bill Tracker

**Route**: `/regulations/bills`

**Features**:
- List of all bills being monitored
- Status pipeline view (visual stages)
- Filter by status, legislature, priority
- Link to parent regulation
- Quick add bill from template

**Bill Detail View** (`/regulations/bills/:id`):
- Bill overview (number, title, sponsor, dates)
- Status timeline
- Amendments list
- Votes history
- Related regulations
- Documents (full text, amendments, committee reports)
- Internal analysis/notes
- Assignment and priority

### 4. Compliance Dashboard

**Route**: `/compliance-dashboard`

**Widgets**:
- **Compliance Overview KPIs**
  - Total Regulations Tracked
  - Compliant / Non-Compliant ratio
  - Upcoming Deadlines (next 30/60/90 days)
  - Bills Monitoring
  
- **Compliance Status Breakdown** (Pie/Donut chart)
  - By compliance status
  
- **Regulatory Calendar**
  - Effective dates
  - Compliance deadlines
  - Review dates
  
- **High Priority Regulations** (Table)
  - Critical/High impact items
  - Status and deadline
  - Owner
  
- **Gap Analysis Summary**
  - Regulations with gaps
  - Controls needed
  - Estimated cost
  
- **Recent Regulatory Activity** (Timeline)
  - New regulations added
  - Status changes
  - Deadlines approaching
  - Bills updated

### 5. Forms & Modals

#### **Regulation Form Modal**
- All regulation fields in organized sections
- Dropdowns sourced from configuration
- Owner/stakeholder picker
- Date pickers for all date fields
- Tags input
- Save as draft vs. publish

#### **Bill Form Modal**
- Bill metadata
- Status selection
- Link to regulation
- Priority and assignment
- Official URL

#### **Link Control Modal**
- Search/select existing control
- Requirement text input
- Coverage level radio buttons
- Implementation status
- Evidence checkbox
- Mapping notes textarea

#### **Upload Document Modal**
- File upload (drag & drop)
- Document type dropdown
- Version input
- Description textarea
- Official document checkbox
- Tags input

#### **Add Comment Modal**
- Comment type selection
- Rich text editor
- @mention autocomplete
- Attach files option
- Mark as internal checkbox

---

## Data Files & Storage

### localStorage Keys
- `erm_regulations_v1` - Regulation[]
- `erm_bills_v1` - Bill[]
- `erm_regulation_comments_v1` - RegulationComment[]
- `erm_regulation_documents_v1` - RegulationDocument[]
- `erm_regulation_controls_v1` - RegulationControlMapping[]
- `erm_regulation_categories_v1` - RegulationCategory[]

### File Structure
```
/src/app/data/
  regulationData.ts              # Regulation entity, CRUD, helpers
  billData.ts                    # Bill entity, CRUD, helpers
  regulationCommentData.ts       # Comments, CRUD
  regulationDocumentData.ts      # Documents, storage helpers
  regulationControlData.ts       # Reg-Control mappings
  regulationCategoryData.ts      # Categories config

/src/app/pages/
  RegulationRegister.tsx         # Main list view
  RegulationDetail.tsx           # Detail with tabs
  BillTracker.tsx                # Bills list
  BillDetail.tsx                 # Bill detail
  ComplianceDashboard.tsx        # Dashboard

/src/app/components/regulations/
  RegulationFormModal.tsx
  RegulationOverviewTab.tsx
  RegulationRequirementsTab.tsx
  RegulationControlsTab.tsx
  RegulationBillsTab.tsx
  RegulationDocumentsTab.tsx
  RegulationActivityTab.tsx
  RegulationRelatedTab.tsx
  
/src/app/components/bills/
  BillFormModal.tsx
  BillCard.tsx
  BillTimeline.tsx
  BillAmendmentsList.tsx
  
/src/app/components/compliance/
  ComplianceKPITiles.tsx
  ComplianceCalendar.tsx
  ComplianceStatusChart.tsx
  GapAnalysisSummary.tsx
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create data models and TypeScript interfaces
- [ ] Set up localStorage structure with seed data
- [ ] Create CRUD helper functions
- [ ] Build Regulation Register list page
- [ ] Build Regulation Form Modal
- [ ] Implement basic search and filtering

### Phase 2: Core Detail Views (Week 3-4)
- [ ] Build Regulation Detail page structure
- [ ] Implement Overview Tab
- [ ] Implement Controls Tab with linking
- [ ] Create Control mapping modal
- [ ] Integrate with existing Control data

### Phase 3: Bills & Legislation (Week 5)
- [ ] Build Bill data model and storage
- [ ] Create Bill Tracker list page
- [ ] Build Bill Detail page
- [ ] Create Bill Form Modal
- [ ] Implement bill-regulation linking

### Phase 4: Documents & Comments (Week 6)
- [ ] Build document upload/storage system
- [ ] Create Documents Tab with grid view
- [ ] Implement document metadata
- [ ] Build Activity/Comments Tab
- [ ] Create threaded comment system
- [ ] Implement @mentions

### Phase 5: Requirements & Gap Analysis (Week 7)
- [ ] Build Requirements Tab
- [ ] Create requirement entry/editing
- [ ] Implement requirement-control mapping
- [ ] Build gap analysis view
- [ ] Create coverage assessment logic

### Phase 6: Dashboard & Reporting (Week 8)
- [ ] Build Compliance Dashboard
- [ ] Create KPI tiles
- [ ] Implement regulatory calendar
- [ ] Build status charts
- [ ] Create gap analysis summary widget

### Phase 7: Integration & Polish (Week 9)
- [ ] Integrate with Risk Register (link risks to regulations)
- [ ] Integrate with Process Register
- [ ] Add regulation references to Control detail
- [ ] Create cross-navigation links
- [ ] Implement notification system for deadlines

### Phase 8: Advanced Features (Week 10+)
- [ ] Impact assessment workflow
- [ ] Compliance readiness scoring algorithm
- [ ] Document versioning system
- [ ] Export compliance reports
- [ ] Bulk import regulations from CSV
- [ ] Email notifications for deadlines

---

## Configuration Options

Add to `INITIAL_CONFIG_OPTIONS` in mockData.ts:

```typescript
regulatoryBodies: [
  'SEC - Securities and Exchange Commission',
  'FINRA - Financial Industry Regulatory Authority',
  'FDA - Food and Drug Administration',
  'EPA - Environmental Protection Agency',
  'OSHA - Occupational Safety and Health Administration',
  'FTC - Federal Trade Commission',
  'CFPB - Consumer Financial Protection Bureau',
  'EU Parliament',
  'FCA - UK Financial Conduct Authority',
  'GDPR - EU Data Protection',
  'CCPA - California Consumer Privacy Act',
  'SOX - Sarbanes-Oxley',
  'HIPAA - Health Insurance Portability',
  'PCI DSS - Payment Card Industry',
  'ISO/IEC Standards Body',
  'NIST - National Institute of Standards',
  'Internal Policy',
],

jurisdictions: [
  'Federal - USA',
  'European Union',
  'United Kingdom',
  'California',
  'New York',
  'Texas',
  'Delaware',
  'International',
  'Multi-jurisdictional',
  'State - Other',
  'Municipal',
],

regulationCategories: [
  { name: 'Financial Reporting', colorHex: '#1C8A45' },
  { name: 'Data Privacy', colorHex: '#2322F0' },
  { name: 'Securities', colorHex: '#E07B00' },
  { name: 'Environmental', colorHex: '#00A3A3' },
  { name: 'Health & Safety', colorHex: '#C0392B' },
  { name: 'Labor & Employment', colorHex: '#6B3FA0' },
  { name: 'Consumer Protection', colorHex: '#D81B60' },
  { name: 'Anti-Money Laundering', colorHex: '#004D40' },
  { name: 'Cybersecurity', colorHex: '#BF360C' },
  { name: 'Industry-Specific', colorHex: '#1A237E' },
],

documentTypes: [
  'Legislation Text',
  'Amendment',
  'Impact Assessment',
  'Legal Opinion',
  'Implementation Guide',
  'Gap Analysis',
  'Compliance Report',
  'Evidence Documentation',
  'Correspondence',
  'Committee Report',
  'Regulatory Notice',
  'Other',
],

billStatuses: [
  'Introduced',
  'In Committee',
  'Committee Passed',
  'Floor Debate',
  'Passed One Chamber',
  'In Other Chamber',
  'Conference Committee',
  'Passed Both Chambers',
  'Signed into Law',
  'Vetoed',
  'Failed',
],
```

---

## Integration Points

### 1. Controls
- Link regulations to implementing controls
- Show regulation requirements on Control detail page
- Filter controls by regulation
- Track which controls satisfy which regulations

### 2. Risks
- Link regulations to compliance risks
- Create regulatory change risks automatically
- Show regulatory exposure on Risk detail page

### 3. Processes
- Link regulations to affected processes
- Show process compliance requirements
- Track process changes driven by regulations

### 4. Vendors
- Track vendor compliance with regulations
- Show vendor regulatory obligations
- Monitor third-party regulatory risk

### 5. AppShell Navigation
Add to main navigation:
```
Compliance
  ├── Regulations
  ├── Bills & Legislation
  └── Compliance Dashboard
```

---

## Key User Workflows

### Workflow 1: New Regulation Proposed
1. Compliance officer creates new regulation record (status: monitoring)
2. Adds bill tracking if applicable
3. Assigns stakeholders for review
4. Uploads official text document
5. Team adds comments with initial analysis
6. Links to potentially affected processes and risks

### Workflow 2: Regulation Becomes Effective
1. Update status from "in-review" to "in-progress"
2. Set effective date and compliance deadline
3. Conduct gap analysis (Requirements tab)
4. Identify needed controls
5. Link existing controls or create new ones
6. Assign implementation owners
7. Track implementation progress
8. Update to "compliant" when complete

### Workflow 3: Gap Identified
1. Review regulation requirements
2. Identify specific gaps in coverage
3. Create new controls or update existing
4. Document gap in mapping notes
5. Create action plan with timeline
6. Assign remediation owner
7. Track progress to closure
8. Update compliance status

### Workflow 4: Bill Monitoring
1. Add bill to tracker when introduced
2. Update status as it progresses through legislature
3. Add amendments as they occur
4. When passed, create regulation record
5. Link bill to regulation
6. Archive bill when complete

---

## Success Metrics

- **Coverage**: % of regulations with linked controls
- **Timeliness**: % of deadlines met
- **Compliance Rate**: % of regulations marked compliant
- **Gap Closure Time**: Average time to close identified gaps
- **Documentation**: % of regulations with official documents attached
- **Engagement**: Number of comments/updates per regulation
- **Readiness**: Average readiness score across active regulations

---

## Future Enhancements

1. **AI-Powered Analysis**
   - Auto-summarize regulation text
   - Suggest related controls
   - Predict impact based on similar regulations

2. **Regulatory Intelligence Feed**
   - RSS/API integration with regulatory bodies
   - Auto-import new regulations
   - Change detection for existing regulations

3. **Workflow Automation**
   - Approval workflows for compliance sign-off
   - Automated reminders for deadlines
   - Escalation rules for overdue items

4. **Advanced Reporting**
   - Compliance scorecards
   - Board-level executive summary
   - Regulatory change impact reports
   - Audit-ready compliance evidence packages

5. **Collaboration Features**
   - Task assignment from regulations
   - Approval chains for compliance sign-off
   - External stakeholder portal

6. **Mobile App**
   - Push notifications for regulatory updates
   - Quick-add comments on the go
   - Document scanning/upload

---

## Design System Compliance

All UI components will use:
- **CSS Variables**: `--font-family-primary`, `--primary`, `--destructive`, `--muted-foreground`, `--border`, `--radius-button`, `--radius-card`, `--text-base`, etc.
- **Appian Patterns**: Labels above fields, red asterisk for required, radio buttons for 2 options, dropdowns for 3+, destructive buttons for delete with confirmation
- **Spacing**: 8px base grid (4px, 8px, 16px, 24px, 32px, 48px)
- **Typography**: Source Sans Pro / Open Sans via `--font-family-primary`
- **Status Badges**: Pill-shaped, 22px height, semantic colors
- **Tabs**: 40px height, 2px bottom border for active state
- **Cards**: White background, 1px border, 8px radius, 16-24px padding

---

## Risk Considerations

**Data Volume**: Many regulations × many documents could create storage issues
- **Mitigation**: Implement pagination, lazy loading, document size limits

**Document Storage**: Base64 encoding large files in localStorage may hit limits
- **Mitigation**: External storage service (S3, Azure Blob) or chunked storage strategy

**Complexity**: Many-to-many relationships (regs → controls, regs → risks, etc.)
- **Mitigation**: Clear data model, helper functions, careful state management

**User Adoption**: Complex feature may have learning curve
- **Mitigation**: Onboarding tour, help tooltips, comprehensive documentation

**Maintenance**: Regulatory landscape changes constantly
- **Mitigation**: Easy status updates, bulk actions, archival workflow

---

This plan provides a complete roadmap for implementing enterprise-grade regulatory compliance tracking that integrates seamlessly with your existing ERM system while maintaining consistency with your Appian design system guidelines.
