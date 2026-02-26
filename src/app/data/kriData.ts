import { generateId, MOCK_USERS } from './mockData';
import type { AppUser } from './mockData';
import type { Control } from './controlData';
import type { Risk } from './riskData';
import type { RiskAssessment } from './riskAssessmentData';
import type { RiskControl } from './riskControlData';
import type { RiskMitigationAction } from './riskMitigationData';
import { daysUntil } from './mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

export type KRIStatus = 'green' | 'amber' | 'red' | 'no_data';
export type KRIThresholdDirection = 'lower_is_better' | 'higher_is_better';
export type KRICalculationSource =
  | 'auto_overdue_control_tests'
  | 'auto_ineffective_controls'
  | 'auto_open_high_critical_risks'
  | 'auto_overdue_risk_reviews'
  | 'auto_unmitigated_risks'
  | 'auto_control_coverage'
  | 'manual';

export const KRI_CALC_SOURCE_LABELS: Record<KRICalculationSource, string> = {
  auto_overdue_control_tests:   'Auto: Overdue Control Tests',
  auto_ineffective_controls:    'Auto: Ineffective Controls',
  auto_open_high_critical_risks:'Auto: High/Critical Risks',
  auto_overdue_risk_reviews:    'Auto: Overdue Risk Reviews',
  auto_unmitigated_risks:       'Auto: Unmitigated Risks',
  auto_control_coverage:        'Auto: Control Coverage',
  manual:                        'Manual Entry',
};

export const KRI_STATUS_STYLES: Record<KRIStatus, { background: string; color: string; label: string }> = {
  green:   { background: '#E8F5EE', color: '#1C8A45', label: 'Within Target' },
  amber:   { background: '#FFF3E0', color: '#E07B00', label: 'Approaching Threshold' },
  red:     { background: 'rgba(192,57,43,0.10)', color: '#C0392B', label: 'Threshold Breached' },
  no_data: { background: '#F0F2F7', color: '#6B7489', label: 'No Data' },
};

// ─── Appetite threshold map ───────────────────────────────────────────────────
// Maps appetiteLevel → max acceptable residual score (1–25 scale)

export const APPETITE_THRESHOLDS: Record<string, number> = {
  averse:   3,
  minimal:  5,
  cautious: 9,
  open:     12,
  hungry:   16,
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface KRIDataPoint {
  date: string;       // YYYY-MM-DD
  value: number;
  enteredBy?: string;
}

export interface KRI {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: string;             // e.g. 'Cyber', 'Operational', 'Compliance'
  calculationSource: KRICalculationSource;
  thresholdDirection: KRIThresholdDirection;
  greenThreshold: number;
  amberThreshold: number;
  dataPoints: KRIDataPoint[];   // historical — up to 6, sorted oldest → newest
  currentValue: number | null;  // persisted for manual; auto-calculated at runtime
  status: KRIStatus;
  owner: AppUser | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Derive status from value ─────────────────────────────────────────────────

export function deriveKRIStatus(kri: KRI, value: number | null): KRIStatus {
  if (value === null) return 'no_data';
  if (kri.thresholdDirection === 'lower_is_better') {
    if (value <= kri.greenThreshold)  return 'green';
    if (value <= kri.amberThreshold)  return 'amber';
    return 'red';
  } else {
    if (value >= kri.greenThreshold)  return 'green';
    if (value >= kri.amberThreshold)  return 'amber';
    return 'red';
  }
}

// ─── Auto-calculation engine ──────────────────────────────────────────────────

export interface KRICalcContext {
  controls:     Control[];
  risks:        Risk[];
  assessments:  RiskAssessment[];
  riskControls: RiskControl[];
  mitigations:  RiskMitigationAction[];
}

export function calculateKRIValue(
  kri: KRI,
  ctx: KRICalcContext,
): number | null {
  const { controls, risks, assessments, riskControls, mitigations } = ctx;
  const activeControls = controls.filter(c => c.status === 'active');
  const activeRisks    = risks.filter(r => r.status === 'active');

  switch (kri.calculationSource) {
    case 'auto_overdue_control_tests': {
      if (activeControls.length === 0) return 0;
      const overdue = activeControls.filter(c =>
        c.nextTestDate && daysUntil(c.nextTestDate) < 0,
      ).length;
      return Math.round((overdue / activeControls.length) * 100);
    }
    case 'auto_ineffective_controls': {
      if (activeControls.length === 0) return 0;
      const ineffective = activeControls.filter(c =>
        c.effectiveness === 'ineffective',
      ).length;
      return Math.round((ineffective / activeControls.length) * 100);
    }
    case 'auto_open_high_critical_risks': {
      const currentMap = new Map<string, RiskAssessment>();
      assessments.forEach(a => { if (a.isCurrent) currentMap.set(a.riskId, a); });
      return activeRisks.filter(r =>
        (currentMap.get(r.id)?.residualScore ?? 0) >= 12,
      ).length;
    }
    case 'auto_overdue_risk_reviews': {
      return activeRisks.filter(r =>
        r.nextReviewDate && daysUntil(r.nextReviewDate) < 0,
      ).length;
    }
    case 'auto_unmitigated_risks': {
      const risksWithMit = new Set(
        mitigations
          .filter(m => m.status !== 'cancelled')
          .map(m => m.riskId),
      );
      return activeRisks.filter(r => !risksWithMit.has(r.id)).length;
    }
    case 'auto_control_coverage': {
      if (activeRisks.length === 0) return 100;
      const activeControlIds = new Set(activeControls.map(c => c.id));
      const coveredRiskIds = new Set(
        riskControls
          .filter(rc => activeControlIds.has(rc.controlId))
          .map(rc => rc.riskId),
      );
      return Math.round(
        (activeRisks.filter(r => coveredRiskIds.has(r.id)).length / activeRisks.length) * 100,
      );
    }
    case 'manual':
    default:
      return kri.currentValue;
  }
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_kris_v1';

function sanitizeKRI(k: any): KRI {
  return {
    id: k.id ?? 'KRI-' + generateId(),
    name: k.name ?? '',
    description: k.description ?? '',
    unit: k.unit ?? '',
    category: k.category ?? '',
    calculationSource: k.calculationSource ?? 'manual',
    thresholdDirection: k.thresholdDirection ?? 'lower_is_better',
    greenThreshold: typeof k.greenThreshold === 'number' ? k.greenThreshold : 0,
    amberThreshold: typeof k.amberThreshold === 'number' ? k.amberThreshold : 0,
    dataPoints: Array.isArray(k.dataPoints) ? k.dataPoints : [],
    currentValue: typeof k.currentValue === 'number' ? k.currentValue : null,
    status: (['green', 'amber', 'red', 'no_data'].includes(k.status) ? k.status : 'no_data') as KRIStatus,
    owner: k.owner ?? null,
    isActive: typeof k.isActive === 'boolean' ? k.isActive : true,
    createdAt: k.createdAt ?? '',
    updatedAt: k.updatedAt ?? '',
  };
}

export function loadKRIs(): KRI[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeKRI);
      }
    }
  } catch { /* fall through */ }
  const seed = SEED_KRIS;
  saveKRIs(seed);
  return seed;
}

export function saveKRIs(kris: KRI[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kris));
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

export const SEED_KRIS: KRI[] = [
  {
    id: 'KRI-001',
    name: 'Overdue Control Tests',
    description: 'Percentage of active controls whose next test date has passed without a recorded test.',
    unit: '%',
    category: 'Controls',
    calculationSource: 'auto_overdue_control_tests',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 10,
    amberThreshold: 25,
    dataPoints: [
      { date: '2025-09-01', value: 22 },
      { date: '2025-10-01', value: 28 },
      { date: '2025-11-01', value: 25 },
      { date: '2025-12-01', value: 30 },
      { date: '2026-01-01', value: 18 },
      { date: '2026-02-01', value: 15 },
    ],
    currentValue: null,
    status: 'amber',
    owner: MOCK_USERS[0],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-002',
    name: 'Ineffective Controls Rate',
    description: 'Percentage of active controls rated as "Ineffective" in their most recent assessment.',
    unit: '%',
    category: 'Controls',
    calculationSource: 'auto_ineffective_controls',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 5,
    amberThreshold: 15,
    dataPoints: [
      { date: '2025-09-01', value: 12 },
      { date: '2025-10-01', value: 10 },
      { date: '2025-11-01', value: 8 },
      { date: '2025-12-01', value: 7 },
      { date: '2026-01-01', value: 6 },
      { date: '2026-02-01', value: 5 },
    ],
    currentValue: null,
    status: 'green',
    owner: MOCK_USERS[0],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-003',
    name: 'High / Critical Open Risks',
    description: 'Count of active risks with a current residual score of 12 or above (High or Critical rating).',
    unit: 'risks',
    category: 'Risk',
    calculationSource: 'auto_open_high_critical_risks',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 3,
    amberThreshold: 7,
    dataPoints: [
      { date: '2025-09-01', value: 8 },
      { date: '2025-10-01', value: 9 },
      { date: '2025-11-01', value: 7 },
      { date: '2025-12-01', value: 6 },
      { date: '2026-01-01', value: 6 },
      { date: '2026-02-01', value: 5 },
    ],
    currentValue: null,
    status: 'amber',
    owner: MOCK_USERS[0],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-004',
    name: 'Overdue Risk Reviews',
    description: 'Count of active risks whose scheduled next review date has passed without a completed assessment.',
    unit: 'reviews',
    category: 'Risk',
    calculationSource: 'auto_overdue_risk_reviews',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 2,
    amberThreshold: 5,
    dataPoints: [
      { date: '2025-09-01', value: 6 },
      { date: '2025-10-01', value: 8 },
      { date: '2025-11-01', value: 5 },
      { date: '2025-12-01', value: 7 },
      { date: '2026-01-01', value: 4 },
      { date: '2026-02-01', value: 3 },
    ],
    currentValue: null,
    status: 'amber',
    owner: MOCK_USERS[0],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-005',
    name: 'Control Coverage of Active Risks',
    description: 'Percentage of active risks that have at least one active control mapped to them.',
    unit: '%',
    category: 'Controls',
    calculationSource: 'auto_control_coverage',
    thresholdDirection: 'higher_is_better',
    greenThreshold: 80,
    amberThreshold: 60,
    dataPoints: [
      { date: '2025-09-01', value: 45 },
      { date: '2025-10-01', value: 52 },
      { date: '2025-11-01', value: 58 },
      { date: '2025-12-01', value: 65 },
      { date: '2026-01-01', value: 72 },
      { date: '2026-02-01', value: 76 },
    ],
    currentValue: null,
    status: 'amber',
    owner: MOCK_USERS[0],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-006',
    name: 'Phishing Simulation Failure Rate',
    description: 'Percentage of employees who clicked phishing links or submitted credentials in quarterly simulations.',
    unit: '%',
    category: 'Cyber',
    calculationSource: 'manual',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 5,
    amberThreshold: 10,
    dataPoints: [
      { date: '2025-09-01', value: 18, enteredBy: 'Kevin Patel' },
      { date: '2025-10-01', value: 15, enteredBy: 'Kevin Patel' },
      { date: '2025-11-01', value: 12, enteredBy: 'Kevin Patel' },
      { date: '2025-12-01', value: 9,  enteredBy: 'Kevin Patel' },
      { date: '2026-01-01', value: 8,  enteredBy: 'Kevin Patel' },
      { date: '2026-02-01', value: 7,  enteredBy: 'Kevin Patel' },
    ],
    currentValue: 7,
    status: 'amber',
    owner: MOCK_USERS[5],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-007',
    name: 'Mean Time to Remediate (Critical)',
    description: 'Average number of days to fully remediate a critical-rated finding from date of identification.',
    unit: 'days',
    category: 'Operational',
    calculationSource: 'manual',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 30,
    amberThreshold: 60,
    dataPoints: [
      { date: '2025-09-01', value: 95, enteredBy: 'Emily Carter' },
      { date: '2025-10-01', value: 87, enteredBy: 'Emily Carter' },
      { date: '2025-11-01', value: 72, enteredBy: 'Emily Carter' },
      { date: '2025-12-01', value: 65, enteredBy: 'Emily Carter' },
      { date: '2026-01-01', value: 58, enteredBy: 'Emily Carter' },
      { date: '2026-02-01', value: 45, enteredBy: 'Emily Carter' },
    ],
    currentValue: 45,
    status: 'amber',
    owner: MOCK_USERS[0],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-008',
    name: 'Policy Exception Requests',
    description: 'Number of active policy exception requests outstanding at month-end, awaiting approval or disposition.',
    unit: 'requests',
    category: 'Compliance',
    calculationSource: 'manual',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 5,
    amberThreshold: 12,
    dataPoints: [
      { date: '2025-09-01', value: 8,  enteredBy: 'Sarah Okonkwo' },
      { date: '2025-10-01', value: 11, enteredBy: 'Sarah Okonkwo' },
      { date: '2025-11-01', value: 9,  enteredBy: 'Sarah Okonkwo' },
      { date: '2025-12-01', value: 14, enteredBy: 'Sarah Okonkwo' },
      { date: '2026-01-01', value: 12, enteredBy: 'Sarah Okonkwo' },
      { date: '2026-02-01', value: 10, enteredBy: 'Sarah Okonkwo' },
    ],
    currentValue: 10,
    status: 'amber',
    owner: MOCK_USERS[11],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-009',
    name: 'Security Training Completion',
    description: 'Percentage of employees who have completed mandatory annual security awareness training.',
    unit: '%',
    category: 'Cyber',
    calculationSource: 'manual',
    thresholdDirection: 'higher_is_better',
    greenThreshold: 90,
    amberThreshold: 75,
    dataPoints: [
      { date: '2025-09-01', value: 82, enteredBy: 'Monica Shaw' },
      { date: '2025-10-01', value: 85, enteredBy: 'Monica Shaw' },
      { date: '2025-11-01', value: 87, enteredBy: 'Monica Shaw' },
      { date: '2025-12-01', value: 84, enteredBy: 'Monica Shaw' },
      { date: '2026-01-01', value: 88, enteredBy: 'Monica Shaw' },
      { date: '2026-02-01', value: 91, enteredBy: 'Monica Shaw' },
    ],
    currentValue: 91,
    status: 'green',
    owner: MOCK_USERS[7],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
  {
    id: 'KRI-010',
    name: 'Third-Party Risk Score (Avg)',
    description: 'Average inherent risk score across all active third-party vendors, on a 1–10 scale from vendor due diligence assessments.',
    unit: 'score',
    category: 'Third-Party',
    calculationSource: 'manual',
    thresholdDirection: 'lower_is_better',
    greenThreshold: 4,
    amberThreshold: 6,
    dataPoints: [
      { date: '2025-09-01', value: 7.2, enteredBy: 'Marcus Johnson' },
      { date: '2025-10-01', value: 7.0, enteredBy: 'Marcus Johnson' },
      { date: '2025-11-01', value: 6.8, enteredBy: 'Marcus Johnson' },
      { date: '2025-12-01', value: 6.5, enteredBy: 'Marcus Johnson' },
      { date: '2026-01-01', value: 6.1, enteredBy: 'Marcus Johnson' },
      { date: '2026-02-01', value: 5.8, enteredBy: 'Marcus Johnson' },
    ],
    currentValue: 5.8,
    status: 'amber',
    owner: MOCK_USERS[1],
    isActive: true,
    createdAt: '2025-09-01',
    updatedAt: '2026-02-01',
  },
];
