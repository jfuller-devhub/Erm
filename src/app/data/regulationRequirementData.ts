// ─── Types ───────────────────────────────────────────────────────────────────

export type RequirementType = 'must' | 'should' | 'may' | 'must-not';
export type RequirementStatus = 'identified' | 'in-analysis' | 'mapped' | 'implemented' | 'verified';

export interface RegulationRequirement {
  id: string;                        // e.g., "REQ-001"
  regulationId: string;              // Parent regulation
  
  // Requirement details
  requirementNumber: string;         // e.g., "Art. 5.1.a", "§ 123.45"
  title: string;
  description: string;
  requirementType: RequirementType;  // Obligation level
  
  // Citation
  citation: string;                  // Full legal citation
  section: string;                   // Section/Article reference
  
  // Analysis
  applicability: string;             // How it applies to organization
  interpretationNotes: string;
  
  // Implementation
  status: RequirementStatus;
  linkedControlIds: string[];        // Controls implementing this requirement
  gapAnalysis: string;               // Gap assessment notes
  remediationPlan: string;
  
  // Metadata
  assignedTo: string | null;         // Owner for implementation
  dueDate: string | null;
  priority: 'critical' | 'high' | 'medium' | 'low';
  
  // Audit
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Labels & Styles ─────────────────────────────────────────────────────────

export const REQUIREMENT_TYPE_LABELS: Record<RequirementType, string> = {
  must: 'Must (Required)',
  should: 'Should (Recommended)',
  may: 'May (Optional)',
  'must-not': 'Must Not (Prohibited)',
};

export const REQUIREMENT_TYPE_STYLES: Record<RequirementType, { background: string; color: string }> = {
  must: { background: '#FFEBEE', color: '#C62828' },
  should: { background: '#FFF3E0', color: '#E65100' },
  may: { background: '#E3F2FD', color: '#1565C0' },
  'must-not': { background: '#FCE4EC', color: '#C2185B' },
};

export const REQUIREMENT_STATUS_LABELS: Record<RequirementStatus, string> = {
  identified: 'Identified',
  'in-analysis': 'In Analysis',
  mapped: 'Mapped',
  implemented: 'Implemented',
  verified: 'Verified',
};

export const REQUIREMENT_STATUS_STYLES: Record<RequirementStatus, { background: string; color: string }> = {
  identified: { background: '#F5F5F5', color: '#616161' },
  'in-analysis': { background: '#FFF9C4', color: '#F57F17' },
  mapped: { background: '#E1F5FE', color: '#0277BD' },
  implemented: { background: '#E8F5E9', color: '#2E7D32' },
  verified: { background: '#E8F5EE', color: '#1C8A45' },
};

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_regulation_requirements_v1';

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadRegulationRequirements(): RegulationRequirement[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = getSeedRequirements();
    saveRegulationRequirements(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveRegulationRequirements(requirements: RegulationRequirement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
}

export function getRequirementById(
  requirements: RegulationRequirement[],
  id: string
): RegulationRequirement | undefined {
  return requirements.find(r => r.id === id);
}

export function createRequirement(
  requirements: RegulationRequirement[],
  data: Omit<RegulationRequirement, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): RegulationRequirement {
  const nextNum = requirements.length + 1;
  const id = `RREQ-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newRequirement: RegulationRequirement = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newRequirement;
}

export function updateRequirement(
  requirements: RegulationRequirement[],
  id: string,
  updates: Partial<Omit<RegulationRequirement, 'id' | 'createdAt' | 'createdBy'>>
): RegulationRequirement[] {
  const today = new Date().toISOString().split('T')[0];
  return requirements.map(r =>
    r.id === id ? { ...r, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : r
  );
}

export function deleteRequirement(requirements: RegulationRequirement[], id: string): RegulationRequirement[] {
  return requirements.filter(r => r.id !== id);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getRequirementsForRegulation(
  requirements: RegulationRequirement[],
  regulationId: string
): RegulationRequirement[] {
  return requirements.filter(r => r.regulationId === regulationId);
}

export function getRequirementsForControl(
  requirements: RegulationRequirement[],
  controlId: string
): RegulationRequirement[] {
  return requirements.filter(r => r.linkedControlIds.includes(controlId));
}

export function calculateRequirementCoverage(
  requirements: RegulationRequirement[],
  regulationId: string
): { total: number; mapped: number; percentage: number } {
  const reqs = getRequirementsForRegulation(requirements, regulationId);
  const total = reqs.length;
  const mapped = reqs.filter(r => r.linkedControlIds.length > 0).length;
  const percentage = total > 0 ? Math.round((mapped / total) * 100) : 0;
  
  return { total, mapped, percentage };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedRequirements(): RegulationRequirement[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'RREQ-001',
      regulationId: 'REG-001',
      requirementNumber: 'Art. 5.1.a',
      title: 'Lawfulness, fairness and transparency',
      description:
        'Personal data shall be processed lawfully, fairly and in a transparent manner in relation to the data subject.',
      requirementType: 'must',
      citation: 'GDPR Article 5(1)(a)',
      section: 'Article 5 - Principles',
      applicability:
        'Applies to all personal data processing activities. Must establish legal basis (consent, contract, legitimate interest, etc.) and document decisions.',
      interpretationNotes:
        'Transparency requires clear, plain language privacy notices at point of collection. Fairness means no deceptive or unexpected processing.',
      status: 'implemented',
      linkedControlIds: ['CTL-001', 'CTL-002'],
      gapAnalysis: 'Currently compliant. Privacy notices updated Q1 2024.',
      remediationPlan: 'N/A - already implemented',
      assignedTo: 'Sarah Johnson',
      dueDate: null,
      priority: 'critical',
      createdAt: formatDate(-180),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-30),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'RREQ-002',
      regulationId: 'REG-001',
      requirementNumber: 'Art. 5.1.e',
      title: 'Storage limitation',
      description:
        'Personal data shall be kept in a form which permits identification of data subjects for no longer than is necessary for the purposes for which the personal data are processed.',
      requirementType: 'must',
      citation: 'GDPR Article 5(1)(e)',
      section: 'Article 5 - Principles',
      applicability:
        'Must define and implement data retention schedules for all personal data categories. Automated deletion where feasible.',
      interpretationNotes:
        'Retention periods should be documented and justified based on legal requirements, business needs, or contractual obligations.',
      status: 'in-analysis',
      linkedControlIds: [],
      gapAnalysis:
        'Retention policy exists but not fully automated. Marketing database lacks automated deletion. Customer service logs retained indefinitely.',
      remediationPlan:
        'Phase 1: Document retention periods for all data categories (Due: May 2026). Phase 2: Implement automated deletion for marketing DB (Due: July 2026).',
      assignedTo: 'Chris Martinez',
      dueDate: formatDate(60),
      priority: 'high',
      createdAt: formatDate(-150),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-20),
      updatedBy: 'Emily Carter',
    },
    {
      id: 'RREQ-003',
      regulationId: 'REG-001',
      requirementNumber: 'Art. 32',
      title: 'Security of processing',
      description:
        'The controller and processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.',
      requirementType: 'must',
      citation: 'GDPR Article 32',
      section: 'Article 32 - Security',
      applicability:
        'Must implement encryption, access controls, security testing, and incident response procedures. Risk-based approach.',
      interpretationNotes:
        'Security measures should be proportionate to risk. Consider pseudonymisation, encryption, regular testing, and business continuity.',
      status: 'mapped',
      linkedControlIds: ['CTL-005', 'CTL-007'],
      gapAnalysis: 'Core controls in place. Need to enhance: 1) Data-at-rest encryption for archives, 2) Annual penetration testing.',
      remediationPlan:
        'Archive encryption: Q3 2026. Annual pentest program: Contract vendor by June 2026.',
      assignedTo: 'Rachel Green',
      dueDate: formatDate(90),
      priority: 'critical',
      createdAt: formatDate(-180),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-10),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'RREQ-004',
      regulationId: 'REG-003',
      requirementNumber: '§ 1798.100',
      title: 'Right to Know',
      description:
        'A consumer shall have the right to request that a business disclose to that consumer the categories and specific pieces of personal information the business has collected.',
      requirementType: 'must',
      citation: 'CCPA § 1798.100',
      section: '§ 1798.100',
      applicability:
        'Must establish process to respond to consumer requests within 45 days. Provide categories and specific pieces of PI collected.',
      interpretationNotes:
        'Response must cover 12-month lookback period. Can request verified identity. Two free requests per year.',
      status: 'implemented',
      linkedControlIds: ['CTL-001'],
      gapAnalysis: 'Automated request portal implemented Q4 2024. Average response time: 32 days.',
      remediationPlan: 'N/A - compliant',
      assignedTo: 'Sarah Johnson',
      dueDate: null,
      priority: 'critical',
      createdAt: formatDate(-200),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-40),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'RREQ-005',
      regulationId: 'REG-003',
      requirementNumber: '§ 1798.105',
      title: 'Right to Delete',
      description:
        'A consumer shall have the right to request that a business delete any personal information about the consumer which the business has collected from the consumer.',
      requirementType: 'must',
      citation: 'CCPA § 1798.105',
      section: '§ 1798.105',
      applicability:
        'Must delete consumer PI upon verified request, subject to exceptions (legal obligations, fraud prevention, etc.). 45-day response.',
      interpretationNotes:
        'Exemptions apply for transactional records, legal compliance, internal uses. Must instruct service providers to delete as well.',
      status: 'in-analysis',
      linkedControlIds: [],
      gapAnalysis:
        'Manual deletion process averages 52 days. Risk of non-compliance with 45-day deadline. Backup retention complicates deletion.',
      remediationPlan:
        'Priority remediation: Automate deletion workflow to ensure <45 day completion. Implement tagged deletion in backups. Target: June 2026.',
      assignedTo: 'Rachel Green',
      dueDate: formatDate(45),
      priority: 'critical',
      createdAt: formatDate(-200),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-5),
      updatedBy: 'Emily Carter',
    },
  ];
}
