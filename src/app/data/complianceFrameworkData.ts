import { generateId } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type FrameworkStatus = 'active' | 'sunset' | 'draft';

export const FRAMEWORK_STATUSES: FrameworkStatus[] = ['active', 'sunset', 'draft'];

// ─── Display label helpers ───────────────────────────────────────────────────

export const FRAMEWORK_STATUS_LABELS: Record<FrameworkStatus, string> = {
  active: 'Active',
  sunset: 'Sunset',
  draft: 'Draft',
};

// ─── Badge styling ───────────────────────────────────────────────────────────

export const FRAMEWORK_STATUS_STYLES: Record<FrameworkStatus, { background: string; color: string }> = {
  active:  { background: '#E8F5EE', color: '#1C8A45' },
  sunset:  { background: '#FFF3E0', color: '#E07B00' },
  draft:   { background: '#F0F0F0', color: '#6B7489' },
};

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  governingBody: string;
  status: FrameworkStatus;
  certificationRequired: boolean;
  effectiveDate: string;
  nextAssessmentDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_compliance_frameworks_v1';

function sanitizeFramework(f: any): ComplianceFramework {
  return {
    id: f.id ?? 'FWK-' + generateId(),
    name: f.name ?? '',
    version: f.version ?? '',
    governingBody: f.governingBody ?? '',
    status: FRAMEWORK_STATUSES.includes(f.status) ? f.status : 'draft',
    certificationRequired: typeof f.certificationRequired === 'boolean' ? f.certificationRequired : false,
    effectiveDate: f.effectiveDate ?? '',
    nextAssessmentDate: f.nextAssessmentDate ?? '',
    description: f.description ?? '',
    createdAt: f.createdAt ?? '',
    updatedAt: f.updatedAt ?? '',
  };
}

export function loadFrameworks(): ComplianceFramework[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeFramework);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_FRAMEWORKS;
  saveFrameworks(seed);
  return seed;
}

export function saveFrameworks(frameworks: ComplianceFramework[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frameworks));
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'FWK-001',
    name: 'HITRUST CSF',
    version: 'v11.3',
    governingBody: 'HITRUST Alliance',
    status: 'active',
    certificationRequired: true,
    effectiveDate: '2024-06-01',
    nextAssessmentDate: '2026-06-15',
    description: 'The HITRUST Common Security Framework (CSF) is a certifiable framework that harmonizes requirements from ISO 27001, NIST, PCI DSS, HIPAA, and other standards. It uses a maturity-based scoring model (1-5 PRISMA scale) and implementation levels (1-3) based on organizational risk factors.',
    createdAt: '2024-06-01',
    updatedAt: '2026-01-15',
  },
  {
    id: 'FWK-002',
    name: 'ISO 27001',
    version: '2022',
    governingBody: 'ISO/IEC',
    status: 'active',
    certificationRequired: true,
    effectiveDate: '2023-01-15',
    nextAssessmentDate: '2026-09-01',
    description: 'ISO/IEC 27001:2022 specifies requirements for establishing, implementing, maintaining, and continually improving an information security management system (ISMS). Annex A provides a reference set of 93 controls organized into 4 themes: Organizational, People, Physical, and Technological.',
    createdAt: '2023-01-15',
    updatedAt: '2025-11-20',
  },
  {
    id: 'FWK-003',
    name: 'SOC 2 Type II',
    version: '2017',
    governingBody: 'AICPA',
    status: 'active',
    certificationRequired: false,
    effectiveDate: '2023-04-01',
    nextAssessmentDate: '2026-04-01',
    description: 'SOC 2 Type II evaluates the design and operating effectiveness of controls relevant to the Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy. Type II covers a defined period (typically 12 months) and requires an independent auditor attestation.',
    createdAt: '2023-04-01',
    updatedAt: '2025-10-01',
  },
  {
    id: 'FWK-004',
    name: 'NIST CSF',
    version: '2.0',
    governingBody: 'NIST',
    status: 'active',
    certificationRequired: false,
    effectiveDate: '2024-02-26',
    nextAssessmentDate: '2026-08-01',
    description: 'The NIST Cybersecurity Framework 2.0 provides a taxonomy of cybersecurity outcomes organized under 6 Functions: Govern, Identify, Protect, Detect, Respond, and Recover. It is voluntary and widely used across sectors for risk-based cybersecurity management.',
    createdAt: '2024-02-26',
    updatedAt: '2025-12-10',
  },
];
