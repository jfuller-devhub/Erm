// ─── Migration ────────────────────────────────────────────────────────────────

import './migrateChecklistData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;                        // e.g., "CHK-001"
  name: string;                      // e.g., "Annual Risk Assessment"
  description: string;               // What this checklist item involves
  category: string;                  // e.g., "Compliance", "Security", "Financial"
  activityType: string;              // e.g., "Due Diligence", "Monitoring", "Assessment"
  executionStartDate: string;        // e.g., "Vendor Add Date", "Vendor Activation Date", "January 1st", "Vendor Termination Date"
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface VendorLevelChecklistAssociation {
  id: string;                        // e.g., "VLCA-001"
  checklistItemId: string;           // References ChecklistItem.id
  vendorLevelId: string;             // References VendorLevel.id
  vendorStatuses: string[];          // DEPRECATED: Legacy field, use vendorStatusAssignments instead
  status: 'required' | 'optional';   // DEPRECATED: Legacy field, use vendorStatusAssignments instead
  vendorStatusAssignments?: Record<string, 'required' | 'optional'>;  // Assignment status per vendor status, e.g., {"Active": "required", "Inactive": "optional"}
  rrule?: string;                    // RFC 5545 RRULE string, e.g. "FREQ=YEARLY;INTERVAL=1"
  advanceNoticeDays?: number;        // Days before due date to send advance notification
  gracePeriodDays?: number;          // Days after due date before overdue escalation
  evidenceRequired?: boolean;        // Whether supporting evidence must be attached
  evidenceType?: string;             // Type of evidence: Document, Attestation, Screenshot, Certificate, Report, Other
  assignees?: string[];              // Assignee roles/users: "Vendor Manager", "Individuals Involved"
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const CHECKLIST_STORAGE_KEY = 'erm_checklist_items_v3';
const ASSOCIATIONS_STORAGE_KEY = 'erm_vendor_level_checklist_associations_v3';

// ─── Checklist Item CRUD Functions ──────────────────────────────────────────

export function loadChecklistItems(): ChecklistItem[] {
  const stored = localStorage.getItem(CHECKLIST_STORAGE_KEY);
  if (!stored) {
    const seed = getSeedChecklistItems();
    saveChecklistItems(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveChecklistItems(items: ChecklistItem[]): void {
  localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(items));
}

export function getChecklistItemById(
  items: ChecklistItem[],
  id: string
): ChecklistItem | undefined {
  return items.find(item => item.id === id);
}

export function createChecklistItem(
  items: ChecklistItem[],
  data: Omit<ChecklistItem, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): ChecklistItem {
  const nextNum = items.length + 1;
  const id = `CHK-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newItem: ChecklistItem = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newItem;
}

export function updateChecklistItem(
  items: ChecklistItem[],
  id: string,
  updates: Partial<Omit<ChecklistItem, 'id' | 'createdAt' | 'createdBy'>>
): ChecklistItem[] {
  const today = new Date().toISOString().split('T')[0];
  return items.map(item =>
    item.id === id ? { ...item, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : item
  );
}

export function deleteChecklistItem(
  items: ChecklistItem[],
  id: string
): ChecklistItem[] {
  return items.filter(item => item.id !== id);
}

// ─── Association CRUD Functions ──────────────────────────────────────────────

export function loadAssociations(): VendorLevelChecklistAssociation[] {
  const stored = localStorage.getItem(ASSOCIATIONS_STORAGE_KEY);
  if (!stored) {
    const seed = getSeedAssociations();
    saveAssociations(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveAssociations(associations: VendorLevelChecklistAssociation[]): void {
  localStorage.setItem(ASSOCIATIONS_STORAGE_KEY, JSON.stringify(associations));
}

export function getAssociationsByChecklistItem(
  associations: VendorLevelChecklistAssociation[],
  checklistItemId: string
): VendorLevelChecklistAssociation[] {
  return associations.filter(assoc => assoc.checklistItemId === checklistItemId);
}

export function getAssociationsByVendorLevel(
  associations: VendorLevelChecklistAssociation[],
  vendorLevelId: string
): VendorLevelChecklistAssociation[] {
  return associations.filter(assoc => assoc.vendorLevelId === vendorLevelId);
}

export function createAssociation(
  associations: VendorLevelChecklistAssociation[],
  data: Omit<VendorLevelChecklistAssociation, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): VendorLevelChecklistAssociation {
  const nextNum = associations.length + 1;
  const id = `VLCA-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newAssoc: VendorLevelChecklistAssociation = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newAssoc;
}

export function updateAssociation(
  associations: VendorLevelChecklistAssociation[],
  id: string,
  updates: Partial<Omit<VendorLevelChecklistAssociation, 'id' | 'createdAt' | 'createdBy'>>
): VendorLevelChecklistAssociation[] {
  const today = new Date().toISOString().split('T')[0];
  return associations.map(assoc =>
    assoc.id === id ? { ...assoc, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : assoc
  );
}

export function deleteAssociation(
  associations: VendorLevelChecklistAssociation[],
  id: string
): VendorLevelChecklistAssociation[] {
  return associations.filter(assoc => assoc.id !== id);
}

export function deleteAssociationsByChecklistItem(
  associations: VendorLevelChecklistAssociation[],
  checklistItemId: string
): VendorLevelChecklistAssociation[] {
  return associations.filter(assoc => assoc.checklistItemId !== checklistItemId);
}

export function deleteAssociationsByVendorLevel(
  associations: VendorLevelChecklistAssociation[],
  vendorLevelId: string
): VendorLevelChecklistAssociation[] {
  return associations.filter(assoc => assoc.vendorLevelId !== vendorLevelId);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedChecklistItems(): ChecklistItem[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'CHK-001',
      name: 'Annual Risk Assessment',
      description: 'Comprehensive annual evaluation of vendor risks across all domains',
      category: 'Compliance',
      activityType: 'Due Diligence',
      executionStartDate: 'January 1st',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-002',
      name: 'Security Audit',
      description: 'Independent security audit of vendor systems and processes',
      category: 'Security',
      activityType: 'Due Diligence',
      executionStartDate: 'Vendor Activation Date',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-003',
      name: 'Financial Stability Review',
      description: 'Review of vendor financial statements and stability indicators',
      category: 'Financial',
      activityType: 'Due Diligence',
      executionStartDate: 'Vendor Activation Date',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-004',
      name: 'SLA Compliance Monitoring',
      description: 'Ongoing monitoring of service level agreement compliance',
      category: 'Performance',
      activityType: 'Monitoring',
      executionStartDate: 'Vendor Activation Date',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-005',
      name: 'Business Continuity Plan Review',
      description: 'Evaluation of vendor disaster recovery and business continuity capabilities',
      category: 'Operational',
      activityType: 'Assessment',
      executionStartDate: 'January 1st',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-006',
      name: 'Insurance Verification',
      description: 'Verification of vendor insurance coverage and policy limits',
      category: 'Compliance',
      activityType: 'Monitoring',
      executionStartDate: 'Vendor Add Date',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-007',
      name: 'Data Privacy Assessment',
      description: 'Assessment of vendor data handling and privacy practices',
      category: 'Security',
      activityType: 'Assessment',
      executionStartDate: 'Vendor Activation Date',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'CHK-008',
      name: 'Contract Renewal Review',
      description: 'Review of contract terms and conditions prior to renewal',
      category: 'Compliance',
      activityType: 'Review',
      executionStartDate: 'Vendor Termination Date',
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
  ];
}

function getSeedAssociations(): VendorLevelChecklistAssociation[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    // Critical Vendor (VL-001)
    {
      id: 'VLCA-001',
      checklistItemId: 'CHK-001',
      vendorLevelId: 'VL-001',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
        'Active (Under Scheduled Review)': 'required',
      },
      assignees: ['Vendor Manager', 'Individuals Involved'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-002',
      checklistItemId: 'CHK-002',
      vendorLevelId: 'VL-001',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
      },
      assignees: ['Vendor Manager'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-003',
      checklistItemId: 'CHK-003',
      vendorLevelId: 'VL-001',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Under Due Diligence': 'required',
        'Contract Negotiation': 'required',
      },
      assignees: ['Vendor Manager'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-004',
      checklistItemId: 'CHK-004',
      vendorLevelId: 'VL-001',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
      },
      assignees: ['Individuals Involved'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-005',
      checklistItemId: 'CHK-005',
      vendorLevelId: 'VL-001',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
        'Active (Under Scheduled Review)': 'required',
      },
      assignees: ['Vendor Manager', 'Individuals Involved'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    // High Risk Vendor (VL-002)
    {
      id: 'VLCA-006',
      checklistItemId: 'CHK-001',
      vendorLevelId: 'VL-002',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
      },
      assignees: ['Vendor Manager'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-007',
      checklistItemId: 'CHK-002',
      vendorLevelId: 'VL-002',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
        'Active (Under Scheduled Review)': 'optional',
      },
      assignees: ['Vendor Manager'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-008',
      checklistItemId: 'CHK-004',
      vendorLevelId: 'VL-002',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
      },
      assignees: ['Individuals Involved'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-009',
      checklistItemId: 'CHK-005',
      vendorLevelId: 'VL-002',
      vendorStatuses: [],
      status: 'optional',
      vendorStatusAssignments: {
        'Active (In Service)': 'optional',
        'Under Due Diligence': 'optional',
        'Under Consideration': 'optional',
      },
      assignees: ['Vendor Manager', 'Individuals Involved'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    // Moderate Risk Vendor (VL-003)
    {
      id: 'VLCA-010',
      checklistItemId: 'CHK-001',
      vendorLevelId: 'VL-003',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
      },
      assignees: ['Vendor Manager'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-011',
      checklistItemId: 'CHK-006',
      vendorLevelId: 'VL-003',
      vendorStatuses: [],
      status: 'required',
      vendorStatusAssignments: {
        'Active (In Service)': 'required',
        'Active (Under Scheduled Review)': 'required',
      },
      assignees: ['Vendor Manager'],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VLCA-012',
      checklistItemId: 'CHK-008',
      vendorLevelId: 'VL-003',
      vendorStatuses: [],
      status: 'optional',
      vendorStatusAssignments: {
        'Offboarding (Termination in Progress)': 'optional',
      },
      assignees: [],
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
  ];
}
