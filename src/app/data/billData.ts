import type { AppUser } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BillStatus =
  | 'introduced'
  | 'in-committee'
  | 'committee-passed'
  | 'floor-debate'
  | 'passed-chamber'
  | 'other-chamber'
  | 'conference'
  | 'passed-both'
  | 'signed'
  | 'vetoed'
  | 'failed';

export type BillPriority = 'critical' | 'high' | 'medium' | 'low';

export interface BillAmendment {
  id: string;
  amendmentNumber: string;
  description: string;
  proposedDate: string;
  status: 'proposed' | 'adopted' | 'rejected';
  impact: string;
}

export interface BillVote {
  id: string;
  chamber: string;                   // "House", "Senate"
  voteDate: string;
  result: 'passed' | 'failed';
  votesFor: number;
  votesAgainst: number;
  votesAbstained: number;
}

export interface Bill {
  id: string;                        // e.g., "BILL-001"
  billNumber: string;                // e.g., "H.R. 1234", "S.B. 567"
  title: string;
  summary: string;

  // Metadata
  legislature: string;               // e.g., "117th Congress", "California State Assembly"
  sponsor: string;                   // Primary sponsor name
  introducedDate: string;

  // Status
  status: BillStatus;
  currentCommittee: string | null;

  // Relationship
  regulationId: string | null;       // Parent regulation if passed
  relatedRegulationIds: string[];    // Other related regs

  // Tracking
  amendments: BillAmendment[];
  votes: BillVote[];
  officialUrl: string | null;
  attachmentIds: string[];

  // Internal tracking
  assignedTo: AppUser | null;
  priority: BillPriority;
  internalNotes: string;

  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Labels & Styles ─────────────────────────────────────────────────────────

export const BILL_STATUS_LABELS: Record<BillStatus, string> = {
  introduced: 'Introduced',
  'in-committee': 'In Committee',
  'committee-passed': 'Committee Passed',
  'floor-debate': 'Floor Debate',
  'passed-chamber': 'Passed Chamber',
  'other-chamber': 'Other Chamber',
  conference: 'Conference',
  'passed-both': 'Passed Both',
  signed: 'Signed',
  vetoed: 'Vetoed',
  failed: 'Failed',
};

export const BILL_STATUS_STYLES: Record<BillStatus, { background: string; color: string }> = {
  introduced: { background: '#E3F2FD', color: '#1565C0' },
  'in-committee': { background: '#FFF3E0', color: '#E65100' },
  'committee-passed': { background: '#F3E5F5', color: '#6A1B9A' },
  'floor-debate': { background: '#FFF9C4', color: '#F57F17' },
  'passed-chamber': { background: '#E8F5E9', color: '#2E7D32' },
  'other-chamber': { background: '#E1F5FE', color: '#0277BD' },
  conference: { background: '#F3E5F5', color: '#7B1FA2' },
  'passed-both': { background: '#E8F5EE', color: '#1C8A45' },
  signed: { background: '#E8F5EE', color: '#1C8A45' },
  vetoed: { background: '#FFEBEE', color: '#C62828' },
  failed: { background: '#F5F5F5', color: '#616161' },
};

export const BILL_PRIORITY_LABELS: Record<BillPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const BILL_PRIORITY_STYLES: Record<BillPriority, { background: string; color: string }> = {
  critical: { background: '#FFEBEE', color: '#C62828' },
  high: { background: '#FFF3E0', color: '#E65100' },
  medium: { background: '#FFFDE7', color: '#F9A825' },
  low: { background: '#E8F5EE', color: '#388E3C' },
};

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_bills_v1';

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadBills(): Bill[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = getSeedBills();
    saveBills(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveBills(bills: Bill[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
}

export function getBillById(bills: Bill[], id: string): Bill | undefined {
  return bills.find(b => b.id === id);
}

export function createBill(
  bills: Bill[],
  data: Omit<Bill, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): Bill {
  const nextNum = bills.length + 1;
  const id = `BILL-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newBill: Bill = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newBill;
}

export function updateBill(
  bills: Bill[],
  id: string,
  updates: Partial<Omit<Bill, 'id' | 'createdAt' | 'createdBy'>>
): Bill[] {
  const today = new Date().toISOString().split('T')[0];
  return bills.map(b =>
    b.id === id ? { ...b, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : b
  );
}

export function deleteBill(bills: Bill[], id: string): Bill[] {
  return bills.filter(b => b.id !== id);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getBillsForRegulation(bills: Bill[], regulationId: string): Bill[] {
  return bills.filter(
    b => b.regulationId === regulationId || b.relatedRegulationIds.includes(regulationId)
  );
}

export function filterBills(
  bills: Bill[],
  filters: {
    search?: string;
    status?: BillStatus[];
    priority?: BillPriority[];
    legislature?: string[];
  }
): Bill[] {
  let filtered = [...bills];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      b =>
        b.billNumber.toLowerCase().includes(search) ||
        b.title.toLowerCase().includes(search) ||
        b.summary.toLowerCase().includes(search) ||
        b.sponsor.toLowerCase().includes(search)
    );
  }

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(b => filters.status!.includes(b.status));
  }

  if (filters.priority && filters.priority.length > 0) {
    filtered = filtered.filter(b => filters.priority!.includes(b.priority));
  }

  if (filters.legislature && filters.legislature.length > 0) {
    filtered = filtered.filter(b => filters.legislature!.includes(b.legislature));
  }

  return filtered;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedBills(): Bill[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'BILL-001',
      billNumber: 'S.B. 1121',
      title: 'California Privacy Rights Act Amendment',
      summary:
        'Proposes amendments to CCPA to expand consumer rights, including data portability and automated decision-making transparency. Establishes California Privacy Protection Agency enforcement powers.',
      legislature: 'California State Legislature',
      sponsor: 'Senator Maria Gonzalez',
      introducedDate: formatDate(-120),
      status: 'in-committee',
      currentCommittee: 'Senate Judiciary Committee',
      regulationId: 'REG-003',
      relatedRegulationIds: ['REG-002'],
      amendments: [
        {
          id: 'AMD-001',
          amendmentNumber: 'S.B. 1121-A1',
          description: 'Extends small business exemption threshold from $25M to $50M annual revenue',
          proposedDate: formatDate(-90),
          status: 'proposed',
          impact: 'Would reduce number of covered businesses by approximately 30%',
        },
      ],
      votes: [],
      officialUrl: 'https://leginfo.legislature.ca.gov/sb1121',
      attachmentIds: [],
      assignedTo: { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
      priority: 'high',
      internalNotes:
        'Tracking closely - potential 6-month implementation timeline if passed. Legal team reviewing amendment A1 implications.',
      createdAt: formatDate(-120),
      createdBy: 'Sarah Johnson',
      updatedAt: formatDate(-15),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'BILL-002',
      billNumber: 'H.R. 3452',
      title: 'Artificial Intelligence Governance and Transparency Act',
      summary:
        'Federal legislation requiring companies deploying high-risk AI systems to implement governance frameworks, conduct algorithmic impact assessments, maintain human oversight, and provide transparency reports.',
      legislature: '118th Congress',
      sponsor: 'Representative James Mitchell',
      introducedDate: formatDate(-90),
      status: 'in-committee',
      currentCommittee: 'House Committee on Science, Space, and Technology',
      regulationId: 'REG-005',
      relatedRegulationIds: [],
      amendments: [],
      votes: [],
      officialUrl: 'https://www.congress.gov/bill/118th-congress/house-bill/3452',
      attachmentIds: [],
      assignedTo: { id: '7', name: 'Rachel Green', email: 'rachel.green@example.com' },
      priority: 'critical',
      internalNotes:
        'High priority - would impact ML models in production. Need 18-24 month implementation if passed. Coordinating with product and engineering on impact assessment.',
      createdAt: formatDate(-90),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-5),
      updatedBy: 'Chris Martinez',
    },
    {
      id: 'BILL-003',
      billNumber: 'H.R. 2891',
      title: 'Cybersecurity Information Sharing Enhancement Act',
      summary:
        'Expands requirements for critical infrastructure organizations to share cybersecurity threat information with CISA. Establishes mandatory incident reporting within 72 hours of discovery.',
      legislature: '118th Congress',
      sponsor: 'Representative Susan Chen',
      introducedDate: formatDate(-180),
      status: 'passed-chamber',
      currentCommittee: null,
      regulationId: null,
      relatedRegulationIds: ['REG-007'],
      amendments: [
        {
          id: 'AMD-002',
          amendmentNumber: 'H.R. 2891-A1',
          description: 'Extends reporting deadline from 72 hours to 96 hours',
          proposedDate: formatDate(-150),
          status: 'adopted',
          impact: 'Provides additional 24 hours for incident assessment before reporting',
        },
      ],
      votes: [
        {
          id: 'VOTE-001',
          chamber: 'House',
          voteDate: formatDate(-60),
          result: 'passed',
          votesFor: 287,
          votesAgainst: 138,
          votesAbstained: 10,
        },
      ],
      officialUrl: 'https://www.congress.gov/bill/118th-congress/house-bill/2891',
      attachmentIds: [],
      assignedTo: { id: '7', name: 'Rachel Green', email: 'rachel.green@example.com' },
      priority: 'high',
      internalNotes:
        'Passed House, now in Senate. If signed, need to establish incident response procedure and CISA reporting workflow within 6 months.',
      createdAt: formatDate(-180),
      createdBy: 'Rachel Green',
      updatedAt: formatDate(-58),
      updatedBy: 'Rachel Green',
    },
  ];
}
