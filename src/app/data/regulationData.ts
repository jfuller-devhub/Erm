import type { AppUser } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RegulationStatus =
  | 'monitoring'        // Under consideration, proposed
  | 'in-review'         // Being analyzed
  | 'in-progress'       // Implementation underway
  | 'compliant'         // Fully compliant
  | 'non-compliant'     // Gap identified
  | 'not-applicable'    // Determined not applicable
  | 'archived';         // No longer relevant

export type RegulationStage =
  | 'proposed'          // Bill proposed
  | 'committee'         // In legislative committee
  | 'passed'            // Passed but not effective
  | 'effective'         // Currently in force
  | 'amended'           // Under amendment
  | 'repealed';         // No longer in force

export type ComplianceStatus =
  | 'not-started'
  | 'assessment'        // Gap analysis underway
  | 'planning'          // Compliance plan created
  | 'implementing'      // Controls being implemented
  | 'testing'           // Testing compliance
  | 'compliant'         // Fully compliant
  | 'partial'           // Partially compliant
  | 'non-compliant';    // Not compliant

export type ImpactLevel = 'critical' | 'high' | 'medium' | 'low';

export interface Regulation {
  // Core Identity
  id: string;                        // e.g., "REG-001"
  regulationNumber: string;          // Official number (e.g., "HR-1234", "EU-GDPR-2016/679")
  title: string;
  description: string;

  // Classification
  regulatoryBody: string;            // e.g., "SEC", "EU Parliament", "FINRA", "FDA"
  jurisdiction: string;              // e.g., "Federal - USA", "EU", "California"
  category: string;                  // From config (Financial, Privacy, Safety, etc.)
  impactLevel: ImpactLevel;

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
  relatedBillIds: string[];          // Bill IDs
  linkedControlIds: string[];        // CTL-xxx
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

// ─── Labels & Styles ─────────────────────────────────────────────────────────

export const REGULATION_STATUS_LABELS: Record<RegulationStatus, string> = {
  monitoring: 'Monitoring',
  'in-review': 'In Review',
  'in-progress': 'In Progress',
  compliant: 'Compliant',
  'non-compliant': 'Non-Compliant',
  'not-applicable': 'Not Applicable',
  archived: 'Archived',
};

export const REGULATION_STATUS_STYLES: Record<RegulationStatus, { background: string; color: string }> = {
  monitoring: { background: '#E3F2FD', color: '#1565C0' },
  'in-review': { background: '#FFF3E0', color: '#E65100' },
  'in-progress': { background: '#F3E5F5', color: '#6A1B9A' },
  compliant: { background: '#E8F5EE', color: '#1C8A45' },
  'non-compliant': { background: '#FFEBEE', color: '#C62828' },
  'not-applicable': { background: '#F5F5F5', color: '#616161' },
  archived: { background: '#ECEFF1', color: '#455A64' },
};

export const REGULATION_STAGE_LABELS: Record<RegulationStage, string> = {
  proposed: 'Proposed',
  committee: 'In Committee',
  passed: 'Passed',
  effective: 'Effective',
  amended: 'Amended',
  repealed: 'Repealed',
};

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  'not-started': 'Not Started',
  assessment: 'Assessment',
  planning: 'Planning',
  implementing: 'Implementing',
  testing: 'Testing',
  compliant: 'Compliant',
  partial: 'Partial',
  'non-compliant': 'Non-Compliant',
};

export const COMPLIANCE_STATUS_STYLES: Record<ComplianceStatus, { background: string; color: string }> = {
  'not-started': { background: '#F5F5F5', color: '#616161' },
  assessment: { background: '#E3F2FD', color: '#1565C0' },
  planning: { background: '#FFF3E0', color: '#E65100' },
  implementing: { background: '#F3E5F5', color: '#6A1B9A' },
  testing: { background: '#FFF9C4', color: '#F57F17' },
  compliant: { background: '#E8F5EE', color: '#1C8A45' },
  partial: { background: '#FFFDE7', color: '#F9A825' },
  'non-compliant': { background: '#FFEBEE', color: '#C62828' },
};

export const IMPACT_LEVEL_LABELS: Record<ImpactLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const IMPACT_LEVEL_STYLES: Record<ImpactLevel, { background: string; color: string }> = {
  critical: { background: '#FFEBEE', color: '#C62828' },
  high: { background: '#FFF3E0', color: '#E65100' },
  medium: { background: '#FFFDE7', color: '#F9A825' },
  low: { background: '#E8F5EE', color: '#388E3C' },
};

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_regulations_v2'; // Updated version to force migration

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadRegulations(): Regulation[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Check for old version data
    const oldStored = localStorage.getItem('erm_regulations_v1');
    if (oldStored) {
      // Migrate old data - remove linkedRiskIds and linkedProcessIds
      const oldData = JSON.parse(oldStored);
      const migrated = oldData.map((reg: any) => {
        const { linkedRiskIds, linkedProcessIds, ...rest } = reg;
        return rest;
      });
      saveRegulations(migrated);
      localStorage.removeItem('erm_regulations_v1'); // Clean up old key
      return migrated;
    }
    
    // Initialize with seed data
    const seed = getSeedRegulations();
    saveRegulations(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveRegulations(regulations: Regulation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(regulations));
}

export function getRegulationById(regulations: Regulation[], id: string): Regulation | undefined {
  return regulations.find(r => r.id === id);
}

export function createRegulation(
  regulations: Regulation[],
  data: Omit<Regulation, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Regulation {
  const nextNum = regulations.length + 1;
  const id = `REG-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newRegulation: Regulation = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newRegulation;
}

export function updateRegulation(
  regulations: Regulation[],
  id: string,
  updates: Partial<Omit<Regulation, 'id' | 'createdAt' | 'createdBy'>>
): Regulation[] {
  const today = new Date().toISOString().split('T')[0];
  return regulations.map(r =>
    r.id === id
      ? { ...r, ...updates, updatedAt: today, updatedBy: 'Emily Carter' }
      : r
  );
}

export function deleteRegulation(regulations: Regulation[], id: string): Regulation[] {
  return regulations.filter(r => r.id !== id);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function filterRegulations(
  regulations: Regulation[],
  filters: {
    search?: string;
    status?: RegulationStatus[];
    complianceStatus?: ComplianceStatus[];
    impactLevel?: ImpactLevel[];
    regulatoryBody?: string[];
    jurisdiction?: string[];
    category?: string[];
    owner?: string[];
  }
): Regulation[] {
  let filtered = [...regulations];

  // Search
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      r =>
        r.id.toLowerCase().includes(search) ||
        r.regulationNumber.toLowerCase().includes(search) ||
        r.title.toLowerCase().includes(search) ||
        r.description.toLowerCase().includes(search) ||
        r.regulatoryBody.toLowerCase().includes(search)
    );
  }

  // Status
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(r => filters.status!.includes(r.status));
  }

  // Compliance Status
  if (filters.complianceStatus && filters.complianceStatus.length > 0) {
    filtered = filtered.filter(r => filters.complianceStatus!.includes(r.complianceStatus));
  }

  // Impact Level
  if (filters.impactLevel && filters.impactLevel.length > 0) {
    filtered = filtered.filter(r => filters.impactLevel!.includes(r.impactLevel));
  }

  // Regulatory Body
  if (filters.regulatoryBody && filters.regulatoryBody.length > 0) {
    filtered = filtered.filter(r => filters.regulatoryBody!.includes(r.regulatoryBody));
  }

  // Jurisdiction
  if (filters.jurisdiction && filters.jurisdiction.length > 0) {
    filtered = filtered.filter(r => filters.jurisdiction!.includes(r.jurisdiction));
  }

  // Category
  if (filters.category && filters.category.length > 0) {
    filtered = filtered.filter(r => filters.category!.includes(r.category));
  }

  // Owner
  if (filters.owner && filters.owner.length > 0) {
    filtered = filtered.filter(r => r.primaryOwner && filters.owner!.includes(r.primaryOwner.id));
  }

  return filtered;
}

export function sortRegulations(
  regulations: Regulation[],
  sortBy: 'id' | 'title' | 'effectiveDate' | 'complianceDeadline' | 'status' | 'impact',
  order: 'asc' | 'desc' = 'asc'
): Regulation[] {
  const sorted = [...regulations].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'effectiveDate':
        comparison = (a.effectiveDate || '').localeCompare(b.effectiveDate || '');
        break;
      case 'complianceDeadline':
        comparison = (a.complianceDeadline || '').localeCompare(b.complianceDeadline || '');
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'impact':
        const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = impactOrder[a.impactLevel] - impactOrder[b.impactLevel];
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function getRegulationsByStatus(regulations: Regulation[], status: RegulationStatus): Regulation[] {
  return regulations.filter(r => r.status === status);
}

export function getUpcomingDeadlines(regulations: Regulation[], daysAhead: number = 30): Regulation[] {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  return regulations.filter(r => {
    if (!r.complianceDeadline) return false;
    const deadline = new Date(r.complianceDeadline);
    return deadline >= today && deadline <= futureDate;
  });
}

export function getOverdueRegulations(regulations: Regulation[]): Regulation[] {
  const today = new Date().toISOString().split('T')[0];
  return regulations.filter(
    r =>
      r.complianceDeadline &&
      r.complianceDeadline < today &&
      r.complianceStatus !== 'compliant' &&
      r.status !== 'compliant' &&
      r.status !== 'archived'
  );
}

export function calculateComplianceStats(regulations: Regulation[]) {
  const active = regulations.filter(r => r.status !== 'archived' && r.status !== 'not-applicable');
  const compliant = active.filter(r => r.complianceStatus === 'compliant' || r.status === 'compliant');
  const nonCompliant = active.filter(
    r => r.complianceStatus === 'non-compliant' || r.status === 'non-compliant'
  );
  const upcoming30 = getUpcomingDeadlines(regulations, 30);
  const upcoming60 = getUpcomingDeadlines(regulations, 60);
  const upcoming90 = getUpcomingDeadlines(regulations, 90);
  const overdue = getOverdueRegulations(regulations);

  return {
    total: regulations.length,
    active: active.length,
    compliant: compliant.length,
    nonCompliant: nonCompliant.length,
    complianceRate: active.length > 0 ? Math.round((compliant.length / active.length) * 100) : 0,
    upcoming30Days: upcoming30.length,
    upcoming60Days: upcoming60.length,
    upcoming90Days: upcoming90.length,
    overdue: overdue.length,
  };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedRegulations(): Regulation[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'REG-001',
      regulationNumber: 'SOX-404',
      title: 'Sarbanes-Oxley Act Section 404 - Internal Control Assessment',
      description:
        'Requires annual assessment of internal controls over financial reporting. Management must evaluate and report on the effectiveness of internal controls, and external auditors must attest to this assessment.',
      regulatoryBody: 'SEC - Securities and Exchange Commission',
      jurisdiction: 'Federal - USA',
      category: 'Financial Reporting',
      impactLevel: 'critical',
      status: 'compliant',
      stage: 'effective',
      proposedDate: '2002-01-15',
      publicationDate: '2002-07-30',
      effectiveDate: '2004-11-15',
      complianceDeadline: '2025-12-31',
      reviewDate: '2025-06-30',
      primaryOwner: { id: '1', name: 'Emily Carter', email: 'emily.carter@example.com' },
      stakeholders: [
        { id: '2', name: 'Michael Ross', email: 'michael.ross@example.com' },
        { id: '4', name: 'David Kim', email: 'david.kim@example.com' },
      ],
      department: 'Finance',
      relatedBillIds: [],
      linkedControlIds: ['CTL-001', 'CTL-002', 'CTL-005'],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'compliant',
      gapAnalysisCompleted: true,
      readinessScore: 95,
      estimatedCost: 150000,
      officialUrl: 'https://www.sec.gov/rules/final/33-8238.htm',
      attachmentIds: [],
      tags: ['financial', 'audit', 'internal-controls', 'annual'],
      createdAt: '2024-01-15',
      createdBy: 'Emily Carter',
      updatedAt: '2025-02-20',
      updatedBy: 'Emily Carter',
    },
    {
      id: 'REG-002',
      regulationNumber: 'GDPR-2016/679',
      title: 'General Data Protection Regulation',
      description:
        'EU regulation on data protection and privacy for all individuals within the European Union and the European Economic Area. Addresses export of personal data outside the EU.',
      regulatoryBody: 'EU Parliament',
      jurisdiction: 'European Union',
      category: 'Data Privacy',
      impactLevel: 'critical',
      status: 'compliant',
      stage: 'effective',
      proposedDate: '2012-01-25',
      publicationDate: '2016-04-27',
      effectiveDate: '2018-05-25',
      complianceDeadline: formatDate(45),
      reviewDate: formatDate(180),
      primaryOwner: { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
      stakeholders: [
        { id: '1', name: 'Emily Carter', email: 'emily.carter@example.com' },
        { id: '7', name: 'Rachel Green', email: 'rachel.green@example.com' },
      ],
      department: 'Legal',
      relatedBillIds: [],
      linkedControlIds: ['CTL-003', 'CTL-008'],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'compliant',
      gapAnalysisCompleted: true,
      readinessScore: 88,
      estimatedCost: 250000,
      officialUrl: 'https://gdpr-info.eu/',
      attachmentIds: [],
      tags: ['privacy', 'data-protection', 'eu', 'personal-data'],
      createdAt: '2024-02-10',
      createdBy: 'Sarah Johnson',
      updatedAt: '2025-03-01',
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'REG-003',
      regulationNumber: 'CCPA-AB-375',
      title: 'California Consumer Privacy Act',
      description:
        'California state statute intended to enhance privacy rights and consumer protection for residents of California. Grants consumers rights to know what personal data is collected, delete personal data, and opt-out of sale.',
      regulatoryBody: 'CCPA - California Consumer Privacy Act',
      jurisdiction: 'California',
      category: 'Data Privacy',
      impactLevel: 'high',
      status: 'in-progress',
      stage: 'effective',
      proposedDate: '2018-01-10',
      publicationDate: '2018-06-28',
      effectiveDate: '2020-01-01',
      complianceDeadline: formatDate(15),
      reviewDate: formatDate(90),
      primaryOwner: { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
      stakeholders: [
        { id: '7', name: 'Rachel Green', email: 'rachel.green@example.com' },
        { id: '9', name: 'Chris Martinez', email: 'chris.martinez@example.com' },
      ],
      department: 'Legal',
      relatedBillIds: ['BILL-001'],
      linkedControlIds: ['CTL-003'],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'implementing',
      gapAnalysisCompleted: true,
      readinessScore: 72,
      estimatedCost: 180000,
      officialUrl: 'https://oag.ca.gov/privacy/ccpa',
      attachmentIds: [],
      tags: ['privacy', 'california', 'consumer-rights', 'data'],
      createdAt: '2024-03-05',
      createdBy: 'Sarah Johnson',
      updatedAt: '2025-03-08',
      updatedBy: 'Rachel Green',
    },
    {
      id: 'REG-004',
      regulationNumber: 'SEC-17a-4',
      title: 'SEC Rule 17a-4 - Records Retention for Broker-Dealers',
      description:
        'Requires broker-dealers to preserve electronic records in a non-rewriteable, non-erasable format. Specifies retention periods for various types of records and requirements for third-party storage.',
      regulatoryBody: 'SEC - Securities and Exchange Commission',
      jurisdiction: 'Federal - USA',
      category: 'Securities',
      impactLevel: 'high',
      status: 'compliant',
      stage: 'effective',
      proposedDate: '1997-04-15',
      publicationDate: '1997-05-12',
      effectiveDate: '1999-10-01',
      complianceDeadline: formatDate(120),
      reviewDate: formatDate(180),
      primaryOwner: { id: '4', name: 'David Kim', email: 'david.kim@example.com' },
      stakeholders: [
        { id: '1', name: 'Emily Carter', email: 'emily.carter@example.com' },
      ],
      department: 'Compliance',
      relatedBillIds: [],
      linkedControlIds: ['CTL-006'],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'compliant',
      gapAnalysisCompleted: true,
      readinessScore: 92,
      estimatedCost: 95000,
      officialUrl: 'https://www.sec.gov/rules/interp/34-44238.htm',
      attachmentIds: [],
      tags: ['records', 'retention', 'securities', 'broker-dealer'],
      createdAt: '2024-04-12',
      createdBy: 'David Kim',
      updatedAt: '2025-02-28',
      updatedBy: 'David Kim',
    },
    {
      id: 'REG-005',
      regulationNumber: 'PROPOSAL-AI-2024',
      title: 'Proposed AI Governance and Transparency Act',
      description:
        'Proposed federal legislation requiring companies using AI systems to implement governance frameworks, conduct risk assessments, and provide transparency reports on AI decision-making processes.',
      regulatoryBody: 'Federal - USA',
      jurisdiction: 'Federal - USA',
      category: 'Cybersecurity',
      impactLevel: 'high',
      status: 'monitoring',
      stage: 'committee',
      proposedDate: formatDate(-90),
      publicationDate: null,
      effectiveDate: null,
      complianceDeadline: null,
      reviewDate: formatDate(30),
      primaryOwner: { id: '7', name: 'Rachel Green', email: 'rachel.green@example.com' },
      stakeholders: [
        { id: '9', name: 'Chris Martinez', email: 'chris.martinez@example.com' },
      ],
      department: 'Technology',
      relatedBillIds: ['BILL-002'],
      linkedControlIds: [],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'not-started',
      gapAnalysisCompleted: false,
      readinessScore: 0,
      estimatedCost: null,
      officialUrl: null,
      attachmentIds: [],
      tags: ['ai', 'proposed', 'governance', 'technology'],
      createdAt: formatDate(-85),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-10),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'REG-006',
      regulationNumber: 'OSHA-1910.134',
      title: 'Respiratory Protection Standard',
      description:
        'OSHA standard covering respiratory protection requirements for employees exposed to harmful dusts, fogs, fumes, mists, gases, smokes, sprays, or vapors. Requires written program, medical evaluations, and fit testing.',
      regulatoryBody: 'OSHA - Occupational Safety and Health Administration',
      jurisdiction: 'Federal - USA',
      category: 'Health & Safety',
      impactLevel: 'medium',
      status: 'compliant',
      stage: 'effective',
      proposedDate: '1971-05-29',
      publicationDate: '1998-01-08',
      effectiveDate: '1998-04-08',
      complianceDeadline: formatDate(365),
      reviewDate: formatDate(180),
      primaryOwner: { id: '6', name: 'Lisa Brown', email: 'lisa.brown@example.com' },
      stakeholders: [
        { id: '8', name: 'Tom Anderson', email: 'tom.anderson@example.com' },
      ],
      department: 'Operations',
      relatedBillIds: [],
      linkedControlIds: ['CTL-010'],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'compliant',
      gapAnalysisCompleted: true,
      readinessScore: 85,
      estimatedCost: 45000,
      officialUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.134',
      attachmentIds: [],
      tags: ['safety', 'osha', 'respiratory', 'ppe'],
      createdAt: '2024-05-20',
      createdBy: 'Lisa Brown',
      updatedAt: '2025-01-15',
      updatedBy: 'Lisa Brown',
    },
    {
      id: 'REG-007',
      regulationNumber: 'PCI-DSS-4.0',
      title: 'Payment Card Industry Data Security Standard v4.0',
      description:
        'Information security standard for organizations that handle branded credit cards. Includes requirements for security management, policies, procedures, network architecture, and software design.',
      regulatoryBody: 'PCI DSS - Payment Card Industry',
      jurisdiction: 'International',
      category: 'Cybersecurity',
      impactLevel: 'critical',
      status: 'in-progress',
      stage: 'effective',
      proposedDate: '2022-01-15',
      publicationDate: '2022-03-31',
      effectiveDate: '2024-03-31',
      complianceDeadline: formatDate(60),
      reviewDate: formatDate(90),
      primaryOwner: { id: '7', name: 'Rachel Green', email: 'rachel.green@example.com' },
      stakeholders: [
        { id: '2', name: 'Michael Ross', email: 'michael.ross@example.com' },
        { id: '9', name: 'Chris Martinez', email: 'chris.martinez@example.com' },
      ],
      department: 'Technology',
      relatedBillIds: [],
      linkedControlIds: ['CTL-003', 'CTL-007'],
      supersedes: 'REG-999',
      supersededBy: null,
      complianceStatus: 'testing',
      gapAnalysisCompleted: true,
      readinessScore: 78,
      estimatedCost: 320000,
      officialUrl: 'https://www.pcisecuritystandards.org/',
      attachmentIds: [],
      tags: ['payment', 'security', 'pci', 'data-protection'],
      createdAt: '2024-06-10',
      createdBy: 'Rachel Green',
      updatedAt: '2025-03-05',
      updatedBy: 'Chris Martinez',
    },
    {
      id: 'REG-008',
      regulationNumber: 'EPA-CAA-112',
      title: 'Clean Air Act Section 112 - Hazardous Air Pollutants',
      description:
        'Establishes National Emission Standards for Hazardous Air Pollutants (NESHAPs). Requires reduction of emissions from major sources and implementation of Maximum Achievable Control Technology (MACT).',
      regulatoryBody: 'EPA - Environmental Protection Agency',
      jurisdiction: 'Federal - USA',
      category: 'Environmental',
      impactLevel: 'medium',
      status: 'not-applicable',
      stage: 'effective',
      proposedDate: '1990-11-15',
      publicationDate: '1990-11-15',
      effectiveDate: '1990-11-15',
      complianceDeadline: null,
      reviewDate: null,
      primaryOwner: null,
      stakeholders: [],
      department: 'Operations',
      relatedBillIds: [],
      linkedControlIds: [],
      supersedes: null,
      supersededBy: null,
      complianceStatus: 'not-started',
      gapAnalysisCompleted: false,
      readinessScore: 0,
      estimatedCost: null,
      officialUrl: 'https://www.epa.gov/clean-air-act-overview/clean-air-act-text',
      attachmentIds: [],
      tags: ['environmental', 'air-quality', 'emissions'],
      createdAt: '2024-07-08',
      createdBy: 'System',
      updatedAt: '2024-07-08',
      updatedBy: 'System',
    },
  ];
}