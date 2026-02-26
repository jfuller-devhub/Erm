import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type MitigationActionType = 'mitigate' | 'accept' | 'transfer' | 'avoid';
export type MitigationStatus = 'open' | 'in_progress' | 'complete' | 'deferred' | 'cancelled';
export type MitigationPriority = 'critical' | 'high' | 'medium' | 'low';

export const ACTION_TYPES: MitigationActionType[] = ['mitigate', 'accept', 'transfer', 'avoid'];
export const STATUSES: MitigationStatus[] = ['open', 'in_progress', 'complete', 'deferred', 'cancelled'];
export const PRIORITIES: MitigationPriority[] = ['critical', 'high', 'medium', 'low'];

// ─── Display label helpers ───────────────────────────────────────────────────

export const ACTION_TYPE_LABELS: Record<MitigationActionType, string> = {
  mitigate: 'Mitigate',
  accept: 'Accept',
  transfer: 'Transfer',
  avoid: 'Avoid',
};

export const STATUS_LABELS: Record<MitigationStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  complete: 'Complete',
  deferred: 'Deferred',
  cancelled: 'Cancelled',
};

export const PRIORITY_LABELS: Record<MitigationPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

// ─── Badge styling ───────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<MitigationStatus, { background: string; color: string }> = {
  open:        { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  in_progress: { background: '#FFF3E0', color: '#E07B00' },
  complete:    { background: '#E8F5EE', color: '#1C8A45' },
  deferred:    { background: '#F0F2F7', color: '#6B7489' },
  cancelled:   { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
};

export const PRIORITY_STYLES: Record<MitigationPriority, { background: string; color: string }> = {
  critical: { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
  high:     { background: '#FFF3E0', color: '#E07B00' },
  medium:   { background: '#FFF8E1', color: '#B8860B' },
  low:      { background: '#E8F5EE', color: '#1C8A45' },
};

export const ACTION_TYPE_STYLES: Record<MitigationActionType, { background: string; color: string }> = {
  mitigate: { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  accept:   { background: '#E8F5EE', color: '#1C8A45' },
  transfer: { background: '#E0F5F5', color: '#00A3A3' },
  avoid:    { background: '#FFF3E0', color: '#E07B00' },
};

export const EFFECTIVENESS_LABELS: Record<number, string> = {
  1: 'Ineffective',
  2: 'Marginally Effective',
  3: 'Moderately Effective',
  4: 'Effective',
  5: 'Highly Effective',
};

// ─── Interface ───────────────────────────────────────────────────────────────

export interface RiskMitigationAction {
  id: string;
  riskId: string;
  assignedTo: AppUser | null;
  approvedBy: AppUser | null;
  title: string;
  description: string;
  actionType: MitigationActionType;
  status: MitigationStatus;
  priority: MitigationPriority;
  dueDate: string;
  completionDate: string | null;
  costEstimate: number | null;
  effectivenessScore: number | null; // 1–5
  createdAt: string;
  updatedAt: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_risk_mitigations_v1';

function sanitizeMitigation(a: any): RiskMitigationAction {
  return {
    id: a.id ?? 'MIT-' + generateId(),
    riskId: a.riskId ?? '',
    assignedTo: a.assignedTo ?? null,
    approvedBy: a.approvedBy ?? null,
    title: a.title ?? '',
    description: a.description ?? '',
    actionType: ACTION_TYPES.includes(a.actionType) ? a.actionType : 'mitigate',
    status: STATUSES.includes(a.status) ? a.status : 'open',
    priority: PRIORITIES.includes(a.priority) ? a.priority : 'medium',
    dueDate: a.dueDate ?? '',
    completionDate: a.completionDate ?? null,
    costEstimate: typeof a.costEstimate === 'number' ? a.costEstimate : null,
    effectivenessScore: typeof a.effectivenessScore === 'number' ? Math.min(5, Math.max(1, a.effectivenessScore)) : null,
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
  };
}

export function loadRiskMitigations(): RiskMitigationAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeMitigation);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_MITIGATIONS;
  saveRiskMitigations(seed);
  return seed;
}

export function saveRiskMitigations(mitigations: RiskMitigationAction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mitigations));
}

/** Get all mitigation actions for a specific risk, sorted by due date ascending */
export function getMitigationsForRisk(mitigations: RiskMitigationAction[], riskId: string): RiskMitigationAction[] {
  return mitigations
    .filter(m => m.riskId === riskId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/** Count open/in-progress actions for a risk */
export function getActiveMitigationCount(mitigations: RiskMitigationAction[], riskId: string): number {
  return mitigations.filter(m => m.riskId === riskId && (m.status === 'open' || m.status === 'in_progress')).length;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_MITIGATIONS: RiskMitigationAction[] = [
  // RSK-001 — Ransomware Attack
  {
    id: 'MIT-001',
    riskId: 'RSK-001',
    assignedTo: MOCK_USERS[5], // Kevin Patel
    approvedBy: MOCK_USERS[0], // Emily Carter
    title: 'Deploy EDR to remaining 8% of endpoints',
    description: 'Complete CrowdStrike Falcon rollout to all remaining workstations and servers. Includes legacy Windows Server 2016 machines in the Chicago data center that require agent compatibility testing.',
    actionType: 'mitigate',
    status: 'in_progress',
    priority: 'critical',
    dueDate: '2026-03-15',
    completionDate: null,
    costEstimate: 45000,
    effectivenessScore: null,
    createdAt: '2026-01-18',
    updatedAt: '2026-02-10',
  },
  {
    id: 'MIT-002',
    riskId: 'RSK-001',
    assignedTo: MOCK_USERS[5],
    approvedBy: MOCK_USERS[0],
    title: 'Implement immutable backup verification',
    description: 'Configure weekly automated restore tests for critical databases and file shares. Verify backup immutability settings on Veeam infrastructure.',
    actionType: 'mitigate',
    status: 'complete',
    priority: 'high',
    dueDate: '2026-01-31',
    completionDate: '2026-01-28',
    costEstimate: 12000,
    effectivenessScore: 4,
    createdAt: '2025-10-20',
    updatedAt: '2026-01-28',
  },
  {
    id: 'MIT-003',
    riskId: 'RSK-001',
    assignedTo: MOCK_USERS[8], // Gary Bennett
    approvedBy: null,
    title: 'Quarterly phishing simulation campaign',
    description: 'Run targeted phishing simulations with increasing difficulty. Employees who fail receive mandatory refresher training within 48 hours.',
    actionType: 'mitigate',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-06-30',
    completionDate: null,
    costEstimate: 8500,
    effectivenessScore: null,
    createdAt: '2025-07-15',
    updatedAt: '2026-02-01',
  },

  // RSK-002 — GDPR Non-Compliance
  {
    id: 'MIT-004',
    riskId: 'RSK-002',
    assignedTo: MOCK_USERS[11], // Sarah Okonkwo
    approvedBy: MOCK_USERS[6], // Thomas Ward
    title: 'Deploy OneTrust DSAR automation module',
    description: 'Complete integration of OneTrust with all data stores. Automate data subject access requests to achieve sub-14-day processing.',
    actionType: 'mitigate',
    status: 'complete',
    priority: 'high',
    dueDate: '2025-12-31',
    completionDate: '2025-12-18',
    costEstimate: 95000,
    effectivenessScore: 5,
    createdAt: '2025-09-10',
    updatedAt: '2025-12-18',
  },
  {
    id: 'MIT-005',
    riskId: 'RSK-002',
    assignedTo: MOCK_USERS[11],
    approvedBy: MOCK_USERS[6],
    title: 'Annual data processing impact assessment',
    description: 'Conduct DPIAs for all new processing activities identified in Q1 2026. Update data processing register accordingly.',
    actionType: 'mitigate',
    status: 'open',
    priority: 'medium',
    dueDate: '2026-04-30',
    completionDate: null,
    costEstimate: 15000,
    effectivenessScore: null,
    createdAt: '2026-01-25',
    updatedAt: '2026-01-25',
  },

  // RSK-003 — SOX Material Weakness
  {
    id: 'MIT-006',
    riskId: 'RSK-003',
    assignedTo: MOCK_USERS[3], // Alan Foster
    approvedBy: MOCK_USERS[0],
    title: 'Automate journal entry dual-approval workflow',
    description: 'Implement automated workflow in SAP for all journal entries exceeding $50K. Include segregation of duties validation and audit trail.',
    actionType: 'mitigate',
    status: 'complete',
    priority: 'critical',
    dueDate: '2026-01-15',
    completionDate: '2026-01-10',
    costEstimate: 65000,
    effectivenessScore: 4,
    createdAt: '2025-10-01',
    updatedAt: '2026-01-10',
  },
  {
    id: 'MIT-007',
    riskId: 'RSK-003',
    assignedTo: MOCK_USERS[3],
    approvedBy: MOCK_USERS[0],
    title: 'Revenue recognition policy update and training',
    description: 'Rewrite guidance for multi-element arrangements under ASC 606. Deliver mandatory training to all Finance team members.',
    actionType: 'mitigate',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-03-31',
    completionDate: null,
    costEstimate: 20000,
    effectivenessScore: null,
    createdAt: '2025-10-01',
    updatedAt: '2026-02-05',
  },

  // RSK-004 — Vendor Single Point of Failure
  {
    id: 'MIT-008',
    riskId: 'RSK-004',
    assignedTo: MOCK_USERS[1], // Marcus Johnson
    approvedBy: MOCK_USERS[0],
    title: 'Multi-cloud failover POC for critical services',
    description: 'Complete Azure failover proof-of-concept for the top 5 customer-facing services. Document RTO/RPO metrics and cost comparison.',
    actionType: 'mitigate',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-06-30',
    completionDate: null,
    costEstimate: 240000,
    effectivenessScore: null,
    createdAt: '2026-01-12',
    updatedAt: '2026-02-15',
  },
  {
    id: 'MIT-009',
    riskId: 'RSK-004',
    assignedTo: MOCK_USERS[1],
    approvedBy: null,
    title: 'Negotiate enhanced SLA with AWS',
    description: 'Work with AWS account team to negotiate enhanced SLA terms including dedicated support engineer and guaranteed 4-hour response time for Sev-1 incidents.',
    actionType: 'transfer',
    status: 'open',
    priority: 'medium',
    dueDate: '2026-04-15',
    completionDate: null,
    costEstimate: null,
    effectivenessScore: null,
    createdAt: '2026-01-12',
    updatedAt: '2026-01-12',
  },

  // RSK-006 — DR Plan Gap
  {
    id: 'MIT-010',
    riskId: 'RSK-006',
    assignedTo: MOCK_USERS[8], // Gary Bennett
    approvedBy: MOCK_USERS[1],
    title: 'Develop and test DR runbooks for all Tier 1 services',
    description: 'Create detailed disaster recovery runbooks for all Tier 1 services. Conduct tabletop exercises with service owners and validate RTO targets.',
    actionType: 'mitigate',
    status: 'in_progress',
    priority: 'critical',
    dueDate: '2026-04-30',
    completionDate: null,
    costEstimate: 35000,
    effectivenessScore: null,
    createdAt: '2025-12-15',
    updatedAt: '2026-02-08',
  },

  // RSK-007 — Key Person Dependency
  {
    id: 'MIT-011',
    riskId: 'RSK-007',
    assignedTo: MOCK_USERS[7], // Monica Shaw
    approvedBy: MOCK_USERS[0],
    title: 'Complete succession plans for all 3 key positions',
    description: 'Draft and approve succession plans identifying internal candidates and development timelines for CTO, VP Engineering, and Head of Data Science.',
    actionType: 'mitigate',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2026-05-31',
    completionDate: null,
    costEstimate: null,
    effectivenessScore: null,
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
  },
  {
    id: 'MIT-012',
    riskId: 'RSK-007',
    assignedTo: MOCK_USERS[7],
    approvedBy: null,
    title: 'Retention bonus program for critical roles',
    description: 'Design and implement a 2-year retention bonus program targeting the three identified key-person roles. Include equity vesting acceleration clauses.',
    actionType: 'accept',
    status: 'deferred',
    priority: 'medium',
    dueDate: '2026-03-31',
    completionDate: null,
    costEstimate: 180000,
    effectivenessScore: null,
    createdAt: '2026-02-03',
    updatedAt: '2026-02-12',
  },

  // RSK-009 — Data Localization
  {
    id: 'MIT-013',
    riskId: 'RSK-009',
    assignedTo: MOCK_USERS[6], // Thomas Ward
    approvedBy: MOCK_USERS[0],
    title: 'EU data residency infrastructure assessment',
    description: 'Conduct a comprehensive assessment of all data flows requiring EU residency. Identify infrastructure changes needed and produce a costed implementation roadmap.',
    actionType: 'avoid',
    status: 'open',
    priority: 'high',
    dueDate: '2026-05-15',
    completionDate: null,
    costEstimate: 50000,
    effectivenessScore: null,
    createdAt: '2026-02-10',
    updatedAt: '2026-02-10',
  },
];
