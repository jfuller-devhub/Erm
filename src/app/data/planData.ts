import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

export type PlanStatus = 'Active' | 'Draft' | 'Inactive' | 'Archived';

export interface PlanProcessAssociation {
  processId: string;
  subProcessId?: string;
}

export interface Plan {
  id: string;
  productId: string;
  name: string;
  status: PlanStatus;
  effectiveStartDate: string;
  effectiveEndDate: string;
  description: string;
  owner: AppUser | null;
  tags: string[];
  vendorIds: string[];
  entityIds: string[];
  departmentIds: string[];
  processAssociations: PlanProcessAssociation[];
  roadmapPurposeAlignment: string;
  roadmapPlanning: string;
  roadmapProtection: string;
  roadmapPriceCompetitiveness: string;
  roadmapPerformanceMeasurement: string;
  roadmapParticipantExperience: string;
  createdDate: string;
  updatedDate: string;
}

const STORAGE_KEY = 'erm_plans_v2';

function sanitizePlan(p: any): Plan {
  return {
    id: p.id ?? 'PLN-' + generateId(),
    productId: p.productId ?? '',
    name: p.name ?? '',
    status: (['Active','Draft','Inactive','Archived'].includes(p.status) ? p.status : 'Draft') as PlanStatus,
    effectiveStartDate: p.effectiveStartDate ?? '',
    effectiveEndDate: p.effectiveEndDate ?? '',
    description: p.description ?? '',
    owner: p.owner ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    vendorIds: Array.isArray(p.vendorIds) ? p.vendorIds : [],
    entityIds: Array.isArray(p.entityIds) ? p.entityIds : [],
    departmentIds: Array.isArray(p.departmentIds) ? p.departmentIds : [],
    processAssociations: Array.isArray(p.processAssociations) ? p.processAssociations : [],
    roadmapPurposeAlignment: p.roadmapPurposeAlignment ?? '',
    roadmapPlanning: p.roadmapPlanning ?? '',
    roadmapProtection: p.roadmapProtection ?? '',
    roadmapPriceCompetitiveness: p.roadmapPriceCompetitiveness ?? '',
    roadmapPerformanceMeasurement: p.roadmapPerformanceMeasurement ?? '',
    roadmapParticipantExperience: p.roadmapParticipantExperience ?? '',
    createdDate: p.createdDate ?? '',
    updatedDate: p.updatedDate ?? '',
  };
}

export function loadPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitizePlan);
    }
  } catch { /* fall through */ }
  const seed = SEED_PLANS;
  savePlans(seed);
  return seed;
}

export function savePlans(plans: Plan[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function createPlan(data: Omit<Plan, 'id' | 'createdDate' | 'updatedDate'>): Plan {
  const today = new Date().toISOString().split('T')[0];
  return {
    ...data,
    id: 'PLN-' + generateId(),
    createdDate: today,
    updatedDate: today,
  };
}

export function updatePlan(existing: Plan, changes: Partial<Plan>): Plan {
  const today = new Date().toISOString().split('T')[0];
  return { ...existing, ...changes, updatedDate: today };
}

export const SEED_PLANS: Plan[] = [
  {
    id: 'PLN-001',
    productId: 'PRD-001',
    name: '401(k) Defined Contribution Plan',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    description: 'Company 401(k) plan with employer match up to 4% of eligible compensation.',
    owner: MOCK_USERS[3],
    tags: ['401k', 'DC', 'Employer Match'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: 'Support long-term employee financial security through tax-advantaged savings.',
    roadmapPlanning: 'Evaluate 2025 safe-harbor match design changes and SECURE 2.0 compliance requirements.',
    roadmapProtection: 'Annual ERISA fiduciary review and fee benchmarking completed.',
    roadmapPriceCompetitiveness: 'Fund lineup reviewed annually; expense ratios benchmarked to peer plans.',
    roadmapPerformanceMeasurement: 'Track participation rate, deferral rate, and investment return vs. benchmark.',
    roadmapParticipantExperience: 'Mobile app enrollment and guided savings increase tools under evaluation.',
    createdDate: '2023-11-15',
    updatedDate: '2025-12-10',
  },
  {
    id: 'PLN-002',
    productId: 'PRD-001',
    name: 'Defined Benefit Pension Plan',
    status: 'Inactive',
    effectiveStartDate: '1985-01-01',
    effectiveEndDate: '2015-12-31',
    description: 'Legacy defined benefit pension plan closed to new entrants since 2015. Ongoing benefit accruals for grandfathered participants.',
    owner: MOCK_USERS[3],
    tags: ['Pension', 'DB', 'Legacy', 'Grandfathered'],
    vendorIds: [],
    entityIds: ['EMP-001'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Plan termination feasibility study scheduled for 2026.',
    roadmapProtection: 'PBGC premium payments current; actuarial funding status monitored annually.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Annual actuarial valuation and funded status reporting.',
    roadmapParticipantExperience: '',
    createdDate: '2023-11-15',
    updatedDate: '2025-06-01',
  },
  {
    id: 'PLN-003',
    productId: 'PRD-002',
    name: 'PPO Medical Plan 2024',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    description: 'Preferred Provider Organization plan offering broad network access with no referral requirements.',
    owner: MOCK_USERS[7],
    tags: ['PPO', 'Medical', 'Active Employee', 'Broad Network'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: 'Provide comprehensive medical coverage to attract and retain talent.',
    roadmapPlanning: '2025 plan year renewal underway. Evaluating network and cost-sharing changes.',
    roadmapProtection: 'ACA compliance confirmed; non-discrimination testing completed.',
    roadmapPriceCompetitiveness: 'Total cost of care benchmarked against industry and regional comparators.',
    roadmapPerformanceMeasurement: 'Claims utilization, unit cost trends, and member satisfaction tracked quarterly.',
    roadmapParticipantExperience: 'Telemedicine integration and care navigation services enhanced.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'PLN-004',
    productId: 'PRD-002',
    name: 'HDHP / HSA Plan 2024',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2024-12-31',
    description: 'High-deductible health plan paired with an employer-seeded Health Savings Account.',
    owner: MOCK_USERS[7],
    tags: ['HDHP', 'HSA', 'Medical', 'Consumer-Driven'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: 'Offer a consumer-directed health option for cost-conscious employees.',
    roadmapPlanning: 'Evaluate IRS HSA contribution limit changes and employer seed funding strategy.',
    roadmapProtection: 'HSA custodian compliance and HDHP IRS threshold maintained.',
    roadmapPriceCompetitiveness: 'Out-of-pocket cost modeled vs. PPO at various utilization levels.',
    roadmapPerformanceMeasurement: 'HSA adoption, contribution levels, and investment election rates.',
    roadmapParticipantExperience: 'HSA mobile tools and decision support calculators deployed.',
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'PLN-005',
    productId: 'PRD-003',
    name: 'Retiree Medicare Supplement Plan',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    description: 'Group Medicare Supplement plan coordinating with Medicare Parts A and B for eligible retirees.',
    owner: MOCK_USERS[7],
    tags: ['Retiree', 'Medicare Supplement', 'Medigap'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Evaluate individual Medicare marketplace strategy as alternative to group plan.',
    roadmapProtection: 'Medicare Secondary Payer rules compliance reviewed annually.',
    roadmapPriceCompetitiveness: 'Cost compared to individual Medicare Advantage and Supplement market rates.',
    roadmapPerformanceMeasurement: '',
    roadmapParticipantExperience: '',
    createdDate: '2023-10-01',
    updatedDate: '2025-06-14',
  },
  {
    id: 'PLN-006',
    productId: 'PRD-004',
    name: 'Group Life Insurance Plan',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    description: 'Employer-paid basic life insurance at 1x annual salary plus voluntary supplemental life.',
    owner: MOCK_USERS[7],
    tags: ['Life Insurance', 'Employer-Paid', 'Voluntary Supplemental'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Review coverage adequacy and carrier contract renewal terms in 2025.',
    roadmapProtection: 'Evidence of Insurability thresholds and beneficiary designation processes current.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: '',
    roadmapParticipantExperience: 'Digital beneficiary designation and life event workflows implemented.',
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'PLN-007',
    productId: 'PRD-005',
    name: 'Short-Term Disability Plan',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    description: 'Employer-paid STD covering 60% of weekly salary for up to 26 weeks after a 7-day elimination period.',
    owner: MOCK_USERS[7],
    tags: ['STD', 'Disability', 'Income Protection'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Evaluate self-insured STD model and paid family leave integration.',
    roadmapProtection: 'State mandated disability compliance verified for applicable jurisdictions.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Claim incidence rates, duration, and return-to-work outcomes tracked.',
    roadmapParticipantExperience: '',
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'PLN-008',
    productId: 'PRD-005',
    name: 'Long-Term Disability Plan',
    status: 'Active',
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '',
    description: 'LTD plan covering 60% of monthly earnings (to $10,000/month maximum) after 180-day elimination.',
    owner: MOCK_USERS[7],
    tags: ['LTD', 'Disability', 'Income Protection'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'COLA rider and own-occupation definition review in 2025 carrier renewal.',
    roadmapProtection: 'ERISA plan document and SPD current.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Claim incidence, benefit duration, and social security offset outcomes.',
    roadmapParticipantExperience: '',
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'PLN-009',
    productId: 'PRD-006',
    name: 'Employee Assistance Program',
    status: 'Active',
    effectiveStartDate: '2024-11-01',
    effectiveEndDate: '',
    description: 'Confidential EAP offering up to 8 counseling sessions per issue, plus financial and legal consultations.',
    owner: MOCK_USERS[7],
    tags: ['EAP', 'Mental Health', 'Counseling', 'Wellbeing'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Expand digital mental health resources and crisis support line in 2025.',
    roadmapProtection: 'HIPAA confidentiality and mandatory reporting compliance verified.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Utilization rate, satisfaction scores, and issue category trends.',
    roadmapParticipantExperience: 'Mobile app for self-scheduling and anonymous access piloted.',
    createdDate: '2024-11-10',
    updatedDate: '2025-12-18',
  },
  {
    id: 'PLN-010',
    productId: 'PRD-007',
    name: 'Financial Planning Advisory Program',
    status: 'Active',
    effectiveStartDate: '2024-08-20',
    effectiveEndDate: '',
    description: 'One-on-one financial planning consultations with certified planners at no cost to employees.',
    owner: MOCK_USERS[3],
    tags: ['Financial Wellness', 'CFP', 'Planning'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Group webinar series and on-demand financial education library expansion in 2025.',
    roadmapProtection: '',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Session utilization and participant financial health scores.',
    roadmapParticipantExperience: '',
    createdDate: '2024-08-20',
    updatedDate: '2025-09-05',
  },
  {
    id: 'PLN-011',
    productId: 'PRD-008',
    name: 'Benefits Administration Platform',
    status: 'Active',
    effectiveStartDate: '2024-04-15',
    effectiveEndDate: '',
    description: 'Cloud-based benefits administration system supporting enrollment, eligibility, life events, and COBRA.',
    owner: MOCK_USERS[1],
    tags: ['BenAdmin', 'Enrollment', 'COBRA', 'Eligibility'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'API integration with HRIS and payroll system upgrade in Q2 2025.',
    roadmapProtection: 'SOC 2 Type II audit completed; data privacy impact assessment current.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Enrollment completion rate, error rate, and carrier file feed accuracy.',
    roadmapParticipantExperience: 'Mobile-first enrollment redesign delivered in 2024.',
    createdDate: '2024-04-15',
    updatedDate: '2025-10-22',
  },
  {
    id: 'PLN-012',
    productId: 'PRD-009',
    name: 'Medical & Dental Claims Processing',
    status: 'Active',
    effectiveStartDate: '2023-09-10',
    effectiveEndDate: '',
    description: 'End-to-end claims adjudication and provider payment services for medical and dental claims.',
    owner: MOCK_USERS[1],
    tags: ['Claims', 'Adjudication', 'Provider Payment', 'Medical', 'Dental'],
    vendorIds: [],
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003'],
    processAssociations: [],
    roadmapPurposeAlignment: '',
    roadmapPlanning: 'Real-time claims status API for member portal integration in 2025.',
    roadmapProtection: 'HIPAA transaction and code set compliance verified; audit controls active.',
    roadmapPriceCompetitiveness: '',
    roadmapPerformanceMeasurement: 'Auto-adjudication rate, claim processing turnaround, and error rate.',
    roadmapParticipantExperience: '',
    createdDate: '2023-09-10',
    updatedDate: '2025-11-15',
  },
];
