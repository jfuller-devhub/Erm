import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductType = 'Benefit' | 'Service';
export type ProductStatus = 'Active' | 'Draft' | 'Retired' | 'Sunset';

export interface RoadmapItem {
  id: string;
  name: string;
  description: string;
  owner: AppUser | null;
  startDate: string;
  endDate: string;
}

export interface ProcessAssociation {
  processId: string;
  subProcessId?: string;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: string;
  description: string;
  status: ProductStatus;
  tags: string[];
  owner: AppUser | null;
  effectiveStartDate: string;
  effectiveEndDate: string;
  processAssociations: ProcessAssociation[];
  vendorIds: string[];
  createdDate: string;
  updatedDate: string;
  // ─── Roadmap fields ──────────────────────────────────────────────────────
  roadmapPurposeAlignment: string;
  roadmapPlanning: string;
  roadmapProtection: string;
  roadmapPriceCompetitiveness: string;
  roadmapPerformanceMeasurement: string;
  roadmapParticipantExperience: string;
  // ─── Roadmap items (grid) ────────────────────────────────────────────────
  roadmapItems?: RoadmapItem[];
}

// ─── Category options ────────────────────────────────────────────────────────

export const BENEFIT_CATEGORIES = [
  'Defined Contribution Plan',
  'Defined Benefit Plan',
  'Active Employee Health Plan',
  'Retiree Health Plan',
  'Life Insurance',
  'Disability Insurance',
  'Dental Plan',
  'Vision Plan',
  'HSA / FSA',
  'Wellness Program',
  'Other Benefit',
] as const;

export const SERVICE_CATEGORIES = [
  'Mental Health Navigation',
  'Financial Planning',
  'Benefits Administration',
  'Claims Processing',
  'Member Support',
  'Enrollment Services',
  'Data Analytics',
  'Compliance Advisory',
  'Other Service',
] as const;

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_products_v1';

function sanitizeProduct(p: any): Product {
  return {
    id: p.id ?? 'PRD-' + generateId(),
    name: p.name ?? '',
    type: (['Benefit', 'Service'].includes(p.type) ? p.type : 'Benefit') as ProductType,
    category: p.category ?? '',
    description: p.description ?? '',
    status: (['Active', 'Draft', 'Retired', 'Sunset'].includes(p.status) ? p.status : 'Active') as ProductStatus,
    tags: Array.isArray(p.tags) ? p.tags : [],
    owner: p.owner ?? null,
    effectiveStartDate: p.effectiveStartDate ?? '',
    effectiveEndDate: p.effectiveEndDate ?? '',
    processAssociations: Array.isArray(p.processAssociations)
      ? p.processAssociations.map((a: any) => ({
          processId: a.processId ?? '',
          subProcessId: a.subProcessId || undefined,
        }))
      : [],
    vendorIds: Array.isArray(p.vendorIds) ? p.vendorIds : [],
    createdDate: p.createdDate ?? '',
    updatedDate: p.updatedDate ?? '',
    roadmapPurposeAlignment:     p.roadmapPurposeAlignment     ?? '',
    roadmapPlanning:             p.roadmapPlanning             ?? '',
    roadmapProtection:           p.roadmapProtection           ?? '',
    roadmapPriceCompetitiveness: p.roadmapPriceCompetitiveness ?? '',
    roadmapPerformanceMeasurement: p.roadmapPerformanceMeasurement ?? '',
    roadmapParticipantExperience: p.roadmapParticipantExperience ?? '',
    roadmapItems: Array.isArray(p.roadmapItems)
      ? p.roadmapItems.map((item: any) => ({
          id: item.id ?? generateId(),
          name: item.name ?? '',
          description: item.description ?? '',
          owner: item.owner ?? null,
          startDate: item.startDate ?? '',
          endDate: item.endDate ?? '',
        }))
      : [],
  };
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeProduct);
      }
    }
  } catch {
    // fall through to seed data
  }
  const seed = SEED_PRODUCTS;
  saveProducts(seed);
  return seed;
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const today = '2026-02-19';

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    name: '401(k) Savings Plan',
    type: 'Benefit',
    category: 'Defined Contribution Plan',
    description: 'Company-sponsored 401(k) defined contribution retirement savings plan with employer match up to 6% of salary. Includes Roth and traditional pre-tax options.',
    status: 'Active',
    tags: ['Retirement', 'Tax-Advantaged', 'Employer Match'],
    owner: MOCK_USERS[3],  // Alan Foster - Finance
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2027-12-31',
    processAssociations: [
      { processId: 'PRC-001' },
    ],
    vendorIds: [],
    createdDate: '2023-11-15',
    updatedDate: '2025-12-10',
    roadmapPurposeAlignment: 'Align with company retirement goals',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive match rates',
    roadmapPerformanceMeasurement: 'Track participation and savings growth',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-002',
    name: 'Pension Plan',
    type: 'Benefit',
    category: 'Defined Benefit Plan',
    description: 'Traditional defined benefit pension plan for employees hired before Jan 2015. Frozen to new entrants. Benefits based on years of service and final average pay.',
    status: 'Sunset',
    tags: ['Retirement', 'Legacy', 'Frozen'],
    owner: MOCK_USERS[3],  // Alan Foster
    effectiveStartDate: '2000-01-01',
    effectiveEndDate: '2030-12-31',
    processAssociations: [],
    vendorIds: [],
    createdDate: '2020-06-01',
    updatedDate: '2025-08-22',
    roadmapPurposeAlignment: 'Support legacy employees',
    roadmapPlanning: 'Plan for sunset and transition',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Maintain current benefits',
    roadmapPerformanceMeasurement: 'Track remaining participants',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-003',
    name: 'Medical PPO Plan',
    type: 'Benefit',
    category: 'Active Employee Health Plan',
    description: 'Preferred Provider Organization health plan for active employees and dependents. Includes in-network and out-of-network coverage with annual deductible and out-of-pocket max.',
    status: 'Active',
    tags: ['Health', 'PPO', 'Medical'],
    owner: MOCK_USERS[7],  // Monica Shaw - HR
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: '2025-12-31',
    processAssociations: [
      { processId: 'PRC-002' },
    ],
    vendorIds: [],
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
    roadmapPurposeAlignment: 'Provide comprehensive health coverage',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ACA',
    roadmapPriceCompetitiveness: 'Offer competitive premiums',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-004',
    name: 'Medical HDHP Plan',
    type: 'Benefit',
    category: 'Active Employee Health Plan',
    description: 'High-deductible health plan paired with Health Savings Account (HSA). Lower premiums with higher deductibles, includes preventive care at no cost.',
    status: 'Active',
    tags: ['Health', 'HDHP', 'HSA-Eligible'],
    owner: MOCK_USERS[7],  // Monica Shaw
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: '2025-12-31',
    processAssociations: [
      { processId: 'PRC-002' },
    ],
    vendorIds: [],
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
    roadmapPurposeAlignment: 'Promote health savings',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ACA',
    roadmapPriceCompetitiveness: 'Offer competitive premiums',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-005',
    name: 'Retiree Medical Plan',
    type: 'Benefit',
    category: 'Retiree Health Plan',
    description: 'Post-retirement medical coverage for eligible retirees who meet age and service requirements. Provides supplemental coverage alongside Medicare.',
    status: 'Active',
    tags: ['Retiree', 'Health', 'Medicare Supplement'],
    owner: MOCK_USERS[7],
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2026-12-31',
    processAssociations: [],
    vendorIds: [],
    createdDate: '2023-10-01',
    updatedDate: '2025-06-14',
    roadmapPurposeAlignment: 'Support retiree health needs',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ACA',
    roadmapPriceCompetitiveness: 'Offer competitive premiums',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-006',
    name: 'Group Life Insurance',
    type: 'Benefit',
    category: 'Life Insurance',
    description: 'Employer-paid basic group term life insurance equal to 1x annual salary. Supplemental voluntary life insurance available at employee cost.',
    status: 'Active',
    tags: ['Life Insurance', 'Employer-Paid', 'Voluntary'],
    owner: MOCK_USERS[7],
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: '2025-12-31',
    processAssociations: [],
    vendorIds: [],
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
    roadmapPurposeAlignment: 'Provide life insurance coverage',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive premiums',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-007',
    name: 'Mental Health Navigation Program',
    type: 'Service',
    category: 'Mental Health Navigation',
    description: 'Concierge-style mental health navigation service connecting employees and dependents with licensed therapists, psychiatrists, and treatment programs. Includes crisis support hotline and digital CBT tools.',
    status: 'Active',
    tags: ['Mental Health', 'EAP', 'Navigation', 'Digital'],
    owner: MOCK_USERS[7],
    effectiveStartDate: '2025-03-01',
    effectiveEndDate: '2027-02-28',
    processAssociations: [
      { processId: 'PRC-001' },
      { processId: 'PRC-002', subProcessId: 'SUB-002A' },
    ],
    vendorIds: [],
    createdDate: '2024-11-10',
    updatedDate: '2025-12-18',
    roadmapPurposeAlignment: 'Support mental health needs',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ADA',
    roadmapPriceCompetitiveness: 'Offer competitive services',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-008',
    name: 'Financial Planning Advisory',
    type: 'Service',
    category: 'Financial Planning',
    description: 'One-on-one financial planning sessions with certified financial planners. Covers retirement readiness, debt management, college savings, and estate planning basics.',
    status: 'Active',
    tags: ['Financial Wellness', 'Retirement Planning', 'Advisory'],
    owner: MOCK_USERS[3],
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: '2026-12-31',
    processAssociations: [],
    vendorIds: [],
    createdDate: '2024-08-20',
    updatedDate: '2025-09-05',
    roadmapPurposeAlignment: 'Support financial wellness',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive services',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-009',
    name: 'Benefits Administration Platform',
    type: 'Service',
    category: 'Benefits Administration',
    description: 'Third-party benefits administration and enrollment platform providing self-service enrollment, life event processing, COBRA administration, and eligibility management.',
    status: 'Active',
    tags: ['BenAdmin', 'Enrollment', 'COBRA', 'Platform'],
    owner: MOCK_USERS[1],  // Marcus Johnson - Operations
    effectiveStartDate: '2024-07-01',
    effectiveEndDate: '2027-06-30',
    processAssociations: [
      { processId: 'PRC-002' },
      { processId: 'PRC-003' },
    ],
    vendorIds: [],
    createdDate: '2024-04-15',
    updatedDate: '2025-10-22',
    roadmapPurposeAlignment: 'Streamline benefits administration',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive services',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-010',
    name: 'Claims Processing Service',
    type: 'Service',
    category: 'Claims Processing',
    description: 'End-to-end medical and dental claims adjudication service including auto-adjudication, manual review, appeals handling, and provider payment processing.',
    status: 'Active',
    tags: ['Claims', 'Adjudication', 'Provider Payments'],
    owner: MOCK_USERS[1],
    effectiveStartDate: '2024-01-01',
    effectiveEndDate: '2026-12-31',
    processAssociations: [
      { processId: 'PRC-003' },
    ],
    vendorIds: [],
    createdDate: '2023-09-10',
    updatedDate: '2025-11-15',
    roadmapPurposeAlignment: 'Ensure accurate claims processing',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive services',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-011',
    name: 'Short-Term Disability',
    type: 'Benefit',
    category: 'Disability Insurance',
    description: 'Employer-paid short-term disability coverage providing 60% of pre-disability earnings for up to 26 weeks. Includes pregnancy-related disability.',
    status: 'Active',
    tags: ['Disability', 'STD', 'Income Protection'],
    owner: MOCK_USERS[7],
    effectiveStartDate: '2025-01-01',
    effectiveEndDate: '2025-12-31',
    processAssociations: [],
    vendorIds: [],
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
    roadmapPurposeAlignment: 'Provide income protection',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive premiums',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
  {
    id: 'PRD-012',
    name: 'Compliance Advisory Service',
    type: 'Service',
    category: 'Compliance Advisory',
    description: 'External compliance consulting service providing ERISA, ACA, HIPAA, and DOL regulatory guidance, plan document review, and annual compliance calendar management.',
    status: 'Draft',
    tags: ['Compliance', 'ERISA', 'ACA', 'Regulatory'],
    owner: MOCK_USERS[11],  // Sarah Okonkwo - Compliance
    effectiveStartDate: '',
    effectiveEndDate: '',
    processAssociations: [],
    vendorIds: [],
    createdDate: today,
    updatedDate: today,
    roadmapPurposeAlignment: 'Ensure regulatory compliance',
    roadmapPlanning: 'Review and update plan annually',
    roadmapProtection: 'Ensure compliance with ERISA',
    roadmapPriceCompetitiveness: 'Offer competitive services',
    roadmapPerformanceMeasurement: 'Track utilization and satisfaction',
    roadmapParticipantExperience: '',
  },
];