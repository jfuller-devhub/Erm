import { generateId, MOCK_USERS } from './mockData';
import type { AppUser } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type CoverageLevel = 'full' | 'substantial' | 'partial' | 'minimal';

export const COVERAGE_LEVELS: CoverageLevel[] = ['full', 'substantial', 'partial', 'minimal'];

// ─── Display label helpers ───────────────────────────────────────────────────

export const COVERAGE_LEVEL_LABELS: Record<CoverageLevel, string> = {
  full: 'Full',
  substantial: 'Substantial',
  partial: 'Partial',
  minimal: 'Minimal',
};

// ─── Badge styling ───────────────────────────────────────────────────────────

export const COVERAGE_LEVEL_STYLES: Record<CoverageLevel, { background: string; color: string }> = {
  full:        { background: '#E8F5EE', color: '#1C8A45' },
  substantial: { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  partial:     { background: '#FFF3E0', color: '#E07B00' },
  minimal:     { background: 'rgba(192,57,43,0.10)', color: '#C0392B' },
};

// ─── Interface ───────────────────────────────────────────────────────────────

export interface RiskControl {
  riskId: string;
  controlId: string;
  coverageLevel: CoverageLevel;
  isPrimary: boolean;
  mappingNotes: string;
  createdAt: string;
  createdBy: AppUser | null;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_risk_controls_v1';

function sanitizeRiskControl(rc: any): RiskControl {
  return {
    riskId: rc.riskId ?? '',
    controlId: rc.controlId ?? '',
    coverageLevel: COVERAGE_LEVELS.includes(rc.coverageLevel) ? rc.coverageLevel : 'partial',
    isPrimary: typeof rc.isPrimary === 'boolean' ? rc.isPrimary : false,
    mappingNotes: rc.mappingNotes ?? '',
    createdAt: rc.createdAt ?? '',
    createdBy: rc.createdBy ?? null,
  };
}

export function loadRiskControls(): RiskControl[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeRiskControl);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_RISK_CONTROLS;
  saveRiskControls(seed);
  return seed;
}

export function saveRiskControls(riskControls: RiskControl[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(riskControls));
}

/** Get all risk-control mappings for a specific risk */
export function getControlsForRisk(riskControls: RiskControl[], riskId: string): RiskControl[] {
  return riskControls.filter(rc => rc.riskId === riskId);
}

/** Get all risk-control mappings for a specific control */
export function getRisksForControl(riskControls: RiskControl[], controlId: string): RiskControl[] {
  return riskControls.filter(rc => rc.controlId === controlId);
}

/** Check if a mapping already exists */
export function mappingExists(riskControls: RiskControl[], riskId: string, controlId: string): boolean {
  return riskControls.some(rc => rc.riskId === riskId && rc.controlId === controlId);
}

/** Count of linked controls for a risk */
export function getControlCountForRisk(riskControls: RiskControl[], riskId: string): number {
  return riskControls.filter(rc => rc.riskId === riskId).length;
}

/** Count of linked risks for a control */
export function getRiskCountForControl(riskControls: RiskControl[], controlId: string): number {
  return riskControls.filter(rc => rc.controlId === controlId).length;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const SEED_RISK_CONTROLS: RiskControl[] = [
  // RSK-001 (Ransomware) ↔ CTL-001 (Security Training), CTL-002 (EDR), CTL-011 (Network Segmentation)
  {
    riskId: 'RSK-001',
    controlId: 'CTL-001',
    coverageLevel: 'partial',
    isPrimary: false,
    mappingNotes: 'Security awareness training reduces likelihood of phishing-initiated ransomware, but does not address exploitation of unpatched vulnerabilities.',
    createdAt: '2025-07-01',
    createdBy: MOCK_USERS[5],
  },
  {
    riskId: 'RSK-001',
    controlId: 'CTL-002',
    coverageLevel: 'substantial',
    isPrimary: true,
    mappingNotes: 'EDR is the primary detection and response mechanism for ransomware. CrowdStrike Falcon provides real-time behavioral analysis.',
    createdAt: '2025-07-01',
    createdBy: MOCK_USERS[5],
  },
  {
    riskId: 'RSK-001',
    controlId: 'CTL-011',
    coverageLevel: 'partial',
    isPrimary: false,
    mappingNotes: 'Network segmentation limits lateral movement if ransomware establishes initial foothold.',
    createdAt: '2025-07-15',
    createdBy: MOCK_USERS[0],
  },

  // RSK-002 (GDPR DSAR) ↔ CTL-004 (DSAR Workflow), CTL-009 (Regulatory Monitoring)
  {
    riskId: 'RSK-002',
    controlId: 'CTL-004',
    coverageLevel: 'substantial',
    isPrimary: true,
    mappingNotes: 'DSAR workflow directly addresses the risk of non-compliance with data subject rights. Automated tracking ensures SLA adherence.',
    createdAt: '2025-08-20',
    createdBy: MOCK_USERS[11],
  },
  {
    riskId: 'RSK-002',
    controlId: 'CTL-009',
    coverageLevel: 'minimal',
    isPrimary: false,
    mappingNotes: 'Regulatory monitoring helps identify changes to DSAR requirements across jurisdictions.',
    createdAt: '2025-09-01',
    createdBy: MOCK_USERS[6],
  },

  // RSK-003 (SOX Material Weakness) ↔ CTL-005 (SOD Journal Entries)
  {
    riskId: 'RSK-003',
    controlId: 'CTL-005',
    coverageLevel: 'full',
    isPrimary: true,
    mappingNotes: 'Segregation of duties for journal entries is the primary control addressing the material weakness in revenue recognition.',
    createdAt: '2025-09-15',
    createdBy: MOCK_USERS[3],
  },

  // RSK-004 (Vendor SPOF) ↔ CTL-006 (Multi-Cloud Failover), CTL-010 (Vendor Risk Assessment)
  {
    riskId: 'RSK-004',
    controlId: 'CTL-006',
    coverageLevel: 'substantial',
    isPrimary: true,
    mappingNotes: 'Multi-cloud failover testing directly addresses the single point of failure risk with AWS dependency.',
    createdAt: '2026-01-15',
    createdBy: MOCK_USERS[1],
  },
  {
    riskId: 'RSK-004',
    controlId: 'CTL-010',
    coverageLevel: 'partial',
    isPrimary: false,
    mappingNotes: 'Vendor risk assessment provides ongoing visibility into AWS operational risks and service reliability.',
    createdAt: '2025-08-01',
    createdBy: MOCK_USERS[1],
  },

  // RSK-006 (DR Gap) ↔ CTL-007 (DR Plan Regional Offices)
  {
    riskId: 'RSK-006',
    controlId: 'CTL-007',
    coverageLevel: 'full',
    isPrimary: true,
    mappingNotes: 'DR plan for regional offices directly addresses the identified gap in Chicago and Boston locations.',
    createdAt: '2025-12-05',
    createdBy: MOCK_USERS[8],
  },

  // RSK-007 (Key Person Dependency) ↔ CTL-008 (Succession Planning)
  {
    riskId: 'RSK-007',
    controlId: 'CTL-008',
    coverageLevel: 'substantial',
    isPrimary: true,
    mappingNotes: 'Succession planning review identifies and addresses key-person dependencies in engineering leadership.',
    createdAt: '2025-11-01',
    createdBy: MOCK_USERS[7],
  },

  // RSK-008 (Insider Threat) ↔ CTL-003 (PAR), CTL-001 (Training)
  {
    riskId: 'RSK-008',
    controlId: 'CTL-003',
    coverageLevel: 'substantial',
    isPrimary: true,
    mappingNotes: 'Privileged access reviews directly reduce the number of over-provisioned admin accounts.',
    createdAt: '2025-05-01',
    createdBy: MOCK_USERS[0],
  },
  {
    riskId: 'RSK-008',
    controlId: 'CTL-001',
    coverageLevel: 'partial',
    isPrimary: false,
    mappingNotes: 'Training covers insider threat awareness and responsible use of privileged access.',
    createdAt: '2025-05-01',
    createdBy: MOCK_USERS[0],
  },

  // RSK-009 (Data Localization) ↔ CTL-009 (Regulatory Monitoring)
  {
    riskId: 'RSK-009',
    controlId: 'CTL-009',
    coverageLevel: 'partial',
    isPrimary: true,
    mappingNotes: 'Regulatory change monitoring tracks EU data localization proposals and alerts legal team of material changes.',
    createdAt: '2025-12-15',
    createdBy: MOCK_USERS[6],
  },

  // RSK-010 (Brand Reputation) ↔ CTL-012 (Social Media Crisis Plan)
  {
    riskId: 'RSK-010',
    controlId: 'CTL-012',
    coverageLevel: 'partial',
    isPrimary: true,
    mappingNotes: 'Crisis response plan provides structured approach to social media incidents, though plan has not been recently tested.',
    createdAt: '2024-12-01',
    createdBy: MOCK_USERS[9],
  },
];
