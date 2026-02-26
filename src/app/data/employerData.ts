import { generateId } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EmployerRelationshipType =
  | 'Affiliate'
  | 'Subsidiary'
  | 'Non-Related Entity'
  | 'Department'
  | 'Other'
  | 'Funding Entity';

export interface Employer {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
}

export interface EmployerRelationship {
  id: string;
  employerId: string;
  relatedEmployerId: string;
  relationshipType: EmployerRelationshipType;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const RELATIONSHIP_TYPE_LABELS: Record<EmployerRelationshipType, string> = {
  'Affiliate':          'Affiliate',
  'Subsidiary':         'Subsidiary',
  'Non-Related Entity': 'Non-Related Entity',
  'Department':         'Department',
  'Other':              'Other',
  'Funding Entity':     'Funding Entity',
};

export const RELATIONSHIP_TYPE_OPTIONS: EmployerRelationshipType[] = [
  'Affiliate',
  'Subsidiary',
  'Non-Related Entity',
  'Department',
  'Other',
  'Funding Entity',
];

export const RELATIONSHIP_TYPE_STYLES: Record<EmployerRelationshipType, { bg: string; color: string }> = {
  'Affiliate':          { bg: '#EAF0FB', color: '#2322F0' },
  'Subsidiary':         { bg: '#E8F5EE', color: '#1C8A45' },
  'Non-Related Entity': { bg: '#F0F2F7', color: '#6B7489' },
  'Department':         { bg: '#E0F5F5', color: '#00A3A3' },
  'Other':              { bg: '#FFF3E0', color: '#E07B00' },
  'Funding Entity':     { bg: '#F3E8FC', color: '#7B2DBF' },
};

// ─── Code generator ──────────────────────────────────────────────────────────

export function generateEmployerCode(name: string, existing: Employer[]): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4)
    .padEnd(3, 'X');
  const codes = new Set(existing.map(e => e.code));
  let n = 1;
  let candidate = `${prefix}-${String(n).padStart(3, '0')}`;
  while (codes.has(candidate)) {
    n++;
    candidate = `${prefix}-${String(n).padStart(3, '0')}`;
  }
  return candidate;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_EMPLOYERS: Employer[] = [
  {
    id: 'EMP-001',
    code: 'DMBA-001',
    name: 'DMBA',
    isActive: true,
    createdAt: '2024-01-15',
    createdBy: 'Admin',
    modifiedAt: '2025-11-02',
    modifiedBy: 'Admin',
  },
  {
    id: 'EMP-002',
    code: 'BRIG-001',
    name: 'Brigham Young University',
    isActive: true,
    createdAt: '2024-01-15',
    createdBy: 'Admin',
    modifiedAt: '2025-06-10',
    modifiedBy: 'Jane Smith',
  },
  {
    id: 'EMP-003',
    code: 'LDSE-001',
    name: 'The Church of Jesus Christ of Latter-day Saints',
    isActive: true,
    createdAt: '2024-01-15',
    createdBy: 'Admin',
    modifiedAt: '2025-09-18',
    modifiedBy: 'Admin',
  },
  {
    id: 'EMP-004',
    code: 'BYUI-001',
    name: 'BYU-Idaho',
    isActive: true,
    createdAt: '2024-03-01',
    createdBy: 'Jane Smith',
    modifiedAt: '2025-07-22',
    modifiedBy: 'Jane Smith',
  },
  {
    id: 'EMP-005',
    code: 'BYUH-001',
    name: 'BYU-Hawaii',
    isActive: true,
    createdAt: '2024-03-01',
    createdBy: 'Jane Smith',
    modifiedAt: '2025-07-22',
    modifiedBy: 'Jane Smith',
  },
  {
    id: 'EMP-006',
    code: 'ENSL-001',
    name: 'Ensign College',
    isActive: true,
    createdAt: '2024-04-10',
    createdBy: 'Admin',
    modifiedAt: '2025-08-14',
    modifiedBy: 'Admin',
  },
  {
    id: 'EMP-007',
    code: 'DESE-001',
    name: 'Deseret Management Corporation',
    isActive: false,
    createdAt: '2024-02-20',
    createdBy: 'Admin',
    modifiedAt: '2025-01-05',
    modifiedBy: 'Admin',
  },
];

const SEED_RELATIONSHIPS: EmployerRelationship[] = [
  { id: 'ERL-001', employerId: 'EMP-001', relatedEmployerId: 'EMP-002', relationshipType: 'Affiliate' },
  { id: 'ERL-002', employerId: 'EMP-001', relatedEmployerId: 'EMP-003', relationshipType: 'Funding Entity' },
  { id: 'ERL-003', employerId: 'EMP-001', relatedEmployerId: 'EMP-004', relationshipType: 'Affiliate' },
  { id: 'ERL-004', employerId: 'EMP-001', relatedEmployerId: 'EMP-005', relationshipType: 'Affiliate' },
  { id: 'ERL-005', employerId: 'EMP-002', relatedEmployerId: 'EMP-004', relationshipType: 'Affiliate' },
  { id: 'ERL-006', employerId: 'EMP-003', relatedEmployerId: 'EMP-007', relationshipType: 'Subsidiary' },
];

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const EMPLOYERS_KEY      = 'erm_employers_v1';
const RELATIONSHIPS_KEY  = 'erm_employer_relationships_v1';

function sanitizeEmployer(e: any): Employer {
  return {
    id:         e.id         ?? 'EMP-' + generateId(),
    code:       e.code       ?? '',
    name:       e.name       ?? '',
    isActive:   typeof e.isActive === 'boolean' ? e.isActive : true,
    createdAt:  e.createdAt  ?? new Date().toISOString().split('T')[0],
    createdBy:  e.createdBy  ?? 'System',
    modifiedAt: e.modifiedAt ?? new Date().toISOString().split('T')[0],
    modifiedBy: e.modifiedBy ?? 'System',
  };
}

function sanitizeRelationship(r: any): EmployerRelationship {
  return {
    id:                 r.id                 ?? 'ERL-' + generateId(),
    employerId:         r.employerId         ?? '',
    relatedEmployerId:  r.relatedEmployerId  ?? '',
    relationshipType:   r.relationshipType   ?? 'Other',
  };
}

export function loadEmployers(): Employer[] {
  try {
    const raw = localStorage.getItem(EMPLOYERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(sanitizeEmployer);
    }
  } catch { /* ignore */ }
  return SEED_EMPLOYERS;
}

export function saveEmployers(employers: Employer[]): void {
  localStorage.setItem(EMPLOYERS_KEY, JSON.stringify(employers));
}

export function loadEmployerRelationships(): EmployerRelationship[] {
  try {
    const raw = localStorage.getItem(RELATIONSHIPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(sanitizeRelationship);
    }
  } catch { /* ignore */ }
  return SEED_RELATIONSHIPS;
}

export function saveEmployerRelationships(rels: EmployerRelationship[]): void {
  localStorage.setItem(RELATIONSHIPS_KEY, JSON.stringify(rels));
}

export function getRelationshipsForEmployer(
  employerId: string,
  rels: EmployerRelationship[],
): EmployerRelationship[] {
  return rels.filter(r => r.employerId === employerId || r.relatedEmployerId === employerId);
}
