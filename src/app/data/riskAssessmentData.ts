import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type AssessmentType = 'periodic' | 'triggered' | 'ad_hoc';
export type RiskRating = 'critical' | 'high' | 'medium' | 'low' | 'negligible';

export const ASSESSMENT_TYPES: AssessmentType[] = ['periodic', 'triggered', 'ad_hoc'];
export const RISK_RATINGS: RiskRating[] = ['critical', 'high', 'medium', 'low', 'negligible'];

// ─── Display label helpers ───────────────────────────────────────────────────

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  periodic: 'Periodic',
  triggered: 'Triggered',
  ad_hoc: 'Ad Hoc',
};

export const RISK_RATING_LABELS: Record<RiskRating, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  negligible: 'Negligible',
};

export const RISK_RATING_RANGES: Record<RiskRating, string> = {
  critical: '20–25',
  high: '12–19',
  medium: '6–11',
  low: '3–5',
  negligible: '1–2',
};

export const RISK_RATING_STYLES: Record<RiskRating, { background: string; color: string }> = {
  critical:   { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
  high:       { background: '#FFF3E0', color: '#E07B00' },
  medium:     { background: '#FFF8E1', color: '#B8860B' },
  low:        { background: '#E8F5EE', color: '#1C8A45' },
  negligible: { background: '#F0F2F7', color: '#6B7489' },
};

export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain',
};

export const IMPACT_LABELS: Record<number, string> = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Catastrophic',
};

export const VELOCITY_LABELS: Record<number, string> = {
  1: 'Very Slow',
  2: 'Slow',
  3: 'Moderate',
  4: 'Fast',
  5: 'Very Fast',
};

// ─── Score Calculation Helpers ────────────────────────────────────────────────

/** Compute inherent score: likelihood × impact (1–25 scale) */
export function computeInherentScore(likelihood: number, impact: number): number {
  return Math.round(likelihood * impact * 100) / 100;
}

/** Derive risk_rating from residual_score */
export function deriveRiskRating(residualScore: number): RiskRating {
  if (residualScore >= 20) return 'critical';
  if (residualScore >= 12) return 'high';
  if (residualScore >= 6) return 'medium';
  if (residualScore >= 3) return 'low';
  return 'negligible';
}

// ─── RiskAssessment Interface ────────────────────────────────────────────────

export interface RiskAssessment {
  id: string;
  riskId: string;
  reviewer: AppUser | null;
  assessmentDate: string;
  assessmentType: AssessmentType;
  likelihoodScore: number;    // 1–5
  impactScore: number;        // 1–5
  velocityScore: number | null; // 1–5 or null
  inherentScore: number;      // likelihood × impact
  residualScore: number;      // after existing controls
  targetScore: number | null; // desired end-state
  riskRating: RiskRating;     // derived from residualScore
  notes: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_risk_assessments_v1';

function sanitizeAssessment(a: any): RiskAssessment {
  const likelihoodScore = typeof a.likelihoodScore === 'number' ? Math.min(5, Math.max(1, a.likelihoodScore)) : 3;
  const impactScore = typeof a.impactScore === 'number' ? Math.min(5, Math.max(1, a.impactScore)) : 3;
  const inherentScore = typeof a.inherentScore === 'number' ? a.inherentScore : computeInherentScore(likelihoodScore, impactScore);
  const residualScore = typeof a.residualScore === 'number' ? a.residualScore : inherentScore;
  return {
    id: a.id ?? 'ASMT-' + generateId(),
    riskId: a.riskId ?? '',
    reviewer: a.reviewer ?? null,
    assessmentDate: a.assessmentDate ?? '',
    assessmentType: ASSESSMENT_TYPES.includes(a.assessmentType) ? a.assessmentType : 'periodic',
    likelihoodScore,
    impactScore,
    velocityScore: typeof a.velocityScore === 'number' ? Math.min(5, Math.max(1, a.velocityScore)) : null,
    inherentScore,
    residualScore,
    targetScore: typeof a.targetScore === 'number' ? a.targetScore : null,
    riskRating: RISK_RATINGS.includes(a.riskRating) ? a.riskRating : deriveRiskRating(residualScore),
    notes: a.notes ?? '',
    isCurrent: typeof a.isCurrent === 'boolean' ? a.isCurrent : false,
    createdAt: a.createdAt ?? '',
    updatedAt: a.updatedAt ?? '',
  };
}

export function loadRiskAssessments(): RiskAssessment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeAssessment);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_ASSESSMENTS;
  saveRiskAssessments(seed);
  return seed;
}

export function saveRiskAssessments(assessments: RiskAssessment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments));
}

/** Get all assessments for a specific risk, sorted by date descending */
export function getAssessmentsForRisk(assessments: RiskAssessment[], riskId: string): RiskAssessment[] {
  return assessments
    .filter(a => a.riskId === riskId)
    .sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
}

/** Get the current (is_current=true) assessment for a risk */
export function getCurrentAssessment(assessments: RiskAssessment[], riskId: string): RiskAssessment | undefined {
  return assessments.find(a => a.riskId === riskId && a.isCurrent);
}

/** Enforce is_current uniqueness: when setting a new current, clear old ones */
export function setCurrentAssessment(assessments: RiskAssessment[], assessmentId: string): RiskAssessment[] {
  const target = assessments.find(a => a.id === assessmentId);
  if (!target) return assessments;
  return assessments.map(a => {
    if (a.riskId === target.riskId) {
      return { ...a, isCurrent: a.id === assessmentId };
    }
    return a;
  });
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_ASSESSMENTS: RiskAssessment[] = [
  // RSK-001 — Ransomware Attack (3 assessments, showing improvement)
  {
    id: 'ASMT-001',
    riskId: 'RSK-001',
    reviewer: MOCK_USERS[5], // Kevin Patel
    assessmentDate: '2025-07-15',
    assessmentType: 'periodic',
    likelihoodScore: 4,
    impactScore: 5,
    velocityScore: 4,
    inherentScore: 20,
    residualScore: 16,
    targetScore: 8,
    riskRating: 'high',
    notes: 'Initial assessment post-threat intelligence briefing. Current EDR covers 78% of endpoints. Major gaps in cloud workload protection.',
    isCurrent: false,
    createdAt: '2025-07-15',
    updatedAt: '2025-07-15',
  },
  {
    id: 'ASMT-002',
    riskId: 'RSK-001',
    reviewer: MOCK_USERS[5],
    assessmentDate: '2025-10-20',
    assessmentType: 'periodic',
    likelihoodScore: 4,
    impactScore: 5,
    velocityScore: 4,
    inherentScore: 20,
    residualScore: 14,
    targetScore: 8,
    riskRating: 'high',
    notes: 'EDR coverage expanded to 92%. Cloud workload protection agent deployed to 60% of instances. Phishing simulation failure rate dropped from 18% to 9%.',
    isCurrent: false,
    createdAt: '2025-10-20',
    updatedAt: '2025-10-20',
  },
  {
    id: 'ASMT-003',
    riskId: 'RSK-001',
    reviewer: MOCK_USERS[0], // Emily Carter
    assessmentDate: '2026-01-18',
    assessmentType: 'periodic',
    likelihoodScore: 3,
    impactScore: 5,
    velocityScore: 4,
    inherentScore: 15,
    residualScore: 12,
    targetScore: 8,
    riskRating: 'high',
    notes: 'Likelihood reduced after full EDR deployment. Cloud workload protection at 95%. Immutable backup solution now live. Residual remains high due to impact severity — ransomware on core infra would still be catastrophic.',
    isCurrent: true,
    createdAt: '2026-01-18',
    updatedAt: '2026-01-18',
  },

  // RSK-002 — GDPR Non-Compliance (2 assessments)
  {
    id: 'ASMT-004',
    riskId: 'RSK-002',
    reviewer: MOCK_USERS[11], // Sarah Okonkwo
    assessmentDate: '2025-09-10',
    assessmentType: 'periodic',
    likelihoodScore: 4,
    impactScore: 4,
    velocityScore: 3,
    inherentScore: 16,
    residualScore: 12,
    targetScore: 6,
    riskRating: 'high',
    notes: 'Manual DSAR process averages 22 days. Peak periods exceeded 30-day window 3 times in Q2. Automated tooling evaluation underway.',
    isCurrent: false,
    createdAt: '2025-09-10',
    updatedAt: '2025-09-10',
  },
  {
    id: 'ASMT-005',
    riskId: 'RSK-002',
    reviewer: MOCK_USERS[11],
    assessmentDate: '2026-01-25',
    assessmentType: 'periodic',
    likelihoodScore: 3,
    impactScore: 4,
    velocityScore: 3,
    inherentScore: 12,
    residualScore: 9,
    targetScore: 6,
    riskRating: 'medium',
    notes: 'OneTrust DSAR module deployed in Q4. Average processing time now 14 days. No SLA breaches since deployment. Target score achievable after full automation rollout.',
    isCurrent: true,
    createdAt: '2026-01-25',
    updatedAt: '2026-01-25',
  },

  // RSK-003 — SOX Material Weakness (2 assessments)
  {
    id: 'ASMT-006',
    riskId: 'RSK-003',
    reviewer: MOCK_USERS[3], // Alan Foster
    assessmentDate: '2025-10-01',
    assessmentType: 'triggered',
    likelihoodScore: 4,
    impactScore: 5,
    velocityScore: 2,
    inherentScore: 20,
    residualScore: 15,
    targetScore: 5,
    riskRating: 'high',
    notes: 'Triggered by Q3 internal audit finding. 12 manual journal entries lacked dual approval. Revenue recognition timing discrepancies found in 3 contracts.',
    isCurrent: false,
    createdAt: '2025-10-01',
    updatedAt: '2025-10-01',
  },
  {
    id: 'ASMT-007',
    riskId: 'RSK-003',
    reviewer: MOCK_USERS[3],
    assessmentDate: '2026-01-30',
    assessmentType: 'periodic',
    likelihoodScore: 3,
    impactScore: 5,
    velocityScore: 2,
    inherentScore: 15,
    residualScore: 10,
    targetScore: 5,
    riskRating: 'medium',
    notes: 'Automated workflow implemented for journal entries over $50K. Dual approval compliance now at 98%. Revenue recognition policy updated with clearer guidance on multi-element arrangements.',
    isCurrent: true,
    createdAt: '2026-01-30',
    updatedAt: '2026-01-30',
  },

  // RSK-004 — Vendor Single Point of Failure (1 assessment)
  {
    id: 'ASMT-008',
    riskId: 'RSK-004',
    reviewer: MOCK_USERS[1], // Marcus Johnson
    assessmentDate: '2026-01-12',
    assessmentType: 'periodic',
    likelihoodScore: 3,
    impactScore: 5,
    velocityScore: 5,
    inherentScore: 15,
    residualScore: 12,
    targetScore: 6,
    riskRating: 'high',
    notes: 'AWS dependency covers 85% of customer-facing services. Preliminary Azure failover POC completed for 2 non-critical services. Full multi-cloud strategy requires 18-month roadmap and $2.4M investment.',
    isCurrent: true,
    createdAt: '2026-01-12',
    updatedAt: '2026-01-12',
  },

  // RSK-006 — DR Plan Gap (1 assessment)
  {
    id: 'ASMT-009',
    riskId: 'RSK-006',
    reviewer: MOCK_USERS[8], // Gary Bennett
    assessmentDate: '2025-12-15',
    assessmentType: 'ad_hoc',
    likelihoodScore: 3,
    impactScore: 4,
    velocityScore: 3,
    inherentScore: 12,
    residualScore: 10,
    targetScore: 4,
    riskRating: 'medium',
    notes: 'Ad hoc assessment triggered by near-miss at Chicago office (power outage). No DR plan was activated. Recovery was manual and took 14 hours vs. 4-hour RTO target.',
    isCurrent: true,
    createdAt: '2025-12-15',
    updatedAt: '2025-12-15',
  },

  // RSK-007 — Key Person Dependency (1 assessment)
  {
    id: 'ASMT-010',
    riskId: 'RSK-007',
    reviewer: MOCK_USERS[7], // Monica Shaw
    assessmentDate: '2026-02-03',
    assessmentType: 'periodic',
    likelihoodScore: 4,
    impactScore: 4,
    velocityScore: 2,
    inherentScore: 16,
    residualScore: 12,
    targetScore: 6,
    riskRating: 'high',
    notes: 'Succession plan drafted for 1 of 3 positions. Cross-training program initiated but completion expected Q3 2026. Retention risk elevated due to competitive market for senior engineering talent.',
    isCurrent: true,
    createdAt: '2026-02-03',
    updatedAt: '2026-02-03',
  },

  // RSK-008 — Insider Threat (closed risk, 2 assessments showing resolution)
  {
    id: 'ASMT-011',
    riskId: 'RSK-008',
    reviewer: MOCK_USERS[0], // Emily Carter
    assessmentDate: '2025-05-10',
    assessmentType: 'periodic',
    likelihoodScore: 4,
    impactScore: 4,
    velocityScore: 5,
    inherentScore: 16,
    residualScore: 14,
    targetScore: 4,
    riskRating: 'high',
    notes: 'Initial assessment identified 23 unreviewed admin accounts. PAM tool evaluation started. Manual quarterly reviews initiated as interim control.',
    isCurrent: false,
    createdAt: '2025-05-10',
    updatedAt: '2025-05-10',
  },
  {
    id: 'ASMT-012',
    riskId: 'RSK-008',
    reviewer: MOCK_USERS[0],
    assessmentDate: '2025-12-18',
    assessmentType: 'periodic',
    likelihoodScore: 2,
    impactScore: 3,
    velocityScore: 3,
    inherentScore: 6,
    residualScore: 4,
    targetScore: 4,
    riskRating: 'low',
    notes: 'CyberArk PAM deployed. All privileged accounts now subject to automated 90-day access reviews. Admin account count reduced from 23 to 11. Risk closed — target score achieved.',
    isCurrent: true,
    createdAt: '2025-12-18',
    updatedAt: '2025-12-18',
  },

  // RSK-009 — Data Localization (1 assessment)
  {
    id: 'ASMT-013',
    riskId: 'RSK-009',
    reviewer: MOCK_USERS[6], // Thomas Ward
    assessmentDate: '2026-02-10',
    assessmentType: 'triggered',
    likelihoodScore: 3,
    impactScore: 4,
    velocityScore: 2,
    inherentScore: 12,
    residualScore: 10,
    targetScore: 6,
    riskRating: 'medium',
    notes: 'Triggered by draft EU regulation published Jan 2026. Estimated 9-month timeline to achieve compliance if enacted. Infrastructure cost impact: $1.8M for EU data residency. Legal team monitoring legislative progress.',
    isCurrent: true,
    createdAt: '2026-02-10',
    updatedAt: '2026-02-10',
  },
];
