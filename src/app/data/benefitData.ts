import { generateId } from './mockData';

export type BenefitStatus = 'Active' | 'Draft' | 'Inactive' | 'Archived';
export type QnxtConfigStatus = 'Not Started' | 'In Progress' | 'Complete' | 'Verified';

export interface Benefit {
  id: string;
  planId: string;
  name: string;
  category: string;
  status: BenefitStatus;
  description: string;
  coverageDetails: string;
  limits: string;
  eligibility: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  // QNXT configuration
  qnxtConfigStatus: QnxtConfigStatus;
  qnxtBenefitCode: string;
  qnxtConfiguredBy: string;
  qnxtConfiguredDate: string;
  qnxtNotes: string;
  createdDate: string;
  updatedDate: string;
}

export const BENEFIT_CATEGORIES = [
  'Coverage',
  'Cost Sharing',
  'Eligibility',
  'Network',
  'Preventive',
  'Pharmacy',
  'Employer Contribution',
  'Income Replacement',
  'Other',
] as const;

const STORAGE_KEY = 'erm_benefits_v2';

const QNXT_CONFIG_STATUSES: QnxtConfigStatus[] = ['Not Started', 'In Progress', 'Complete', 'Verified'];

function sanitizeBenefit(b: any): Benefit {
  return {
    id: b.id ?? 'BNF-' + generateId(),
    planId: b.planId ?? '',
    name: b.name ?? '',
    category: b.category ?? '',
    status: (['Active','Draft','Inactive','Archived'].includes(b.status) ? b.status : 'Draft') as BenefitStatus,
    description: b.description ?? '',
    coverageDetails: b.coverageDetails ?? '',
    limits: b.limits ?? '',
    eligibility: b.eligibility ?? '',
    effectiveStartDate: b.effectiveStartDate ?? '',
    effectiveEndDate: b.effectiveEndDate ?? '',
    qnxtConfigStatus: (QNXT_CONFIG_STATUSES.includes(b.qnxtConfigStatus) ? b.qnxtConfigStatus : 'Not Started') as QnxtConfigStatus,
    qnxtBenefitCode: b.qnxtBenefitCode ?? '',
    qnxtConfiguredBy: b.qnxtConfiguredBy ?? '',
    qnxtConfiguredDate: b.qnxtConfiguredDate ?? '',
    qnxtNotes: b.qnxtNotes ?? '',
    createdDate: b.createdDate ?? '',
    updatedDate: b.updatedDate ?? '',
  };
}

export function loadBenefits(): Benefit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitizeBenefit);
    }
  } catch { /* fall through */ }
  const seed = SEED_BENEFITS;
  saveBenefits(seed);
  return seed;
}

export function saveBenefits(benefits: Benefit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(benefits));
}

export function createBenefit(data: Omit<Benefit, 'id' | 'createdDate' | 'updatedDate'>): Benefit {
  const today = new Date().toISOString().split('T')[0];
  return { ...data, id: 'BNF-' + generateId(), createdDate: today, updatedDate: today };
}

export function updateBenefit(existing: Benefit, changes: Partial<Benefit>): Benefit {
  const today = new Date().toISOString().split('T')[0];
  return { ...existing, ...changes, updatedDate: today };
}

export const SEED_BENEFITS: Benefit[] = [
  {
    id: 'BNF-001',
    planId: 'PLN-003',
    name: 'In-Network Coverage',
    category: 'Coverage',
    status: 'Active',
    description: 'Medical services received from in-network providers.',
    coverageDetails: 'Plan pays 80% after deductible for most in-network services.',
    limits: 'In-network deductible: $1,500 individual / $3,000 family.',
    eligibility: 'All enrolled employees and covered dependents.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    qnxtConfigStatus: 'Verified',
    qnxtBenefitCode: 'MED-IN-001',
    qnxtConfiguredBy: 'Rachel Torres',
    qnxtConfiguredDate: '2023-12-15',
    qnxtNotes: 'Configured for in-network tier 1. Deductible accumulator group set to INET.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'BNF-002',
    planId: 'PLN-003',
    name: 'Out-of-Network Coverage',
    category: 'Coverage',
    status: 'Active',
    description: 'Medical services received from out-of-network providers.',
    coverageDetails: 'Plan pays 60% after deductible for out-of-network services.',
    limits: 'Out-of-network deductible: $3,000 individual / $6,000 family.',
    eligibility: 'All enrolled employees and covered dependents.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    qnxtConfigStatus: 'Verified',
    qnxtBenefitCode: 'MED-OON-001',
    qnxtConfiguredBy: 'Rachel Torres',
    qnxtConfiguredDate: '2023-12-15',
    qnxtNotes: 'OON accumulator group set to ONET. Coinsurance applied post-deductible.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'BNF-003',
    planId: 'PLN-001',
    name: 'Employer Match',
    category: 'Employer Contribution',
    status: 'Active',
    description: 'Company matching contribution on employee 401(k) deferrals.',
    coverageDetails: '100% match on first 3% of eligible compensation, 50% match on next 2%.',
    limits: 'Maximum employer match: 4% of eligible compensation annually.',
    eligibility: 'Employees who have completed 90 days of service.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    qnxtConfigStatus: 'Not Started',
    qnxtBenefitCode: '',
    qnxtConfiguredBy: '',
    qnxtConfiguredDate: '',
    qnxtNotes: 'Retirement benefit — QNXT configuration not applicable.',
    createdDate: '2023-11-15',
    updatedDate: '2025-12-10',
  },
  {
    id: 'BNF-004',
    planId: 'PLN-004',
    name: 'HSA Employer Seed Contribution',
    category: 'Employer Contribution',
    status: 'Active',
    description: 'Annual employer contribution to employee Health Savings Account.',
    coverageDetails: '$500 for employee-only coverage; $1,000 for family coverage.',
    limits: 'IRS HSA contribution limits apply. 2024: $4,150 individual / $8,300 family.',
    eligibility: 'Employees enrolled in HDHP plan only.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    qnxtConfigStatus: 'Complete',
    qnxtBenefitCode: 'HSA-SEED-001',
    qnxtConfiguredBy: 'Marcus Webb',
    qnxtConfiguredDate: '2024-01-08',
    qnxtNotes: 'HSA seed loaded via batch. Employee tier $500, family tier $1000. Confirm IRS limit check for 2025.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'BNF-005',
    planId: 'PLN-007',
    name: 'Weekly Benefit Payment',
    category: 'Income Replacement',
    status: 'Active',
    description: 'Weekly income replacement during approved short-term disability leave.',
    coverageDetails: '60% of pre-disability weekly earnings.',
    limits: 'Maximum benefit: $2,500 per week. Benefit duration: up to 26 weeks.',
    eligibility: 'Full-time employees after 1 year of continuous service.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    qnxtConfigStatus: 'In Progress',
    qnxtBenefitCode: 'STD-WKL-001',
    qnxtConfiguredBy: 'Priya Nair',
    qnxtConfiguredDate: '2024-01-10',
    qnxtNotes: 'Elimination period (7 days) configured. Awaiting QA sign-off on benefit calculation rule.',
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'BNF-006',
    planId: 'PLN-008',
    name: 'Monthly Benefit Payment',
    category: 'Income Replacement',
    status: 'Active',
    description: 'Monthly income replacement during approved long-term disability leave.',
    coverageDetails: '60% of pre-disability monthly earnings.',
    limits: 'Maximum benefit: $10,000 per month. Benefit to age 65 or SSNRA.',
    eligibility: 'Full-time employees after 180-day elimination period.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    qnxtConfigStatus: 'Verified',
    qnxtBenefitCode: 'LTD-MON-001',
    qnxtConfiguredBy: 'Priya Nair',
    qnxtConfiguredDate: '2024-01-10',
    qnxtNotes: '180-day EP configured. SSDI offset enabled. Benefit duration set to SSNRA.',
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'BNF-007',
    planId: 'PLN-003',
    name: 'Preventive Care — 100% Covered',
    category: 'Preventive',
    status: 'Active',
    description: 'ACA-mandated preventive services covered at 100% with no cost sharing.',
    coverageDetails: 'Annual physicals, immunizations, screenings covered at 100% in-network.',
    limits: 'No deductible or copay for in-network preventive services.',
    eligibility: 'All enrolled employees and covered dependents.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    qnxtConfigStatus: 'Verified',
    qnxtBenefitCode: 'MED-PREV-001',
    qnxtConfiguredBy: 'Rachel Torres',
    qnxtConfiguredDate: '2023-12-15',
    qnxtNotes: 'ACA preventive service list loaded. No cost-share flags set. Annual review required.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'BNF-008',
    planId: 'PLN-009',
    name: 'Counseling Sessions',
    category: 'Coverage',
    status: 'Active',
    description: 'Confidential counseling sessions with licensed mental health professionals.',
    coverageDetails: 'Up to 8 sessions per presenting issue per year at no cost.',
    limits: '8 sessions per presenting issue. No annual or lifetime dollar limit.',
    eligibility: 'Employees, spouses, domestic partners, and dependents up to age 26.',
    effectiveStartDate: '2024-11-01',
    effectiveEndDate: '',
    qnxtConfigStatus: 'Not Started',
    qnxtBenefitCode: '',
    qnxtConfiguredBy: '',
    qnxtConfiguredDate: '',
    qnxtNotes: 'EAP administered externally by vendor — confirm if QNXT entry needed.',
    createdDate: '2024-11-10',
    updatedDate: '2025-12-18',
  },
  {
    id: 'BNF-009',
    planId: 'PLN-006',
    name: 'Basic Life Insurance',
    category: 'Coverage',
    status: 'Active',
    description: 'Employer-paid group term life insurance benefit.',
    coverageDetails: '1x annual base salary, rounded to nearest $1,000.',
    limits: 'Maximum: $500,000. Evidence of Insurability required above guarantee issue.',
    eligibility: 'All full-time employees. Coverage begins on date of hire.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    qnxtConfigStatus: 'Complete',
    qnxtBenefitCode: 'LIFE-BASIC-001',
    qnxtConfiguredBy: 'Marcus Webb',
    qnxtConfiguredDate: '2024-01-05',
    qnxtNotes: 'Salary multiple configured. EOI threshold set at guarantee issue amount.',
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'BNF-010',
    planId: 'PLN-004',
    name: 'Out-of-Pocket Maximum',
    category: 'Cost Sharing',
    status: 'Active',
    description: 'Annual limit on member cost sharing under the HDHP plan.',
    coverageDetails: 'After reaching the OOPM, plan pays 100% of covered in-network expenses.',
    limits: '2024 HDHP OOPM: $5,550 individual / $11,100 family (in-network).',
    eligibility: 'All enrolled employees and covered dependents.',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    qnxtConfigStatus: 'Verified',
    qnxtBenefitCode: 'MED-OOPM-001',
    qnxtConfiguredBy: 'Rachel Torres',
    qnxtConfiguredDate: '2023-12-15',
    qnxtNotes: 'OOPM accumulator includes deductible. Family embedded OOPM configured.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
];
