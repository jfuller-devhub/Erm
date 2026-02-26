import type { AppUser } from './mockData';
import { generateId, MOCK_USERS } from './mockData';

// ─── Enum Types ──────────────────────────────────────────────────────────────

export type RiskStatus = 'draft' | 'active' | 'closed' | 'archived';
export type RiskType = 'strategic' | 'operational' | 'financial' | 'compliance' | 'reputational' | 'cyber';
export type AppetiteLevel = 'averse' | 'minimal' | 'cautious' | 'open' | 'hungry';
export type ReviewFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export const RISK_STATUSES: RiskStatus[] = ['draft', 'active', 'closed', 'archived'];
export const RISK_TYPES: RiskType[] = ['strategic', 'operational', 'financial', 'compliance', 'reputational', 'cyber'];
export const APPETITE_LEVELS: AppetiteLevel[] = ['averse', 'minimal', 'cautious', 'open', 'hungry'];
export const REVIEW_FREQUENCIES: ReviewFrequency[] = ['monthly', 'quarterly', 'semi_annual', 'annual'];

// ─── Display label helpers ───────────────────────────────────────────────────

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  closed: 'Closed',
  archived: 'Archived',
};

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  strategic: 'Strategic',
  operational: 'Operational',
  financial: 'Financial',
  compliance: 'Compliance',
  reputational: 'Reputational',
  cyber: 'Cyber',
};

export const APPETITE_LEVEL_LABELS: Record<AppetiteLevel, string> = {
  averse: 'Averse',
  minimal: 'Minimal',
  cautious: 'Cautious',
  open: 'Open',
  hungry: 'Hungry',
};

export const REVIEW_FREQUENCY_LABELS: Record<ReviewFrequency, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
};

// ─── Risk Category ───────────────────────────────────────────────────────────

export interface RiskCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  colorHex: string;
  parentCategoryId: string | null;
  sortOrder: number;
}

// ─── Risk ────────────────────────────────────────────────────────────────────

export interface Risk {
  id: string;
  categoryId: string;
  department: string;
  owner: AppUser | null;
  title: string;
  description: string;
  status: RiskStatus;
  riskType: RiskType;
  appetiteLevel: AppetiteLevel;
  reviewFrequency: ReviewFrequency;
  nextReviewDate: string;
  /** When true, this risk is promoted to an enterprise-level risk */
  isEnterpriseRisk: boolean;
  /** For non-enterprise risks: optionally links this risk to an enterprise risk */
  enterpriseRiskId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const RISKS_STORAGE_KEY = 'erm_risks_v1';
const CATEGORIES_STORAGE_KEY = 'erm_risk_categories_v1';

function sanitizeCategory(c: any): RiskCategory {
  return {
    id: c.id ?? 'RCAT-' + generateId(),
    name: c.name ?? '',
    code: c.code ?? '',
    description: c.description ?? '',
    colorHex: c.colorHex ?? '#6B7489',
    parentCategoryId: c.parentCategoryId ?? null,
    sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : 0,
  };
}

function sanitizeRisk(r: any): Risk {
  return {
    id: r.id ?? 'RSK-' + generateId(),
    categoryId: r.categoryId ?? '',
    department: r.department ?? '',
    owner: r.owner ?? null,
    title: r.title ?? '',
    description: r.description ?? '',
    status: RISK_STATUSES.includes(r.status) ? r.status : 'draft',
    riskType: RISK_TYPES.includes(r.riskType) ? r.riskType : 'operational',
    appetiteLevel: APPETITE_LEVELS.includes(r.appetiteLevel) ? r.appetiteLevel : 'cautious',
    reviewFrequency: REVIEW_FREQUENCIES.includes(r.reviewFrequency) ? r.reviewFrequency : 'quarterly',
    nextReviewDate: r.nextReviewDate ?? '',
    isEnterpriseRisk: typeof r.isEnterpriseRisk === 'boolean' ? r.isEnterpriseRisk : false,
    enterpriseRiskId: r.enterpriseRiskId ?? null,
    createdAt: r.createdAt ?? '',
    createdBy: r.createdBy ?? '',
    updatedAt: r.updatedAt ?? '',
    updatedBy: r.updatedBy ?? '',
  };
}

// Categories
export function loadRiskCategories(): RiskCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeCategory);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_RISK_CATEGORIES;
  saveRiskCategories(seed);
  return seed;
}

export function saveRiskCategories(categories: RiskCategory[]): void {
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
}

// Risks
export function loadRisks(): Risk[] {
  try {
    const raw = localStorage.getItem(RISKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeRisk);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_RISKS;
  saveRisks(seed);
  return seed;
}

export function saveRisks(risks: Risk[]): void {
  localStorage.setItem(RISKS_STORAGE_KEY, JSON.stringify(risks));
}

// ─── Seed Data: Risk Categories ──────────────────────────────────────────────

export const SEED_RISK_CATEGORIES: RiskCategory[] = [
  {
    id: 'RCAT-001',
    name: 'Information Security',
    code: 'IS',
    description: 'Risks related to data breaches, unauthorized access, and information protection.',
    colorHex: '#C0392B',
    parentCategoryId: null,
    sortOrder: 1,
  },
  {
    id: 'RCAT-002',
    name: 'Data Privacy',
    code: 'DP',
    description: 'Risks related to personal data handling, GDPR, CCPA, and privacy regulations.',
    colorHex: '#E07B00',
    parentCategoryId: 'RCAT-001',
    sortOrder: 2,
  },
  {
    id: 'RCAT-003',
    name: 'Regulatory Compliance',
    code: 'RC',
    description: 'Risks from failure to comply with laws, regulations, and industry standards.',
    colorHex: '#2322F0',
    parentCategoryId: null,
    sortOrder: 3,
  },
  {
    id: 'RCAT-004',
    name: 'Financial Reporting',
    code: 'FR',
    description: 'Risks related to inaccurate financial statements, SOX compliance, and audit findings.',
    colorHex: '#1C8A45',
    parentCategoryId: null,
    sortOrder: 4,
  },
  {
    id: 'RCAT-005',
    name: 'Third-Party / Vendor',
    code: 'TP',
    description: 'Risks arising from reliance on external vendors, suppliers, and service providers.',
    colorHex: '#00A3A3',
    parentCategoryId: null,
    sortOrder: 5,
  },
  {
    id: 'RCAT-006',
    name: 'Business Continuity',
    code: 'BC',
    description: 'Risks related to disruptions in business operations, disaster recovery, and resilience.',
    colorHex: '#6B3FA0',
    parentCategoryId: null,
    sortOrder: 6,
  },
  {
    id: 'RCAT-007',
    name: 'Talent & Workforce',
    code: 'TW',
    description: 'Risks related to employee retention, skill gaps, succession planning, and labor market.',
    colorHex: '#E6740A',
    parentCategoryId: null,
    sortOrder: 7,
  },
];

// ─── Seed Data: Risks ────────────────────────────────────────────────────────

export const SEED_RISKS: Risk[] = [
  {
    id: 'RSK-001',
    categoryId: 'RCAT-001',
    department: 'Technology',
    owner: MOCK_USERS[5], // Kevin Patel
    title: 'Ransomware Attack on Core Infrastructure',
    description: 'Risk of ransomware targeting critical servers and cloud workloads, potentially causing extended downtime and data loss. Current endpoint protection may not cover advanced persistent threats.',
    status: 'active',
    riskType: 'cyber',
    appetiteLevel: 'averse',
    reviewFrequency: 'monthly',
    nextReviewDate: '2026-03-15',
    isEnterpriseRisk: true,
    enterpriseRiskId: null,
    createdAt: '2025-06-10',
    createdBy: 'Emily Carter',
    updatedAt: '2026-01-20',
    updatedBy: 'Kevin Patel',
  },
  {
    id: 'RSK-002',
    categoryId: 'RCAT-002',
    department: 'Compliance',
    owner: MOCK_USERS[11], // Sarah Okonkwo
    title: 'GDPR Data Subject Rights Non-Compliance',
    description: 'Failure to process data subject access requests (DSARs) within the legally mandated 30-day window. Current manual process creates bottlenecks during high-volume periods.',
    status: 'active',
    riskType: 'compliance',
    appetiteLevel: 'minimal',
    reviewFrequency: 'quarterly',
    nextReviewDate: '2026-04-01',
    isEnterpriseRisk: false,
    enterpriseRiskId: 'RSK-001',
    createdAt: '2025-08-15',
    createdBy: 'Sarah Okonkwo',
    updatedAt: '2026-01-28',
    updatedBy: 'Sarah Okonkwo',
  },
  {
    id: 'RSK-003',
    categoryId: 'RCAT-004',
    department: 'Finance',
    owner: MOCK_USERS[3], // Alan Foster
    title: 'SOX Material Weakness in Revenue Recognition',
    description: 'Potential material weakness identified in revenue recognition controls during Q3 audit cycle. Manual journal entries lack sufficient review and approval documentation.',
    status: 'active',
    riskType: 'financial',
    appetiteLevel: 'averse',
    reviewFrequency: 'quarterly',
    nextReviewDate: '2026-03-31',
    isEnterpriseRisk: true,
    enterpriseRiskId: null,
    createdAt: '2025-09-01',
    createdBy: 'Alan Foster',
    updatedAt: '2026-02-01',
    updatedBy: 'Alan Foster',
  },
  {
    id: 'RSK-004',
    categoryId: 'RCAT-005',
    department: 'Operations',
    owner: MOCK_USERS[1], // Marcus Johnson
    title: 'Critical Vendor Single Point of Failure',
    description: 'Over-reliance on a single cloud infrastructure provider (AWS) without adequate multi-cloud failover. A major outage could impact 85% of customer-facing services.',
    status: 'active',
    riskType: 'operational',
    appetiteLevel: 'cautious',
    reviewFrequency: 'quarterly',
    nextReviewDate: '2026-04-15',
    isEnterpriseRisk: false,
    enterpriseRiskId: 'RSK-001',
    createdAt: '2025-07-20',
    createdBy: 'Marcus Johnson',
    updatedAt: '2026-01-15',
    updatedBy: 'Marcus Johnson',
  },
  {
    id: 'RSK-005',
    categoryId: 'RCAT-003',
    department: 'Strategy',
    owner: MOCK_USERS[10], // Daniel Cruz
    title: 'Market Disruption from AI Competitors',
    description: 'Emerging AI-native competitors may erode market share in core product segments. Current product roadmap may not be adapting quickly enough to generative AI capabilities.',
    status: 'draft',
    riskType: 'strategic',
    appetiteLevel: 'open',
    reviewFrequency: 'semi_annual',
    nextReviewDate: '2026-06-30',
    isEnterpriseRisk: true,
    enterpriseRiskId: null,
    createdAt: '2026-01-05',
    createdBy: 'Daniel Cruz',
    updatedAt: '2026-02-10',
    updatedBy: 'Daniel Cruz',
  },
  {
    id: 'RSK-006',
    categoryId: 'RCAT-006',
    department: 'Operations',
    owner: MOCK_USERS[8], // Gary Bennett
    title: 'Disaster Recovery Plan Gap for Regional Offices',
    description: 'Regional offices in Chicago and Boston lack documented and tested disaster recovery plans. Current DR exercises only cover headquarters and primary data center.',
    status: 'active',
    riskType: 'operational',
    appetiteLevel: 'minimal',
    reviewFrequency: 'semi_annual',
    nextReviewDate: '2026-07-01',
    isEnterpriseRisk: false,
    enterpriseRiskId: null,
    createdAt: '2025-11-10',
    createdBy: 'Gary Bennett',
    updatedAt: '2026-01-30',
    updatedBy: 'Gary Bennett',
  },
  {
    id: 'RSK-007',
    categoryId: 'RCAT-007',
    department: 'HR',
    owner: MOCK_USERS[7], // Monica Shaw
    title: 'Key Person Dependency in Engineering Leadership',
    description: 'Three critical engineering managers have no identified successors. Loss of any one could delay product releases by 3-6 months and impact client commitments.',
    status: 'active',
    riskType: 'operational',
    appetiteLevel: 'cautious',
    reviewFrequency: 'quarterly',
    nextReviewDate: '2026-05-01',
    isEnterpriseRisk: false,
    enterpriseRiskId: 'RSK-005',
    createdAt: '2025-10-22',
    createdBy: 'Monica Shaw',
    updatedAt: '2026-02-05',
    updatedBy: 'Monica Shaw',
  },
  {
    id: 'RSK-008',
    categoryId: 'RCAT-001',
    department: 'Technology',
    owner: MOCK_USERS[0], // Emily Carter
    title: 'Insider Threat from Privileged Access Accounts',
    description: 'Excessive number of privileged access accounts without periodic access reviews. 23 admin accounts have not been reviewed in over 180 days.',
    status: 'closed',
    riskType: 'cyber',
    appetiteLevel: 'averse',
    reviewFrequency: 'monthly',
    nextReviewDate: '2026-03-01',
    isEnterpriseRisk: false,
    enterpriseRiskId: 'RSK-001',
    createdAt: '2025-04-15',
    createdBy: 'Emily Carter',
    updatedAt: '2025-12-20',
    updatedBy: 'Emily Carter',
  },
  {
    id: 'RSK-009',
    categoryId: 'RCAT-003',
    department: 'Legal',
    owner: MOCK_USERS[6], // Thomas Ward
    title: 'Pending Regulatory Changes in Data Localization',
    description: 'Proposed EU data localization requirements may require significant infrastructure changes. Current data architecture routes customer data through US-based processing centers.',
    status: 'active',
    riskType: 'compliance',
    appetiteLevel: 'minimal',
    reviewFrequency: 'quarterly',
    nextReviewDate: '2026-04-30',
    isEnterpriseRisk: false,
    enterpriseRiskId: 'RSK-003',
    createdAt: '2025-12-01',
    createdBy: 'Thomas Ward',
    updatedAt: '2026-02-15',
    updatedBy: 'Thomas Ward',
  },
  {
    id: 'RSK-010',
    categoryId: 'RCAT-005',
    department: 'Marketing',
    owner: MOCK_USERS[9], // Jennifer Walsh
    title: 'Brand Reputation Risk from Social Media Incident',
    description: 'Lack of formal social media crisis response plan. A viral negative incident could damage brand reputation before communications team can respond effectively.',
    status: 'archived',
    riskType: 'reputational',
    appetiteLevel: 'cautious',
    reviewFrequency: 'annual',
    nextReviewDate: '2027-01-15',
    isEnterpriseRisk: false,
    enterpriseRiskId: null,
    createdAt: '2024-11-20',
    createdBy: 'Jennifer Walsh',
    updatedAt: '2025-11-15',
    updatedBy: 'Jennifer Walsh',
  },
];