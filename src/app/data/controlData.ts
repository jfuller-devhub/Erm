import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type ControlType = 'preventive' | 'detective' | 'corrective' | 'directive' | 'compensating';
export type ControlFrequency = 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type ControlEffectiveness = 'effective' | 'partially_effective' | 'ineffective' | 'not_tested';
export type ControlStatus = 'active' | 'inactive' | 'in_design' | 'deprecated';

export const CONTROL_TYPES: ControlType[] = ['preventive', 'detective', 'corrective', 'directive', 'compensating'];
export const CONTROL_FREQUENCIES: ControlFrequency[] = ['continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annual'];
export const CONTROL_EFFECTIVENESSES: ControlEffectiveness[] = ['effective', 'partially_effective', 'ineffective', 'not_tested'];
export const CONTROL_STATUSES: ControlStatus[] = ['active', 'inactive', 'in_design', 'deprecated'];

// ─── Display label helpers ───────────────────────────────────────────────────

export const CONTROL_TYPE_LABELS: Record<ControlType, string> = {
  preventive: 'Preventive',
  detective: 'Detective',
  corrective: 'Corrective',
  directive: 'Directive',
  compensating: 'Compensating',
};

export const CONTROL_FREQUENCY_LABELS: Record<ControlFrequency, string> = {
  continuous: 'Continuous',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export const CONTROL_EFFECTIVENESS_LABELS: Record<ControlEffectiveness, string> = {
  effective: 'Effective',
  partially_effective: 'Partially Effective',
  ineffective: 'Ineffective',
  not_tested: 'Not Tested',
};

export const CONTROL_STATUS_LABELS: Record<ControlStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  in_design: 'In Design',
  deprecated: 'Deprecated',
};

// ─── Badge styling ───────────────────────────────────────────────────────────

export const CONTROL_STATUS_STYLES: Record<ControlStatus, { background: string; color: string }> = {
  active:     { background: '#E8F5EE', color: '#1C8A45' },
  inactive:   { background: '#F0F0F0', color: '#6B7489' },
  in_design:  { background: '#FFF3E0', color: '#E07B00' },
  deprecated: { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
};

export const CONTROL_TYPE_STYLES: Record<ControlType, { background: string; color: string }> = {
  preventive:   { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  detective:    { background: '#E0F5F5', color: '#00A3A3' },
  corrective:   { background: '#FFF3E0', color: '#E07B00' },
  directive:    { background: '#F0E8FF', color: '#6B3FA0' },
  compensating: { background: '#FFF8E1', color: '#B8860B' },
};

export const CONTROL_EFFECTIVENESS_STYLES: Record<ControlEffectiveness, { background: string; color: string }> = {
  effective:            { background: '#E8F5EE', color: '#1C8A45' },
  partially_effective:  { background: '#FFF3E0', color: '#E07B00' },
  ineffective:          { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
  not_tested:           { background: '#F0F0F0', color: '#6B7489' },
};

// ─── Departments ─────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  'Technology', 'Operations', 'Finance', 'Compliance', 'Legal',
  'HR', 'Sales', 'Marketing', 'Strategy', 'Facilities',
];

// ─── Interface ───────────────────────────────────────────────────────────────

export interface Control {
  id: string;
  owner: AppUser | null;
  department: string;
  name: string;
  description: string;
  controlType: ControlType;
  frequency: ControlFrequency;
  effectiveness: ControlEffectiveness;
  isAutomated: boolean;
  lastTestedDate: string;
  nextTestDate: string;
  status: ControlStatus;
  frameworkRef: string;
  createdAt: string;
  updatedAt: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_controls_v1';

function sanitizeControl(c: any): Control {
  return {
    id: c.id ?? 'CTL-' + generateId(),
    owner: c.owner ?? null,
    department: c.department ?? '',
    name: c.name ?? '',
    description: c.description ?? '',
    controlType: CONTROL_TYPES.includes(c.controlType) ? c.controlType : 'preventive',
    frequency: CONTROL_FREQUENCIES.includes(c.frequency) ? c.frequency : 'quarterly',
    effectiveness: CONTROL_EFFECTIVENESSES.includes(c.effectiveness) ? c.effectiveness : 'not_tested',
    isAutomated: typeof c.isAutomated === 'boolean' ? c.isAutomated : false,
    lastTestedDate: c.lastTestedDate ?? '',
    nextTestDate: c.nextTestDate ?? '',
    status: CONTROL_STATUSES.includes(c.status) ? c.status : 'in_design',
    frameworkRef: c.frameworkRef ?? '',
    createdAt: c.createdAt ?? '',
    updatedAt: c.updatedAt ?? '',
  };
}

export function loadControls(): Control[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeControl);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_CONTROLS;
  saveControls(seed);
  return seed;
}

export function saveControls(controls: Control[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_CONTROLS: Control[] = [
  {
    id: 'CTL-001',
    owner: MOCK_USERS[5], // Kevin Patel
    department: 'Technology',
    name: 'Mandatory Security Awareness Training',
    description: 'All employees must complete annual security awareness training covering phishing, social engineering, password hygiene, and data handling. Tracked via LMS with automated reminders for overdue completions.',
    controlType: 'preventive',
    frequency: 'annual',
    effectiveness: 'effective',
    isAutomated: false,
    lastTestedDate: '2026-01-15',
    nextTestDate: '2027-01-15',
    status: 'active',
    frameworkRef: 'ISO27001-A.7.2.2',
    createdAt: '2024-03-10',
    updatedAt: '2026-01-15',
  },
  {
    id: 'CTL-002',
    owner: MOCK_USERS[5], // Kevin Patel
    department: 'Technology',
    name: 'Endpoint Detection & Response (EDR)',
    description: 'CrowdStrike Falcon deployed across all corporate endpoints with 24/7 SOC monitoring. Automatically quarantines suspicious processes and alerts the security operations team.',
    controlType: 'detective',
    frequency: 'continuous',
    effectiveness: 'effective',
    isAutomated: true,
    lastTestedDate: '2026-02-01',
    nextTestDate: '2026-05-01',
    status: 'active',
    frameworkRef: 'NIST-DE.CM-4',
    createdAt: '2024-06-15',
    updatedAt: '2026-02-01',
  },
  {
    id: 'CTL-003',
    owner: MOCK_USERS[0], // Emily Carter
    department: 'Technology',
    name: 'Privileged Access Review',
    description: 'Quarterly review of all privileged and admin accounts. Access rights are validated with department managers and unused accounts are disabled within 48 hours.',
    controlType: 'detective',
    frequency: 'quarterly',
    effectiveness: 'partially_effective',
    isAutomated: false,
    lastTestedDate: '2025-12-20',
    nextTestDate: '2026-03-20',
    status: 'active',
    frameworkRef: 'SOC2-CC6.1',
    createdAt: '2024-01-20',
    updatedAt: '2025-12-20',
  },
  {
    id: 'CTL-004',
    owner: MOCK_USERS[11], // Sarah Okonkwo
    department: 'Compliance',
    name: 'DSAR Response Workflow',
    description: 'Automated intake and tracking of data subject access requests. Includes assignment routing, 15-day internal SLA with escalation, and response template library for GDPR compliance.',
    controlType: 'corrective',
    frequency: 'continuous',
    effectiveness: 'partially_effective',
    isAutomated: true,
    lastTestedDate: '2026-01-28',
    nextTestDate: '2026-04-28',
    status: 'active',
    frameworkRef: 'ISO27001-A.18.1.4',
    createdAt: '2025-02-10',
    updatedAt: '2026-01-28',
  },
  {
    id: 'CTL-005',
    owner: MOCK_USERS[3], // Alan Foster
    department: 'Finance',
    name: 'Segregation of Duties — Journal Entries',
    description: 'Manual journal entries above $10,000 require approval from a second authorized finance team member. Automated controls enforce preparer-approver separation in the ERP system.',
    controlType: 'preventive',
    frequency: 'continuous',
    effectiveness: 'effective',
    isAutomated: true,
    lastTestedDate: '2026-02-01',
    nextTestDate: '2026-05-01',
    status: 'active',
    frameworkRef: 'SOC2-CC5.2',
    createdAt: '2024-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'CTL-006',
    owner: MOCK_USERS[1], // Marcus Johnson
    department: 'Operations',
    name: 'Multi-Cloud Failover Testing',
    description: 'Quarterly failover drill between primary (AWS) and secondary (Azure) environments. Tests include DNS switchover, database replication lag, and customer-facing service availability.',
    controlType: 'detective',
    frequency: 'quarterly',
    effectiveness: 'not_tested',
    isAutomated: false,
    lastTestedDate: '',
    nextTestDate: '2026-04-01',
    status: 'in_design',
    frameworkRef: 'NIST-CP-4',
    createdAt: '2026-01-10',
    updatedAt: '2026-02-15',
  },
  {
    id: 'CTL-007',
    owner: MOCK_USERS[8], // Gary Bennett
    department: 'Operations',
    name: 'Disaster Recovery Plan — Regional Offices',
    description: 'Documented DR plans for Chicago and Boston offices including evacuation procedures, data backup verification, alternate work site arrangements, and communication protocols.',
    controlType: 'corrective',
    frequency: 'annual',
    effectiveness: 'not_tested',
    isAutomated: false,
    lastTestedDate: '',
    nextTestDate: '2026-07-01',
    status: 'in_design',
    frameworkRef: 'ISO22301-8.4',
    createdAt: '2025-12-01',
    updatedAt: '2026-01-30',
  },
  {
    id: 'CTL-008',
    owner: MOCK_USERS[7], // Monica Shaw
    department: 'HR',
    name: 'Succession Planning Review',
    description: 'Annual review of succession plans for all director-level and above positions. Identifies key-person dependencies and develops mitigation strategies including cross-training programs.',
    controlType: 'preventive',
    frequency: 'annual',
    effectiveness: 'partially_effective',
    isAutomated: false,
    lastTestedDate: '2025-11-01',
    nextTestDate: '2026-11-01',
    status: 'active',
    frameworkRef: '',
    createdAt: '2024-05-15',
    updatedAt: '2025-11-01',
  },
  {
    id: 'CTL-009',
    owner: MOCK_USERS[6], // Thomas Ward
    department: 'Legal',
    name: 'Regulatory Change Monitoring',
    description: 'Continuous monitoring of regulatory changes across EU, US, and APAC jurisdictions using Thomson Reuters Regulatory Intelligence. Weekly digest reviewed by legal and compliance leadership.',
    controlType: 'detective',
    frequency: 'weekly',
    effectiveness: 'effective',
    isAutomated: true,
    lastTestedDate: '2026-02-10',
    nextTestDate: '2026-05-10',
    status: 'active',
    frameworkRef: 'ISO27001-A.18.1.1',
    createdAt: '2025-01-15',
    updatedAt: '2026-02-10',
  },
  {
    id: 'CTL-010',
    owner: MOCK_USERS[1], // Marcus Johnson
    department: 'Operations',
    name: 'Vendor Risk Assessment',
    description: 'Annual security and operational risk assessment for all critical and high-risk vendors. Includes SOC 2 report review, penetration test results, and business continuity capability evaluation.',
    controlType: 'preventive',
    frequency: 'annual',
    effectiveness: 'effective',
    isAutomated: false,
    lastTestedDate: '2025-10-15',
    nextTestDate: '2026-10-15',
    status: 'active',
    frameworkRef: 'SOC2-CC9.2',
    createdAt: '2023-08-01',
    updatedAt: '2025-10-15',
  },
  {
    id: 'CTL-011',
    owner: MOCK_USERS[5], // Kevin Patel
    department: 'Technology',
    name: 'Network Segmentation & Firewall Rules',
    description: 'Network micro-segmentation with quarterly firewall rule review. Production, staging, and corporate networks are isolated with documented inter-segment access policies.',
    controlType: 'preventive',
    frequency: 'quarterly',
    effectiveness: 'effective',
    isAutomated: true,
    lastTestedDate: '2026-01-05',
    nextTestDate: '2026-04-05',
    status: 'active',
    frameworkRef: 'NIST-SC-7',
    createdAt: '2023-11-20',
    updatedAt: '2026-01-05',
  },
  {
    id: 'CTL-012',
    owner: MOCK_USERS[9], // Jennifer Walsh
    department: 'Marketing',
    name: 'Social Media Crisis Response Plan',
    description: 'Documented response protocol for social media incidents including escalation matrix, pre-approved messaging templates, and designated spokesperson assignments. Reviewed and updated bi-annually.',
    controlType: 'corrective',
    frequency: 'annual',
    effectiveness: 'ineffective',
    isAutomated: false,
    lastTestedDate: '2025-06-01',
    nextTestDate: '2026-06-01',
    status: 'deprecated',
    frameworkRef: '',
    createdAt: '2024-06-01',
    updatedAt: '2025-11-15',
  },
];