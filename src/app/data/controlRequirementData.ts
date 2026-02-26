import { generateId, MOCK_USERS } from './mockData';
import type { AppUser } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type ImplementationStatus = 'not_started' | 'in_progress' | 'implemented' | 'not_applicable';

export const IMPLEMENTATION_STATUSES: ImplementationStatus[] = [
  'not_started', 'in_progress', 'implemented', 'not_applicable',
];

// ─── Display label helpers ───────────────────────────────────────────────────

export const IMPLEMENTATION_STATUS_LABELS: Record<ImplementationStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  implemented: 'Implemented',
  not_applicable: 'N/A',
};

// ─── Badge styling ───────────────────────────────────────────────────────────

export const IMPLEMENTATION_STATUS_STYLES: Record<ImplementationStatus, { background: string; color: string }> = {
  not_started:    { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
  in_progress:    { background: '#FFF3E0', color: '#E07B00' },
  implemented:    { background: '#E8F5EE', color: '#1C8A45' },
  not_applicable: { background: '#F0F0F0', color: '#6B7489' },
};

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ControlRequirementMapping {
  id: string;
  controlId: string;
  requirementId: string;
  implementationStatus: ImplementationStatus;
  maturityScore: number | null;        // 1-5 for HITRUST, null for others
  evidenceDescription: string;
  gapNotes: string;
  lastAssessedDate: string;
  assessor: AppUser | null;
  remediationTargetDate: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_control_requirement_mappings_v1';

function sanitizeMapping(m: any): ControlRequirementMapping {
  return {
    id: m.id ?? 'CRM-' + generateId(),
    controlId: m.controlId ?? '',
    requirementId: m.requirementId ?? '',
    implementationStatus: IMPLEMENTATION_STATUSES.includes(m.implementationStatus)
      ? m.implementationStatus
      : 'not_started',
    maturityScore: typeof m.maturityScore === 'number' && m.maturityScore >= 1 && m.maturityScore <= 5
      ? m.maturityScore
      : null,
    evidenceDescription: m.evidenceDescription ?? '',
    gapNotes: m.gapNotes ?? '',
    lastAssessedDate: m.lastAssessedDate ?? '',
    assessor: m.assessor ?? null,
    remediationTargetDate: m.remediationTargetDate ?? '',
  };
}

export function loadControlRequirementMappings(): ControlRequirementMapping[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeMapping);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_CONTROL_REQUIREMENT_MAPPINGS;
  saveControlRequirementMappings(seed);
  return seed;
}

export function saveControlRequirementMappings(mappings: ControlRequirementMapping[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
}

/** Get all requirement mappings for a specific control */
export function getMappingsForControl(
  mappings: ControlRequirementMapping[],
  controlId: string,
): ControlRequirementMapping[] {
  return mappings.filter(m => m.controlId === controlId);
}

/** Get all control mappings for a specific requirement */
export function getMappingsForRequirement(
  mappings: ControlRequirementMapping[],
  requirementId: string,
): ControlRequirementMapping[] {
  return mappings.filter(m => m.requirementId === requirementId);
}

/** Check if a mapping already exists */
export function controlRequirementMappingExists(
  mappings: ControlRequirementMapping[],
  controlId: string,
  requirementId: string,
): boolean {
  return mappings.some(m => m.controlId === controlId && m.requirementId === requirementId);
}

/** Count of mapped requirements for a control */
export function getRequirementCountForControl(
  mappings: ControlRequirementMapping[],
  controlId: string,
): number {
  return mappings.filter(m => m.controlId === controlId).length;
}

/** Count of mapped controls for a requirement */
export function getControlCountForRequirement(
  mappings: ControlRequirementMapping[],
  requirementId: string,
): number {
  return mappings.filter(m => m.requirementId === requirementId).length;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

// Map existing controls to framework requirements based on frameworkRef field
// and add cross-framework mappings to demonstrate multi-framework coverage.

export const SEED_CONTROL_REQUIREMENT_MAPPINGS: ControlRequirementMapping[] = [

  // CTL-001 (Security Awareness Training)
  // frameworkRef: 'ISO27001-A.7.2.2' → maps to ISO A.6.3 (new numbering)
  // + HITRUST 01.a (policy awareness) + NIST PR.AT-1
  {
    id: 'CRM-001',
    controlId: 'CTL-001',
    requirementId: 'REQ-I-A6.3',   // ISO 27001 A.6.3 Awareness/Training
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Quarterly phishing simulations with >95% completion rate. Annual security awareness training tracked in LMS with completion certificates.',
    gapNotes: '',
    lastAssessedDate: '2025-12-15',
    assessor: MOCK_USERS[5],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-002',
    controlId: 'CTL-001',
    requirementId: 'REQ-H-01a',    // HITRUST 01.a Access Control Policy awareness
    implementationStatus: 'implemented',
    maturityScore: 4,
    evidenceDescription: 'Training covers access control policies. Measured via post-training assessment scores.',
    gapNotes: '',
    lastAssessedDate: '2025-12-15',
    assessor: MOCK_USERS[5],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-003',
    controlId: 'CTL-001',
    requirementId: 'REQ-N-PR.AT-1', // NIST PR.AT-1 Awareness & Training
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Security training program covers all personnel. Role-based training provided for privileged users.',
    gapNotes: '',
    lastAssessedDate: '2025-12-15',
    assessor: MOCK_USERS[5],
    remediationTargetDate: '',
  },

  // CTL-002 (EDR — CrowdStrike Falcon)
  // frameworkRef: 'NIST-DE.CM-4' + HITRUST 09.ab (monitoring)
  {
    id: 'CRM-004',
    controlId: 'CTL-002',
    requirementId: 'REQ-N-DE.CM-4', // NIST DE.CM-4 Malicious Code Detection
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'CrowdStrike Falcon deployed on 100% of endpoints. Behavioral analysis and real-time threat detection active.',
    gapNotes: '',
    lastAssessedDate: '2026-01-10',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-005',
    controlId: 'CTL-002',
    requirementId: 'REQ-H-09ab',    // HITRUST 09.ab Monitoring System Use
    implementationStatus: 'implemented',
    maturityScore: 3,
    evidenceDescription: 'EDR provides continuous endpoint monitoring. Alerts triaged by SOC team.',
    gapNotes: 'Maturity scored at 3 (Implemented) — needs documented measurement procedures to reach level 4.',
    lastAssessedDate: '2026-01-10',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '2026-06-01',
  },

  // CTL-003 (Privileged Access Review)
  // frameworkRef: 'SOC2-CC6.1' + ISO A.8.2 + HITRUST 01.c + NIST PR.AC-1
  {
    id: 'CRM-006',
    controlId: 'CTL-003',
    requirementId: 'REQ-S-CC6.1',   // SOC 2 CC6.1 Logical Access Security
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Quarterly access reviews for all admin accounts. Evidence: review sign-off sheets and recertification logs.',
    gapNotes: '',
    lastAssessedDate: '2025-11-01',
    assessor: MOCK_USERS[0],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-007',
    controlId: 'CTL-003',
    requirementId: 'REQ-I-A8.2',    // ISO A.8.2 Privileged Access Rights
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'PAM solution enforces JIT access. Quarterly review of privileged accounts documented.',
    gapNotes: '',
    lastAssessedDate: '2025-11-01',
    assessor: MOCK_USERS[0],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-008',
    controlId: 'CTL-003',
    requirementId: 'REQ-H-01c',     // HITRUST 01.c Privilege Management
    implementationStatus: 'implemented',
    maturityScore: 4,
    evidenceDescription: 'Privilege reviews conducted quarterly with automated revocation workflows.',
    gapNotes: '',
    lastAssessedDate: '2025-11-01',
    assessor: MOCK_USERS[0],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-009',
    controlId: 'CTL-003',
    requirementId: 'REQ-N-PR.AC-1', // NIST PR.AC-1 Identities & Credentials
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Identity lifecycle management including credential issuance, rotation, and revocation.',
    gapNotes: '',
    lastAssessedDate: '2025-11-01',
    assessor: MOCK_USERS[0],
    remediationTargetDate: '',
  },

  // CTL-004 (DSAR Response Workflow)
  // frameworkRef: 'ISO27001-A.18.1.4' → maps to ISO A.5.34 (Privacy/PII)
  {
    id: 'CRM-010',
    controlId: 'CTL-004',
    requirementId: 'REQ-I-A5.34',   // ISO A.5.34 Privacy and PII
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Automated DSAR workflow with 15-day SLA. Template library for GDPR response letters.',
    gapNotes: '',
    lastAssessedDate: '2026-01-28',
    assessor: MOCK_USERS[11],
    remediationTargetDate: '',
  },

  // CTL-005 (SOD — Journal Entries)
  // frameworkRef: 'SOC2-CC5.2'
  {
    id: 'CRM-011',
    controlId: 'CTL-005',
    requirementId: 'REQ-S-CC5.2',   // SOC 2 CC5.2 Segregation of Duties
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'ERP-enforced SOD rules for journal entry creation vs. posting. Exception reports reviewed monthly by Controller.',
    gapNotes: '',
    lastAssessedDate: '2025-09-15',
    assessor: MOCK_USERS[3],
    remediationTargetDate: '',
  },

  // CTL-006 (Multi-Cloud Failover Testing)
  // frameworkRef: 'NIST-CP-4' + SOC 2 A1.2 (Availability)
  {
    id: 'CRM-012',
    controlId: 'CTL-006',
    requirementId: 'REQ-N-RC.RP-1', // NIST RC.RP-1 Recovery Planning
    implementationStatus: 'in_progress',
    maturityScore: null,
    evidenceDescription: 'Quarterly failover drills to GCP planned. First full-scale test scheduled for Q2 2026.',
    gapNotes: 'Only tabletop exercises completed so far; live failover test not yet executed.',
    lastAssessedDate: '2026-02-01',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '2026-04-30',
  },
  {
    id: 'CRM-013',
    controlId: 'CTL-006',
    requirementId: 'REQ-S-A1.2',    // SOC 2 A1.2 Environmental & Recovery
    implementationStatus: 'in_progress',
    maturityScore: null,
    evidenceDescription: 'Recovery infrastructure provisioned in GCP. Automated backup verification in place.',
    gapNotes: 'Full failover scenario not yet validated in production.',
    lastAssessedDate: '2026-02-01',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '2026-04-30',
  },

  // CTL-007 (DR Plan — Regional Offices)
  // frameworkRef: 'ISO22301-8.4' → maps to HITRUST 11.a (Business Continuity)
  {
    id: 'CRM-014',
    controlId: 'CTL-007',
    requirementId: 'REQ-H-11a',     // HITRUST 11.a Business Continuity
    implementationStatus: 'not_started',
    maturityScore: 1,
    evidenceDescription: '',
    gapNotes: 'DR plan documented but not yet tested. Needs tabletop exercise and live drill.',
    lastAssessedDate: '',
    assessor: null,
    remediationTargetDate: '2026-07-01',
  },

  // CTL-009 (Regulatory Change Monitoring)
  // frameworkRef: 'ISO27001-A.18.1.1' → ISO A.5.31 (Legal/Regulatory)
  {
    id: 'CRM-015',
    controlId: 'CTL-009',
    requirementId: 'REQ-I-A5.31',   // ISO A.5.31 Legal/Regulatory Requirements
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Monthly regulatory digest distributed to legal and compliance. Thomson Reuters Regulatory Intelligence subscription.',
    gapNotes: '',
    lastAssessedDate: '2025-12-01',
    assessor: MOCK_USERS[6],
    remediationTargetDate: '',
  },

  // CTL-010 (Vendor Risk Assessment Program)
  // frameworkRef: 'SOC2-CC9.2' + NIST ID.SC-4
  {
    id: 'CRM-016',
    controlId: 'CTL-010',
    requirementId: 'REQ-S-CC9.2',   // SOC 2 CC9.2 Vendor Risk
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Annual vendor risk assessments for all critical vendors. SOC 2 reports collected and reviewed.',
    gapNotes: '',
    lastAssessedDate: '2025-10-15',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-017',
    controlId: 'CTL-010',
    requirementId: 'REQ-N-ID.SC-4', // NIST ID.SC-4 Supply Chain Assessment
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Third-party risk assessments conducted using standardized questionnaires. Results tracked in ERM tool.',
    gapNotes: '',
    lastAssessedDate: '2025-10-15',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },

  // CTL-011 (Network Segmentation)
  // frameworkRef: 'NIST-SC-7' → NIST PR.PT-4 + HITRUST 09.aa (Audit Logging related)
  {
    id: 'CRM-018',
    controlId: 'CTL-011',
    requirementId: 'REQ-N-PR.PT-4', // NIST PR.PT-4 Network Protection
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'VLAN segmentation with firewall rules between zones. Quarterly firewall rule review.',
    gapNotes: '',
    lastAssessedDate: '2025-11-15',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },
  {
    id: 'CRM-019',
    controlId: 'CTL-011',
    requirementId: 'REQ-S-CC6.3',   // SOC 2 CC6.3 Role-based Access
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'Network access controlled by security zones. Role-based firewall policies enforced.',
    gapNotes: '',
    lastAssessedDate: '2025-11-15',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },

  // CTL-008 (Succession Planning Review) — maps to HITRUST
  {
    id: 'CRM-020',
    controlId: 'CTL-008',
    requirementId: 'REQ-H-01b',     // HITRUST 01.b User Registration (org knowledge)
    implementationStatus: 'in_progress',
    maturityScore: 2,
    evidenceDescription: 'Succession plans drafted for VP+ roles. Knowledge transfer documentation in progress.',
    gapNotes: 'Succession plans exist but lack formal testing and regular update cycle.',
    lastAssessedDate: '2025-11-01',
    assessor: MOCK_USERS[7],
    remediationTargetDate: '2026-06-01',
  },

  // Additional cross-framework mapping: CTL-002 (EDR) → ISO A.8.15 (Logging)
  {
    id: 'CRM-021',
    controlId: 'CTL-002',
    requirementId: 'REQ-I-A8.15',   // ISO A.8.15 Logging
    implementationStatus: 'implemented',
    maturityScore: null,
    evidenceDescription: 'CrowdStrike generates comprehensive endpoint logs. Logs forwarded to SIEM for correlation.',
    gapNotes: '',
    lastAssessedDate: '2026-01-10',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },

  // Additional: CTL-002 (EDR) → HITRUST 09.aa (Audit Logging)
  {
    id: 'CRM-022',
    controlId: 'CTL-002',
    requirementId: 'REQ-H-09aa',    // HITRUST 09.aa Audit Logging
    implementationStatus: 'implemented',
    maturityScore: 3,
    evidenceDescription: 'Endpoint detection logs retained for 90 days in CrowdStrike, 1 year in SIEM.',
    gapNotes: '',
    lastAssessedDate: '2026-01-10',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '',
  },

  // Additional: CTL-011 (Network Segmentation) → HITRUST 10.a (Security Requirements Analysis)
  {
    id: 'CRM-023',
    controlId: 'CTL-011',
    requirementId: 'REQ-H-10a',     // HITRUST 10.a Security Requirements
    implementationStatus: 'in_progress',
    maturityScore: 2,
    evidenceDescription: 'Network design documents include security requirements. Needs formal review cadence.',
    gapNotes: 'Security requirements are documented ad-hoc during architecture reviews but lack formal template.',
    lastAssessedDate: '2025-11-15',
    assessor: MOCK_USERS[1],
    remediationTargetDate: '2026-05-01',
  },
];
