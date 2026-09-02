import { generateId } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PersonaStatus = 'Active' | 'Draft' | 'Inactive';

export interface PersonaAttribute {
  id: string;
  label: string;
  value: string;
}

export interface Persona {
  id: string;
  name: string;
  category: string;
  status: PersonaStatus;
  description: string;
  entityIds: string[];
  productIds: string[];
  attributes: PersonaAttribute[];
  tags: string[];
  createdDate: string;
  updatedDate: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const PERSONA_CATEGORIES = [
  'Active Employee',
  'Retiree',
  'Former Employee',
  'Missionary',
  'Dependent',
  'Surviving Spouse',
  'Other',
] as const;

export type PersonaCategory = (typeof PERSONA_CATEGORIES)[number];

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_personas_v1';

function sanitizeAttribute(a: any): PersonaAttribute {
  return {
    id:    a.id    ?? 'ATR-' + generateId(),
    label: a.label ?? '',
    value: a.value ?? '',
  };
}

function sanitizePersona(p: any): Persona {
  return {
    id:          p.id          ?? 'PER-' + generateId(),
    name:        p.name        ?? '',
    category:    p.category    ?? '',
    status:      (['Active', 'Draft', 'Inactive'].includes(p.status) ? p.status : 'Draft') as PersonaStatus,
    description: p.description ?? '',
    entityIds:   Array.isArray(p.entityIds)   ? p.entityIds   : [],
    productIds:  Array.isArray(p.productIds)  ? p.productIds  : [],
    attributes:  Array.isArray(p.attributes)  ? p.attributes.map(sanitizeAttribute) : [],
    tags:        Array.isArray(p.tags)        ? p.tags        : [],
    createdDate: p.createdDate ?? '',
    updatedDate: p.updatedDate ?? '',
  };
}

export function loadPersonas(): Persona[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitizePersona);
    }
  } catch { /* fall through */ }
  const seed = SEED_PERSONAS;
  savePersonas(seed);
  return seed;
}

export function savePersonas(personas: Persona[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
}

export function createPersona(data: Omit<Persona, 'id' | 'createdDate' | 'updatedDate'>): Persona {
  const today = new Date().toISOString().split('T')[0];
  return { ...data, id: 'PER-' + generateId(), createdDate: today, updatedDate: today };
}

export function updatePersona(existing: Persona, changes: Partial<Persona>): Persona {
  const today = new Date().toISOString().split('T')[0];
  return { ...existing, ...changes, updatedDate: today };
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const SEED_PERSONAS: Persona[] = [
  {
    id: 'PER-001',
    name: 'Active Participant',
    category: 'Active Employee',
    status: 'Active',
    description: 'Full-time or part-time employee currently enrolled in benefits and actively working for an eligible employer. The primary persona the benefit program is designed around.',
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    productIds: ['PRD-001', 'PRD-002', 'PRD-004', 'PRD-005', 'PRD-006', 'PRD-007'],
    tags: ['Core', 'Active', 'Enrollment'],
    attributes: [
      { id: 'A001', label: 'Age Range',           value: '22–64' },
      { id: 'A002', label: 'Enrollment Window',   value: 'Annual Open Enrollment + Qualifying Life Events' },
      { id: 'A003', label: 'Coverage Start',      value: 'Date of hire after eligibility waiting period' },
      { id: 'A004', label: 'Primary Touchpoint',  value: 'HR portal, benefits guide, open enrollment materials' },
      { id: 'A005', label: 'Key Needs',           value: 'Medical, dental/vision, life insurance, disability, retirement savings' },
      { id: 'A006', label: 'Communication Style', value: 'Digital-first; email, portal notifications, mobile app' },
    ],
    createdDate: '2024-01-15',
    updatedDate: '2025-11-02',
  },
  {
    id: 'PER-002',
    name: 'Retiree Participant',
    category: 'Retiree',
    status: 'Active',
    description: 'Former employee who has retired and is eligible for retiree medical coverage and/or receiving pension or retirement income. Coverage needs shift significantly post-retirement.',
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003'],
    productIds: ['PRD-001', 'PRD-003'],
    tags: ['Retiree', 'Medicare', 'Pension'],
    attributes: [
      { id: 'A007', label: 'Age Range',             value: '55–85+' },
      { id: 'A008', label: 'Medicare Coordination', value: 'Medicare-primary at age 65; plan becomes secondary' },
      { id: 'A009', label: 'Eligibility Threshold', value: 'Age + service requirements vary by employer group' },
      { id: 'A010', label: 'Key Needs',             value: 'Retiree medical, Medicare supplement, prescription coverage, pension income' },
      { id: 'A011', label: 'Primary Touchpoint',    value: 'Member services phone line, mailed communications, retiree portal' },
      { id: 'A012', label: 'Communication Style',   value: 'Print and phone preferred; digital adoption growing' },
    ],
    createdDate: '2024-01-15',
    updatedDate: '2025-09-18',
  },
  {
    id: 'PER-003',
    name: 'Terminated Participant',
    category: 'Former Employee',
    status: 'Active',
    description: 'Employee who has left employment and may have continuation coverage rights (COBRA) or vested retirement benefits. Requires clear offboarding and transition communications.',
    entityIds: ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004', 'EMP-005', 'EMP-006'],
    productIds: ['PRD-001', 'PRD-008'],
    tags: ['COBRA', 'Terminated', 'Transition'],
    attributes: [
      { id: 'A013', label: 'COBRA Eligibility',   value: 'Up to 18 months continuation coverage after qualifying event' },
      { id: 'A014', label: 'Vesting Status',      value: 'Retirement vesting varies by plan and years of service' },
      { id: 'A015', label: 'Election Window',     value: '60 days from qualifying event to elect COBRA' },
      { id: 'A016', label: 'Key Needs',           value: 'Benefit transition guidance, COBRA election support, retirement rollover options' },
      { id: 'A017', label: 'Primary Touchpoint',  value: 'HR offboarding materials, COBRA administrator mailings' },
      { id: 'A018', label: 'Risk',                value: 'Coverage gap if COBRA not elected; communication timing is critical' },
    ],
    createdDate: '2024-03-01',
    updatedDate: '2025-07-22',
  },
  {
    id: 'PER-004',
    name: 'Young Missionary',
    category: 'Missionary',
    status: 'Active',
    description: 'Young adults ages 18–25 serving a full-time mission, typically 18–24 months. May be covered under parent\'s plan or a dedicated mission health plan. Primarily in-the-field with limited administrative access.',
    entityIds: ['EMP-001', 'EMP-003'],
    productIds: ['PRD-002'],
    tags: ['Missionary', 'International', 'Youth'],
    attributes: [
      { id: 'A019', label: 'Age Range',         value: '18–25' },
      { id: 'A020', label: 'Mission Duration',  value: '18–24 months (sisters: 18 months; elders: 24 months)' },
      { id: 'A021', label: 'Service Location',  value: 'Domestic or international assignments' },
      { id: 'A022', label: 'Coverage Type',     value: 'Mission health plan; may remain on parent\'s plan if under age 26' },
      { id: 'A023', label: 'Key Needs',         value: 'Emergency medical, evacuation benefit, mental health support' },
      { id: 'A024', label: 'Primary Touchpoint', value: 'Mission president, family proxy for administrative matters' },
      { id: 'A025', label: 'Special Consideration', value: 'Limited direct access; family or church leadership acts as intermediary' },
    ],
    createdDate: '2024-04-10',
    updatedDate: '2025-08-14',
  },
  {
    id: 'PER-005',
    name: 'Senior Missionary',
    category: 'Missionary',
    status: 'Active',
    description: 'Retired or near-retirement couples serving a full-time mission, typically 6–23 months. Greater healthcare complexity due to age-related conditions; may be Medicare-eligible.',
    entityIds: ['EMP-001', 'EMP-003'],
    productIds: ['PRD-002', 'PRD-003'],
    tags: ['Missionary', 'Senior', 'Medicare', 'International'],
    attributes: [
      { id: 'A026', label: 'Age Range',              value: '50–75' },
      { id: 'A027', label: 'Mission Duration',        value: '6–23 months; varies by calling and physical capacity' },
      { id: 'A028', label: 'Medicare Status',         value: 'Many are Medicare-eligible; coordination with mission coverage required' },
      { id: 'A029', label: 'Key Needs',               value: 'Chronic condition management, prescription drug coverage abroad, emergency evacuation' },
      { id: 'A030', label: 'Service Location',        value: 'Domestic or international; often higher-service or administrative roles' },
      { id: 'A031', label: 'Primary Touchpoint',      value: 'Church benefits office, mission president, spouse as proxy' },
      { id: 'A032', label: 'Special Consideration',   value: 'Pre-mission health clearance required; existing conditions must be stable' },
    ],
    createdDate: '2024-04-10',
    updatedDate: '2025-08-14',
  },
];
