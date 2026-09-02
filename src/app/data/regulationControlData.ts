import type { AppUser } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CoverageLevel = 'full' | 'partial' | 'none';
export type ImplementationStatus = 'not-started' | 'in-progress' | 'implemented' | 'tested' | 'verified';

export interface RegulationControlMapping {
  regulationId: string;
  controlId: string;

  // Mapping details
  requirementText: string;           // Specific requirement being addressed
  coverageLevel: CoverageLevel;
  isPrimary: boolean;                // Primary control for this requirement

  // Status
  implementationStatus: ImplementationStatus;
  evidenceProvided: boolean;

  // Notes
  mappingNotes: string;
  gapDescription: string | null;

  // Metadata
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Labels & Styles ─────────────────────────────────────────────────────────

export const COVERAGE_LEVEL_LABELS: Record<CoverageLevel, string> = {
  full: 'Full Coverage',
  partial: 'Partial Coverage',
  none: 'No Coverage',
};

export const COVERAGE_LEVEL_STYLES: Record<CoverageLevel, { background: string; color: string }> = {
  full: { background: '#E8F5EE', color: '#1C8A45' },
  partial: { background: '#FFF9C4', color: '#F57F17' },
  none: { background: '#FFEBEE', color: '#C62828' },
};

export const IMPLEMENTATION_STATUS_LABELS: Record<ImplementationStatus, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  implemented: 'Implemented',
  tested: 'Tested',
  verified: 'Verified',
};

export const IMPLEMENTATION_STATUS_STYLES: Record<ImplementationStatus, { background: string; color: string }> = {
  'not-started': { background: '#F5F5F5', color: '#616161' },
  'in-progress': { background: '#FFF3E0', color: '#E65100' },
  implemented: { background: '#E3F2FD', color: '#1565C0' },
  tested: { background: '#F3E5F5', color: '#6A1B9A' },
  verified: { background: '#E8F5EE', color: '#1C8A45' },
};

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_regulation_controls_v1';

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadRegulationControlMappings(): RegulationControlMapping[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = getSeedMappings();
    saveRegulationControlMappings(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveRegulationControlMappings(mappings: RegulationControlMapping[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
}

export function createMapping(
  mappings: RegulationControlMapping[],
  data: Omit<RegulationControlMapping, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): RegulationControlMapping {
  const today = new Date().toISOString().split('T')[0];

  const newMapping: RegulationControlMapping = {
    ...data,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newMapping;
}

export function updateMapping(
  mappings: RegulationControlMapping[],
  regulationId: string,
  controlId: string,
  updates: Partial<Omit<RegulationControlMapping, 'regulationId' | 'controlId' | 'createdAt' | 'createdBy'>>
): RegulationControlMapping[] {
  const today = new Date().toISOString().split('T')[0];
  return mappings.map(m =>
    m.regulationId === regulationId && m.controlId === controlId
      ? { ...m, ...updates, updatedAt: today, updatedBy: 'Emily Carter' }
      : m
  );
}

export function deleteMapping(
  mappings: RegulationControlMapping[],
  regulationId: string,
  controlId: string
): RegulationControlMapping[] {
  return mappings.filter(m => !(m.regulationId === regulationId && m.controlId === controlId));
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getMappingsForRegulation(
  mappings: RegulationControlMapping[],
  regulationId: string
): RegulationControlMapping[] {
  return mappings.filter(m => m.regulationId === regulationId);
}

export function getMappingsForControl(
  mappings: RegulationControlMapping[],
  controlId: string
): RegulationControlMapping[] {
  return mappings.filter(m => m.controlId === controlId);
}

export function getMappingByIds(
  mappings: RegulationControlMapping[],
  regulationId: string,
  controlId: string
): RegulationControlMapping | undefined {
  return mappings.find(m => m.regulationId === regulationId && m.controlId === controlId);
}

export function getLinkedControlIds(
  mappings: RegulationControlMapping[],
  regulationId: string
): string[] {
  return mappings.filter(m => m.regulationId === regulationId).map(m => m.controlId);
}

export function getLinkedRegulationIds(
  mappings: RegulationControlMapping[],
  controlId: string
): string[] {
  return mappings.filter(m => m.controlId === controlId).map(m => m.regulationId);
}

export function calculateCoverageStats(mappings: RegulationControlMapping[], regulationId: string) {
  const regMappings = getMappingsForRegulation(mappings, regulationId);
  const total = regMappings.length;
  const full = regMappings.filter(m => m.coverageLevel === 'full').length;
  const partial = regMappings.filter(m => m.coverageLevel === 'partial').length;
  const none = regMappings.filter(m => m.coverageLevel === 'none').length;

  const verified = regMappings.filter(m => m.implementationStatus === 'verified').length;
  const withEvidence = regMappings.filter(m => m.evidenceProvided).length;

  return {
    total,
    full,
    partial,
    none,
    verified,
    withEvidence,
    coverageRate: total > 0 ? Math.round(((full + partial * 0.5) / total) * 100) : 0,
    verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
  };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedMappings(): RegulationControlMapping[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    // REG-001 (SOX-404) linked to controls
    {
      regulationId: 'REG-001',
      controlId: 'CTL-001',
      requirementText:
        'Section 404(a): Management must assess and report on the effectiveness of internal controls over financial reporting',
      coverageLevel: 'full',
      isPrimary: true,
      implementationStatus: 'verified',
      evidenceProvided: true,
      mappingNotes:
        'Annual management assessment process documented. External audit attestation received.',
      gapDescription: null,
      createdAt: formatDate(-180),
      createdBy: 'Emily Carter',
      updatedAt: formatDate(-30),
      updatedBy: 'Michael Ross',
    },
    {
      regulationId: 'REG-001',
      controlId: 'CTL-002',
      requirementText:
        'Section 404(b): External auditor must attest to management assessment of internal controls',
      coverageLevel: 'full',
      isPrimary: false,
      implementationStatus: 'verified',
      evidenceProvided: true,
      mappingNotes: 'Independent audit conducted quarterly. Reports filed with SEC.',
      gapDescription: null,
      createdAt: formatDate(-180),
      createdBy: 'Emily Carter',
      updatedAt: formatDate(-45),
      updatedBy: 'David Kim',
    },
    {
      regulationId: 'REG-001',
      controlId: 'CTL-005',
      requirementText:
        'Documentation requirements: Maintain records of control design and testing results',
      coverageLevel: 'partial',
      isPrimary: false,
      implementationStatus: 'implemented',
      evidenceProvided: true,
      mappingNotes:
        'Documentation in place but needs enhanced version control and centralized repository.',
      gapDescription: 'Version control system for control documentation not fully automated',
      createdAt: formatDate(-180),
      createdBy: 'Emily Carter',
      updatedAt: formatDate(-20),
      updatedBy: 'Emily Carter',
    },

    // REG-002 (GDPR) linked to controls
    {
      regulationId: 'REG-002',
      controlId: 'CTL-003',
      requirementText:
        'Article 32: Implement appropriate technical and organizational measures to ensure security of processing',
      coverageLevel: 'full',
      isPrimary: true,
      implementationStatus: 'verified',
      evidenceProvided: true,
      mappingNotes:
        'Access controls, encryption, and monitoring systems in place. Annual penetration testing conducted.',
      gapDescription: null,
      createdAt: formatDate(-200),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-15),
      updatedBy: 'Rachel Green',
    },
    {
      regulationId: 'REG-002',
      controlId: 'CTL-008',
      requirementText:
        'Article 30: Maintain records of processing activities for all personal data',
      coverageLevel: 'full',
      isPrimary: true,
      implementationStatus: 'tested',
      evidenceProvided: true,
      mappingNotes:
        'Data inventory maintained with automated discovery tools. Records updated monthly.',
      gapDescription: null,
      createdAt: formatDate(-200),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-10),
      updatedBy: 'Sarah Johnson',
    },

    // REG-003 (CCPA) linked to controls
    {
      regulationId: 'REG-003',
      controlId: 'CTL-003',
      requirementText:
        'Section 1798.100: Consumers have right to know what personal information is collected',
      coverageLevel: 'partial',
      isPrimary: true,
      implementationStatus: 'in-progress',
      evidenceProvided: false,
      mappingNotes:
        'Privacy notice published. Consumer request portal under development. Expected completion Q2 2026.',
      gapDescription:
        'Automated consumer data request fulfillment not fully implemented. Manual process in place.',
      createdAt: formatDate(-90),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-5),
      updatedBy: 'Rachel Green',
    },

    // REG-004 (SEC 17a-4) linked to controls
    {
      regulationId: 'REG-004',
      controlId: 'CTL-006',
      requirementText:
        'Rule 17a-4(f): Electronic records must be preserved in non-rewriteable, non-erasable format (WORM)',
      coverageLevel: 'full',
      isPrimary: true,
      implementationStatus: 'verified',
      evidenceProvided: true,
      mappingNotes:
        'WORM-compliant storage system implemented. Third-party certification obtained. Annual audit passed.',
      gapDescription: null,
      createdAt: formatDate(-150),
      createdBy: 'David Kim',
      updatedAt: formatDate(-30),
      updatedBy: 'David Kim',
    },

    // REG-006 (OSHA) linked to controls
    {
      regulationId: 'REG-006',
      controlId: 'CTL-010',
      requirementText:
        '1910.134(c): Written respiratory protection program required for workplaces with exposure hazards',
      coverageLevel: 'full',
      isPrimary: true,
      implementationStatus: 'verified',
      evidenceProvided: true,
      mappingNotes:
        'Written program in place. Annual training conducted. Fit testing performed semi-annually.',
      gapDescription: null,
      createdAt: formatDate(-365),
      createdBy: 'Lisa Brown',
      updatedAt: formatDate(-60),
      updatedBy: 'Tom Anderson',
    },

    // REG-007 (PCI-DSS 4.0) linked to controls
    {
      regulationId: 'REG-007',
      controlId: 'CTL-003',
      requirementText:
        'Requirement 8: Identify and authenticate access to system components',
      coverageLevel: 'full',
      isPrimary: false,
      implementationStatus: 'tested',
      evidenceProvided: true,
      mappingNotes:
        'Multi-factor authentication implemented. Password policies enforced. Access reviews conducted quarterly.',
      gapDescription: null,
      createdAt: formatDate(-120),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-10),
      updatedBy: 'Chris Martinez',
    },
    {
      regulationId: 'REG-007',
      controlId: 'CTL-007',
      requirementText:
        'Requirement 10: Log and monitor all access to network resources and cardholder data',
      coverageLevel: 'partial',
      isPrimary: true,
      implementationStatus: 'implemented',
      evidenceProvided: true,
      mappingNotes:
        'SIEM system deployed. Centralized logging in place. Alert tuning ongoing.',
      gapDescription:
        'Log retention for cardholder data environment needs extension from 6 to 12 months per v4.0 requirements',
      createdAt: formatDate(-120),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-8),
      updatedBy: 'Chris Martinez',
    },
  ];
}
