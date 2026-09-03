import { generateId, MOCK_USERS } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DeptType   = 'Division' | 'Department' | 'Team' | 'Unit';
export type DeptStatus = 'Active' | 'Inactive';

export interface Department {
  id: string;
  name: string;
  code: string;
  type: DeptType;
  description: string;
  status: DeptStatus;
  leadId: string;             // AppUser.id — '' if unassigned
  parentId: string;           // '' = top-level root
  reportingStartDate: string; // YYYY-MM-DD — '' if no parent
  reportingEndDate: string;   // YYYY-MM-DD — '' = ongoing
  createdDate: string;
  updatedDate: string;
}

// ─── Tree helpers ────────────────────────────────────────────────────────────

export function getDeptRoots(items: Department[]): Department[] {
  return items.filter(d => d.parentId === '');
}

export function getDeptChildren(items: Department[], parentId: string): Department[] {
  return items.filter(d => d.parentId === parentId);
}

export function getDeptAncestors(items: Department[], id: string): Department[] {
  const ancestors: Department[] = [];
  let current = items.find(d => d.id === id);
  while (current && current.parentId !== '') {
    const parent = items.find(d => d.id === current!.parentId);
    if (!parent) break;
    ancestors.unshift(parent);
    current = parent;
  }
  return ancestors;
}

export function getDeptDescendants(items: Department[], id: string): string[] {
  const result: string[] = [];
  const queue = getDeptChildren(items, id).map(d => d.id);
  while (queue.length > 0) {
    const childId = queue.shift()!;
    result.push(childId);
    getDeptChildren(items, childId).forEach(d => queue.push(d.id));
  }
  return result;
}

// ─── LocalStorage ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_departments_v1';

function sanitizeDepartment(d: any): Department {
  return {
    id:                 d.id                 ?? 'DEPT-' + generateId(),
    name:               d.name               ?? '',
    code:               d.code               ?? '',
    type:               (['Division','Department','Team','Unit'].includes(d.type) ? d.type : 'Department') as DeptType,
    description:        d.description        ?? '',
    status:             (['Active','Inactive'].includes(d.status) ? d.status : 'Active') as DeptStatus,
    leadId:             d.leadId             ?? '',
    parentId:           d.parentId           ?? '',
    reportingStartDate: d.reportingStartDate ?? '',
    reportingEndDate:   d.reportingEndDate   ?? '',
    createdDate:        d.createdDate        ?? '',
    updatedDate:        d.updatedDate        ?? '',
  };
}

export function loadDepartments(): Department[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitizeDepartment);
    }
  } catch { /* fall through */ }
  const seed = SEED_DEPARTMENTS.map(sanitizeDepartment);
  saveDepartments(seed);
  return seed;
}

export function saveDepartments(items: Department[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function createDepartment(data: Omit<Department, 'id' | 'createdDate' | 'updatedDate'>): Department {
  const today = new Date().toISOString().split('T')[0];
  return { ...data, id: 'DEPT-' + generateId(), createdDate: today, updatedDate: today };
}

export function updateDepartment(existing: Department, changes: Partial<Department>): Department {
  return { ...existing, ...changes, updatedDate: new Date().toISOString().split('T')[0] };
}

// ─── Seed data ───────────────────────────────────────────────────────────────

export const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'DEPT-001', name: 'Benefits & Retirement', code: 'BNR', type: 'Division',
    description: 'Oversees all benefit programs and retirement services for the organization and affiliated entities.',
    status: 'Active', leadId: MOCK_USERS[3].id, parentId: '', reportingStartDate: '', reportingEndDate: '',
    createdDate: '2023-01-01', updatedDate: '2025-06-01',
  },
  {
    id: 'DEPT-002', name: 'Technology', code: 'TECH', type: 'Division',
    description: 'Responsible for all technology infrastructure, application development, and data management.',
    status: 'Active', leadId: MOCK_USERS[0].id, parentId: '', reportingStartDate: '', reportingEndDate: '',
    createdDate: '2023-01-01', updatedDate: '2025-08-15',
  },
  {
    id: 'DEPT-003', name: 'Retirement Services', code: 'RET', type: 'Department',
    description: 'Manages defined contribution and defined benefit retirement plan operations and compliance.',
    status: 'Active', leadId: MOCK_USERS[3].id, parentId: 'DEPT-001', reportingStartDate: '2023-01-01', reportingEndDate: '',
    createdDate: '2023-01-01', updatedDate: '2025-04-10',
  },
  {
    id: 'DEPT-004', name: 'Health & Welfare', code: 'HW', type: 'Department',
    description: 'Administers medical, dental, vision, life insurance, and disability benefit programs.',
    status: 'Active', leadId: MOCK_USERS[7].id, parentId: 'DEPT-001', reportingStartDate: '2023-01-01', reportingEndDate: '',
    createdDate: '2023-01-01', updatedDate: '2025-09-22',
  },
  {
    id: 'DEPT-005', name: 'Member Services', code: 'MBRSVC', type: 'Department',
    description: 'Provides direct support to plan members, handling inquiries, enrollment, and life events.',
    status: 'Active', leadId: MOCK_USERS[1].id, parentId: 'DEPT-001', reportingStartDate: '2023-01-01', reportingEndDate: '',
    createdDate: '2023-01-01', updatedDate: '2025-11-05',
  },
  {
    id: 'DEPT-006', name: 'Application Development', code: 'APPDEV', type: 'Department',
    description: 'Builds and maintains internal systems, member portals, and integration platforms.',
    status: 'Active', leadId: MOCK_USERS[0].id, parentId: 'DEPT-002', reportingStartDate: '2023-01-01', reportingEndDate: '',
    createdDate: '2023-01-01', updatedDate: '2025-07-30',
  },
  {
    id: 'DEPT-007', name: 'DC Plans Team', code: 'DCT', type: 'Team',
    description: 'Handles day-to-day administration of defined contribution plan accounts and contribution processing.',
    status: 'Active', leadId: MOCK_USERS[2].id, parentId: 'DEPT-003', reportingStartDate: '2023-06-01', reportingEndDate: '',
    createdDate: '2023-06-01', updatedDate: '2025-03-14',
  },
  {
    id: 'DEPT-008', name: 'Claims & Adjudication Team', code: 'CLMS', type: 'Team',
    description: 'Processes medical, dental, and disability claims; manages adjudication workflows and provider payments.',
    status: 'Active', leadId: MOCK_USERS[1].id, parentId: 'DEPT-005', reportingStartDate: '2023-06-01', reportingEndDate: '',
    createdDate: '2023-06-01', updatedDate: '2025-10-18',
  },
];
