import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductType = 'Benefit' | 'Service';
export type ProductStatus = 'Active' | 'Draft' | 'Retired' | 'Sunset';

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  category: string;
  description: string;
  status: ProductStatus;
  tags: string[];
  owner: AppUser | null;
  departmentIds: string[];
  processIds: string[];
  subProcessIds: string[];
  createdDate: string;
  updatedDate: string;
}

// ─── Category options ────────────────────────────────────────────────────────

export const BENEFIT_CATEGORIES = [
  'Retirement',
  'Health',
  'Life Insurance',
  'Disability',
  'Dental & Vision',
  'Supplemental Health',
  'Retiree Benefits',
  'Other Benefit',
] as const;

export const SERVICE_CATEGORIES = [
  'Mental Health & Wellness',
  'Financial Wellness',
  'Benefits Administration',
  'Claims & Adjudication',
  'Compliance & Advisory',
  'Member Support',
  'Data & Analytics',
  'Other Service',
] as const;

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_products_v3';

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
    departmentIds: Array.isArray(p.departmentIds) ? p.departmentIds : [],
    processIds:    Array.isArray(p.processIds)    ? p.processIds    : [],
    subProcessIds: Array.isArray(p.subProcessIds) ? p.subProcessIds : [],
    createdDate: p.createdDate ?? '',
    updatedDate: p.updatedDate ?? '',
  };
}

export function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitizeProduct);
    }
  } catch { /* fall through */ }
  const seed = SEED_PRODUCTS;
  saveProducts(seed);
  return seed;
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// ─── Seed data ───────────────────────────────────────────────────────────────

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'PRD-001',
    name: 'Retirement',
    type: 'Benefit',
    category: 'Retirement',
    description: 'Retirement savings and income programs including defined contribution plans and legacy defined benefit pension coverage.',
    status: 'Active',
    tags: ['Retirement', 'DC', 'DB'],
    owner: MOCK_USERS[3],
    createdDate: '2023-11-15',
    updatedDate: '2025-12-10',
  },
  {
    id: 'PRD-002',
    name: 'Active Employee Medical',
    type: 'Benefit',
    category: 'Health',
    description: 'Medical health plan options for active employees and their eligible dependents, including PPO and HDHP/HSA-eligible plan designs.',
    status: 'Active',
    tags: ['Health', 'Medical', 'Active Employee'],
    owner: MOCK_USERS[7],
    createdDate: '2024-09-15',
    updatedDate: '2025-11-30',
  },
  {
    id: 'PRD-003',
    name: 'Retiree Medical',
    type: 'Benefit',
    category: 'Retiree Benefits',
    description: 'Post-retirement medical coverage for eligible retirees meeting age and service thresholds. Coordinates with Medicare.',
    status: 'Active',
    tags: ['Retiree', 'Health', 'Medicare Supplement'],
    owner: MOCK_USERS[7],
    createdDate: '2023-10-01',
    updatedDate: '2025-06-14',
  },
  {
    id: 'PRD-004',
    name: 'Life Insurance',
    type: 'Benefit',
    category: 'Life Insurance',
    description: 'Basic employer-paid group life insurance plus voluntary supplemental life coverage for employees and dependents.',
    status: 'Active',
    tags: ['Life Insurance', 'Employer-Paid', 'Voluntary'],
    owner: MOCK_USERS[7],
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'PRD-005',
    name: 'Disability',
    type: 'Benefit',
    category: 'Disability',
    description: 'Short-term and long-term disability income replacement programs protecting employees during health-related absences.',
    status: 'Active',
    tags: ['Disability', 'STD', 'LTD', 'Income Protection'],
    owner: MOCK_USERS[7],
    createdDate: '2024-09-15',
    updatedDate: '2025-01-02',
  },
  {
    id: 'PRD-006',
    name: 'Mental Health & Wellness',
    type: 'Service',
    category: 'Mental Health & Wellness',
    description: 'Behavioral health, mental health navigation, and employee assistance programs supporting employee and dependent wellbeing.',
    status: 'Active',
    tags: ['Mental Health', 'EAP', 'Wellness'],
    owner: MOCK_USERS[7],
    createdDate: '2024-11-10',
    updatedDate: '2025-12-18',
  },
  {
    id: 'PRD-007',
    name: 'Financial Wellness',
    type: 'Service',
    category: 'Financial Wellness',
    description: 'Financial planning advisory, education, and tools to support employee financial health across career life stages.',
    status: 'Active',
    tags: ['Financial Wellness', 'Planning', 'Advisory'],
    owner: MOCK_USERS[3],
    createdDate: '2024-08-20',
    updatedDate: '2025-09-05',
  },
  {
    id: 'PRD-008',
    name: 'Benefits Administration',
    type: 'Service',
    category: 'Benefits Administration',
    description: 'Technology and operational services supporting enrollment, eligibility management, life events, and COBRA administration.',
    status: 'Active',
    tags: ['BenAdmin', 'Enrollment', 'COBRA'],
    owner: MOCK_USERS[1],
    createdDate: '2024-04-15',
    updatedDate: '2025-10-22',
  },
  {
    id: 'PRD-009',
    name: 'Claims & Adjudication',
    type: 'Service',
    category: 'Claims & Adjudication',
    description: 'Medical and dental claims processing, adjudication, and provider payment services.',
    status: 'Active',
    tags: ['Claims', 'Adjudication', 'Provider Payments'],
    owner: MOCK_USERS[1],
    createdDate: '2023-09-10',
    updatedDate: '2025-11-15',
  },
  {
    id: 'PRD-010',
    name: 'Compliance & Advisory',
    type: 'Service',
    category: 'Compliance & Advisory',
    description: 'External regulatory compliance consulting and advisory services covering ERISA, ACA, HIPAA, and DOL requirements.',
    status: 'Draft',
    tags: ['Compliance', 'ERISA', 'ACA', 'Regulatory'],
    owner: MOCK_USERS[11],
    createdDate: '2026-02-19',
    updatedDate: '2026-02-19',
  },
];
