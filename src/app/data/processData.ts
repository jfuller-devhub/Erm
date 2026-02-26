import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProcessStatus = 'Draft' | 'Active' | 'Retired';
export type StepType = 'Task' | 'Decision' | 'Hand-off';

export interface Step {
  id: string;
  type: StepType;
  description: string;
  input: string;
  output: string;
  entryCriteria: string;
  exitCriteria: string;
  systemTool: string;
  responsibleRole: string;
  sortOrder: number;
  linkedStepIds: string[];
}

export interface SubProcess {
  id: string;
  name: string;
  description: string;
  objective: string;
  boundaryStart: string;
  boundaryEnd: string;
  owner: AppUser | null;
  tags: string[];
  steps: Step[];
}

export interface Process {
  id: string;
  name: string;
  shortDescription: string;
  purpose: string;
  scope: string;
  businessDomain: string;
  tags: string[];
  owner: AppUser | null;
  status: ProcessStatus;
  effectiveStartDate: string;
  effectiveEndDate: string;
  subProcesses: SubProcess[];
  dependsOnProcessIds: string[];
  createdDate: string;
  updatedDate: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_processes_v2';

function sanitizeStep(s: any): Step {
  return {
    id: s.id ?? 'STP-' + generateId(),
    type: s.type ?? 'Task',
    description: s.description ?? '',
    input: s.input ?? '',
    output: s.output ?? '',
    entryCriteria: s.entryCriteria ?? '',
    exitCriteria: s.exitCriteria ?? '',
    systemTool: s.systemTool ?? '',
    responsibleRole: s.responsibleRole ?? '',
    sortOrder: s.sortOrder ?? 0,
    linkedStepIds: Array.isArray(s.linkedStepIds) ? s.linkedStepIds : [],
  };
}

function sanitizeSubProcess(sp: any): SubProcess {
  return {
    id: sp.id ?? 'SUB-' + generateId(),
    name: sp.name ?? '',
    description: sp.description ?? '',
    objective: sp.objective ?? '',
    boundaryStart: sp.boundaryStart ?? '',
    boundaryEnd: sp.boundaryEnd ?? '',
    owner: sp.owner ?? null,
    tags: Array.isArray(sp.tags) ? sp.tags : [],
    steps: Array.isArray(sp.steps) ? sp.steps.map(sanitizeStep) : [],
  };
}

function sanitizeProcess(p: any): Process {
  return {
    id: p.id ?? 'PRC-' + generateId(),
    name: p.name ?? '',
    shortDescription: p.shortDescription ?? p.description ?? '',
    purpose: p.purpose ?? '',
    scope: p.scope ?? '',
    businessDomain: p.businessDomain ?? '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    owner: p.owner ?? null,
    status: (['Draft', 'Active', 'Retired'].includes(p.status) ? p.status : (p.isActive === false ? 'Retired' : 'Active')) as ProcessStatus,
    effectiveStartDate: p.effectiveStartDate ?? p.createdDate ?? '',
    effectiveEndDate: p.effectiveEndDate ?? '',
    subProcesses: Array.isArray(p.subProcesses)
      ? p.subProcesses.map(sanitizeSubProcess)
      : [],
    dependsOnProcessIds: Array.isArray(p.dependsOnProcessIds) ? p.dependsOnProcessIds : [],
    createdDate: p.createdDate ?? '',
    updatedDate: p.updatedDate ?? '',
  };
}

export function loadProcesses(): Process[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeProcess);
      }
    }
  } catch {
    // fall through to seed data
  }
  const seed = SEED_PROCESSES;
  saveProcesses(seed);
  return seed;
}

export function saveProcesses(processes: Process[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
}

// ─── Seed data ───────────────────────────────────────────────────────────────

export const SEED_PROCESSES: Process[] = [
  {
    id: 'PRC-001',
    name: 'Vendor Onboarding',
    shortDescription: 'End-to-end process for evaluating, approving, and onboarding new third-party vendors.',
    purpose: 'Ensure that all new vendors meet security, compliance, and financial standards before they are added to the vendor management system and given access to company data or systems.',
    scope: 'All new third-party vendors across all departments. Covers initial screening through contract execution and system provisioning.',
    businessDomain: 'Procurement',
    tags: ['Vendor Management', 'Compliance', 'Onboarding'],
    owner: MOCK_USERS[0],
    status: 'Active',
    effectiveStartDate: '2024-03-15',
    effectiveEndDate: '2026-03-14',
    subProcesses: [
      {
        id: 'SUB-001A',
        name: 'Vendor Application Review',
        description: 'Initial screening of vendor applications and documentation.',
        objective: 'Verify vendor eligibility and completeness of submitted documentation before advancing to due diligence.',
        boundaryStart: 'Vendor submits application via portal',
        boundaryEnd: 'Application marked as complete or rejected',
        owner: MOCK_USERS[1],
        tags: ['Screening', 'Documentation'],
        steps: [
          {
            id: 'STP-001A1',
            type: 'Task',
            description: 'Receive and log vendor application in the vendor management system',
            input: 'Vendor application form, supporting documents',
            output: 'Logged application record',
            entryCriteria: 'Application submitted via vendor portal',
            exitCriteria: 'Application logged with unique tracking ID',
            systemTool: 'Vendor Portal (Appian)',
            responsibleRole: 'Vendor Coordinator',
            sortOrder: 1,
            linkedStepIds: ['STP-001A2'],
          },
          {
            id: 'STP-001A2',
            type: 'Decision',
            description: 'Review application completeness and determine if additional information is needed',
            input: 'Logged application, checklist of required documents',
            output: 'Completeness decision (pass/request info)',
            entryCriteria: 'Application logged in system',
            exitCriteria: 'Application either approved for due diligence or returned for additional info',
            systemTool: 'Vendor Portal (Appian)',
            responsibleRole: 'Vendor Coordinator',
            sortOrder: 2,
            linkedStepIds: ['STP-001A3'],
          },
          {
            id: 'STP-001A3',
            type: 'Hand-off',
            description: 'Forward approved applications to Due Diligence team for background checks',
            input: 'Approved vendor application package',
            output: 'Due diligence request created',
            entryCriteria: 'Application marked as complete',
            exitCriteria: 'Due diligence team acknowledges receipt',
            systemTool: 'Appian Process',
            responsibleRole: 'Vendor Coordinator',
            sortOrder: 3,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-001B',
        name: 'Due Diligence & Background Check',
        description: 'Financial, legal, and compliance background checks on prospective vendors.',
        objective: 'Identify and assess potential risks associated with the vendor before contract negotiation.',
        boundaryStart: 'Due diligence request received from Application Review',
        boundaryEnd: 'Risk assessment report finalized',
        owner: MOCK_USERS[11],
        tags: ['Risk', 'Compliance', 'Background Check'],
        steps: [
          {
            id: 'STP-001B1',
            type: 'Task',
            description: 'Conduct financial stability assessment using D&B and credit reports',
            input: 'Vendor financial disclosures, D&B report',
            output: 'Financial risk score',
            entryCriteria: 'Vendor application approved for due diligence',
            exitCriteria: 'Financial risk score documented',
            systemTool: 'Dun & Bradstreet, Excel',
            responsibleRole: 'Risk Analyst',
            sortOrder: 1,
            linkedStepIds: ['STP-001B2'],
          },
          {
            id: 'STP-001B2',
            type: 'Task',
            description: 'Perform legal and regulatory compliance screening',
            input: 'Vendor legal filings, sanctions lists',
            output: 'Compliance clearance or flag',
            entryCriteria: 'Financial assessment complete',
            exitCriteria: 'Compliance status documented',
            systemTool: 'LexisNexis, Compliance Portal',
            responsibleRole: 'Compliance Officer',
            sortOrder: 2,
            linkedStepIds: ['STP-001B3'],
          },
          {
            id: 'STP-001B3',
            type: 'Decision',
            description: 'Approve or reject vendor based on combined due diligence findings',
            input: 'Financial score, compliance status, reference checks',
            output: 'Due diligence decision (approve/reject/conditional)',
            entryCriteria: 'All due diligence checks complete',
            exitCriteria: 'Decision documented and communicated',
            systemTool: 'Appian Process',
            responsibleRole: 'Risk Manager',
            sortOrder: 3,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-001C',
        name: 'Contract Negotiation',
        description: 'Negotiation of terms, SLAs, and pricing with the vendor.',
        objective: 'Establish mutually acceptable contractual terms that protect the organization while meeting business needs.',
        boundaryStart: 'Vendor approved through due diligence',
        boundaryEnd: 'Contract executed and signed',
        owner: MOCK_USERS[6],
        tags: ['Legal', 'Negotiation', 'Contract'],
        steps: [
          {
            id: 'STP-001C1',
            type: 'Task',
            description: 'Draft initial contract using approved templates',
            input: 'Approved vendor profile, contract templates',
            output: 'Draft contract document',
            entryCriteria: 'Due diligence approval received',
            exitCriteria: 'Draft contract reviewed by Legal',
            systemTool: 'SharePoint, DocuSign',
            responsibleRole: 'Legal Counsel',
            sortOrder: 1,
            linkedStepIds: ['STP-001C2'],
          },
          {
            id: 'STP-001C2',
            type: 'Task',
            description: 'Negotiate terms and pricing with vendor representatives',
            input: 'Draft contract, vendor counter-proposals',
            output: 'Agreed contract terms',
            entryCriteria: 'Draft contract prepared',
            exitCriteria: 'Both parties agree on terms',
            systemTool: 'Email, Teams, DocuSign',
            responsibleRole: 'Procurement Manager',
            sortOrder: 2,
            linkedStepIds: ['STP-001C3'],
          },
          {
            id: 'STP-001C3',
            type: 'Hand-off',
            description: 'Route final contract for executive approval and signature',
            input: 'Agreed contract document',
            output: 'Signed contract',
            entryCriteria: 'Terms agreed by both parties',
            exitCriteria: 'Contract signed and stored in document repository',
            systemTool: 'DocuSign, SharePoint',
            responsibleRole: 'VP of Procurement',
            sortOrder: 3,
            linkedStepIds: [],
          },
        ],
      },
    ],
    dependsOnProcessIds: [],
    createdDate: '2024-03-15',
    updatedDate: '2025-01-10',
  },
  {
    id: 'PRC-002',
    name: 'Contract Lifecycle Management',
    shortDescription: 'Manages the full lifecycle of contracts from creation through renewal or termination.',
    purpose: 'Provide structured governance over all contract activities to minimize risk, ensure compliance, and optimize commercial outcomes.',
    scope: 'All enterprise contracts including MSAs, SOWs, NDAs, amendments, and purchase orders across all departments.',
    businessDomain: 'Legal',
    tags: ['Contracts', 'Governance', 'Lifecycle'],
    owner: MOCK_USERS[6],
    status: 'Active',
    effectiveStartDate: '2024-01-20',
    effectiveEndDate: '2026-01-19',
    subProcesses: [
      {
        id: 'SUB-002A',
        name: 'Contract Drafting',
        description: 'Creation of contract documents from approved templates.',
        objective: 'Produce compliant, standard contract drafts that minimize legal risk.',
        boundaryStart: 'Contract request submitted by business unit',
        boundaryEnd: 'Draft contract ready for review',
        owner: MOCK_USERS[6],
        tags: ['Drafting', 'Templates'],
        steps: [
          {
            id: 'STP-002A1',
            type: 'Task',
            description: 'Select appropriate contract template based on contract type and value',
            input: 'Contract request form, template library',
            output: 'Selected template with pre-populated fields',
            entryCriteria: 'Approved contract request received',
            exitCriteria: 'Template selected and customized',
            systemTool: 'Contract Management System (Appian)',
            responsibleRole: 'Contract Analyst',
            sortOrder: 1,
            linkedStepIds: ['STP-002A2'],
          },
          {
            id: 'STP-002A2',
            type: 'Task',
            description: 'Draft contract clauses specific to the engagement',
            input: 'Template, business requirements, legal standards',
            output: 'Complete draft contract',
            entryCriteria: 'Template selected',
            exitCriteria: 'Draft reviewed and approved by Legal',
            systemTool: 'Word, SharePoint',
            responsibleRole: 'Legal Counsel',
            sortOrder: 2,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-002B',
        name: 'Renewal Review',
        description: 'Automated flagging and review of upcoming renewals.',
        objective: 'Ensure timely evaluation of contract renewals to avoid lapses or unfavorable auto-renewals.',
        boundaryStart: 'Contract reaches renewal window (90 days before expiry)',
        boundaryEnd: 'Renewal decision made and actioned',
        owner: MOCK_USERS[3],
        tags: ['Renewal', 'Monitoring'],
        steps: [
          {
            id: 'STP-002B1',
            type: 'Task',
            description: 'Generate automated renewal notification and review package',
            input: 'Contract metadata, performance data',
            output: 'Renewal review package',
            entryCriteria: 'Contract within 90-day renewal window',
            exitCriteria: 'Review package sent to contract owner',
            systemTool: 'Appian Process (automated)',
            responsibleRole: 'System (Automated)',
            sortOrder: 1,
            linkedStepIds: ['STP-002B2'],
          },
          {
            id: 'STP-002B2',
            type: 'Decision',
            description: 'Evaluate contract performance and decide on renewal, renegotiation, or termination',
            input: 'Renewal review package, vendor performance metrics',
            output: 'Renewal decision (renew/renegotiate/terminate)',
            entryCriteria: 'Review package received',
            exitCriteria: 'Decision documented and approved',
            systemTool: 'Appian Process',
            responsibleRole: 'Contract Owner',
            sortOrder: 2,
            linkedStepIds: [],
          },
        ],
      },
    ],
    dependsOnProcessIds: ['PRC-001'],
    createdDate: '2024-01-20',
    updatedDate: '2025-02-01',
  },
  {
    id: 'PRC-003',
    name: 'Risk Assessment',
    shortDescription: 'Periodic assessment of operational, financial, and compliance risks across vendor relationships.',
    purpose: 'Proactively identify, quantify, and mitigate enterprise risks to protect business continuity and regulatory compliance.',
    scope: 'All vendor relationships, internal controls, and operational processes subject to risk governance.',
    businessDomain: 'Risk Management',
    tags: ['Risk', 'Compliance', 'Assessment', 'Governance'],
    owner: MOCK_USERS[11],
    status: 'Active',
    effectiveStartDate: '2023-11-05',
    effectiveEndDate: '2025-11-04',
    subProcesses: [
      {
        id: 'SUB-003A',
        name: 'Risk Identification',
        description: 'Identification of potential risk factors through surveys and data analysis.',
        objective: 'Develop a comprehensive risk register that captures all material risks.',
        boundaryStart: 'Risk assessment cycle initiated',
        boundaryEnd: 'Risk register updated with identified risks',
        owner: MOCK_USERS[11],
        tags: ['Identification', 'Survey'],
        steps: [
          {
            id: 'STP-003A1',
            type: 'Task',
            description: 'Distribute risk assessment surveys to control owners and department heads',
            input: 'Survey templates, department roster',
            output: 'Completed surveys',
            entryCriteria: 'Assessment cycle initiated by Risk Manager',
            exitCriteria: 'All surveys collected within deadline',
            systemTool: 'SurveyMonkey, Appian',
            responsibleRole: 'Risk Analyst',
            sortOrder: 1,
            linkedStepIds: ['STP-003A2'],
          },
          {
            id: 'STP-003A2',
            type: 'Task',
            description: 'Analyze survey responses and historical incident data to identify risk themes',
            input: 'Survey responses, incident reports, audit findings',
            output: 'Risk theme analysis document',
            entryCriteria: 'Surveys collected',
            exitCriteria: 'Risk themes documented and categorized',
            systemTool: 'Power BI, Excel',
            responsibleRole: 'Risk Analyst',
            sortOrder: 2,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-003B',
        name: 'Risk Scoring',
        description: 'Quantitative and qualitative scoring of identified risks.',
        objective: 'Assign consistent, comparable risk scores to enable prioritized mitigation.',
        boundaryStart: 'Risk register populated',
        boundaryEnd: 'All risks scored and ranked',
        owner: MOCK_USERS[3],
        tags: ['Scoring', 'Quantitative'],
        steps: [
          {
            id: 'STP-003B1',
            type: 'Task',
            description: 'Apply risk scoring matrix (likelihood x impact) to each identified risk',
            input: 'Risk register, scoring methodology',
            output: 'Scored risk register',
            entryCriteria: 'Risk register finalized',
            exitCriteria: 'All risks scored',
            systemTool: 'Risk Management Module (Appian)',
            responsibleRole: 'Risk Analyst',
            sortOrder: 1,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-003C',
        name: 'Mitigation Planning',
        description: 'Development of action plans to mitigate high-priority risks.',
        objective: 'Create actionable, time-bound mitigation plans for all high and critical risks.',
        boundaryStart: 'Risk scores finalized',
        boundaryEnd: 'Mitigation plans approved and assigned',
        owner: MOCK_USERS[0],
        tags: ['Mitigation', 'Planning'],
        steps: [
          {
            id: 'STP-003C1',
            type: 'Task',
            description: 'Develop mitigation action plans for high-priority risks',
            input: 'Scored risk register, control catalog',
            output: 'Mitigation action plans',
            entryCriteria: 'High/critical risks identified',
            exitCriteria: 'Plans reviewed and approved by risk committee',
            systemTool: 'Appian, SharePoint',
            responsibleRole: 'Risk Owner',
            sortOrder: 1,
            linkedStepIds: ['STP-003C2'],
          },
          {
            id: 'STP-003C2',
            type: 'Decision',
            description: 'Risk committee reviews and approves or adjusts mitigation plans',
            input: 'Proposed mitigation plans, budget estimates',
            output: 'Approved mitigation plans',
            entryCriteria: 'Plans submitted to risk committee',
            exitCriteria: 'Committee approval documented',
            systemTool: 'Appian Process',
            responsibleRole: 'Risk Committee Chair',
            sortOrder: 2,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-003D',
        name: 'Monitoring & Reporting',
        description: 'Ongoing monitoring and periodic executive risk reporting.',
        objective: 'Maintain continuous visibility into risk status and communicate trends to leadership.',
        boundaryStart: 'Mitigation plans in execution',
        boundaryEnd: 'Quarterly risk report published',
        owner: MOCK_USERS[10],
        tags: ['Monitoring', 'Reporting'],
        steps: [],
      },
    ],
    dependsOnProcessIds: ['PRC-001'],
    createdDate: '2023-11-05',
    updatedDate: '2025-01-28',
  },
  {
    id: 'PRC-004',
    name: 'Employee Offboarding',
    shortDescription: 'Structured process for revoking access, recovering assets, and completing exit procedures.',
    purpose: 'Protect organizational security and ensure compliance by systematically deprovisioning departing employees.',
    scope: 'All voluntary and involuntary employee departures across the organization.',
    businessDomain: 'Human Resources',
    tags: ['HR', 'Security', 'Offboarding'],
    owner: MOCK_USERS[7],
    status: 'Retired',
    effectiveStartDate: '2024-06-12',
    effectiveEndDate: '2024-09-30',
    subProcesses: [
      {
        id: 'SUB-004A',
        name: 'Access Revocation',
        description: 'Disable all system accounts and revoke badge access.',
        objective: 'Eliminate all system and physical access for departing employees within SLA.',
        boundaryStart: 'Offboarding request received from HR',
        boundaryEnd: 'All access confirmed revoked',
        owner: MOCK_USERS[5],
        tags: ['Security', 'Access'],
        steps: [
          {
            id: 'STP-004A1',
            type: 'Task',
            description: 'Disable Active Directory and SSO accounts',
            input: 'Offboarding checklist, employee ID',
            output: 'Disabled accounts confirmation',
            entryCriteria: 'Offboarding request approved',
            exitCriteria: 'All accounts disabled and logged',
            systemTool: 'Active Directory, Okta',
            responsibleRole: 'IT Security Analyst',
            sortOrder: 1,
            linkedStepIds: ['STP-004A2'],
          },
          {
            id: 'STP-004A2',
            type: 'Task',
            description: 'Revoke physical badge and facility access',
            input: 'Badge ID, access control records',
            output: 'Badge deactivated confirmation',
            entryCriteria: 'Digital accounts disabled',
            exitCriteria: 'Badge returned or deactivated',
            systemTool: 'Physical Access Control System',
            responsibleRole: 'Facilities Coordinator',
            sortOrder: 2,
            linkedStepIds: [],
          },
        ],
      },
      {
        id: 'SUB-004B',
        name: 'Asset Recovery',
        description: 'Collect company-issued devices, keys, and materials.',
        objective: 'Recover all company assets and close out equipment records.',
        boundaryStart: 'Employee notified of departure',
        boundaryEnd: 'All assets logged as returned or written off',
        owner: MOCK_USERS[4],
        tags: ['Assets', 'Equipment'],
        steps: [],
      },
    ],
    dependsOnProcessIds: [],
    createdDate: '2024-06-12',
    updatedDate: '2024-09-30',
  },
  {
    id: 'PRC-005',
    name: 'Compliance Audit Preparation',
    shortDescription: 'Preparation process for internal and external compliance audits (SOX, GDPR, regulatory).',
    purpose: 'Ensure audit readiness by systematically collecting evidence, validating controls, and coordinating with auditors.',
    scope: 'SOX, GDPR, and industry-specific regulatory audits. Covers evidence collection, control validation, and auditor coordination.',
    businessDomain: 'Compliance',
    tags: ['Audit', 'SOX', 'GDPR', 'Compliance'],
    owner: MOCK_USERS[3],
    status: 'Draft',
    effectiveStartDate: '2025-04-01',
    effectiveEndDate: '',
    subProcesses: [
      {
        id: 'SUB-005A',
        name: 'Evidence Collection',
        description: 'Gathering documentation and evidence from control owners.',
        objective: 'Compile complete, accurate evidence packages for each audit control point.',
        boundaryStart: 'Audit notification received',
        boundaryEnd: 'Evidence package submitted to auditors',
        owner: MOCK_USERS[11],
        tags: ['Evidence', 'Documentation'],
        steps: [
          {
            id: 'STP-005A1',
            type: 'Task',
            description: 'Send evidence request notices to all control owners',
            input: 'Control matrix, owner contact list',
            output: 'Evidence requests sent',
            entryCriteria: 'Audit scope defined',
            exitCriteria: 'All requests sent with deadlines',
            systemTool: 'Appian Process, Email',
            responsibleRole: 'Audit Coordinator',
            sortOrder: 1,
            linkedStepIds: ['STP-005A2'],
          },
          {
            id: 'STP-005A2',
            type: 'Task',
            description: 'Collect and validate evidence submissions against control requirements',
            input: 'Submitted evidence, control requirements',
            output: 'Validated evidence package',
            entryCriteria: 'Evidence submissions received',
            exitCriteria: 'All evidence validated and gaps identified',
            systemTool: 'SharePoint, Appian',
            responsibleRole: 'Audit Coordinator',
            sortOrder: 2,
            linkedStepIds: ['STP-005A3'],
          },
          {
            id: 'STP-005A3',
            type: 'Decision',
            description: 'Review evidence completeness and determine if additional collection is needed',
            input: 'Validated evidence package, gap analysis',
            output: 'Evidence readiness decision',
            entryCriteria: 'Evidence validation complete',
            exitCriteria: 'Package approved for submission or returned for additional collection',
            systemTool: 'Appian Process',
            responsibleRole: 'Compliance Manager',
            sortOrder: 3,
            linkedStepIds: [],
          },
        ],
      },
    ],
    dependsOnProcessIds: ['PRC-003'],
    createdDate: '2024-09-01',
    updatedDate: '2025-02-15',
  },
];
