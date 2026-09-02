export type VendorStatus = 'Active' | 'Inactive' | 'Pending Review' | 'Terminating' | 'Selected Vendor';
export type ContractStatus = 'Active' | 'Expired' | 'Pending' | 'Renewal Due' | 'Terminated';
export type ContractType =
  | 'Master Service Agreement'
  | 'Statement of Work'
  | 'NDA'
  | 'Amendment'
  | 'Purchase Order';
export type VendorCategory =
  | 'Business Services'
  | 'Facility Services'
  | 'Software/Hardware/Technology'
  | 'Events'
  | 'Other';

export type ContactType = 'External' | 'Internal';

export interface VendorProcessAssociation {
  processId: string;
  subProcessId?: string;
}

export interface AppUser {
  id: string;
  name: string;
  initials: string;
  department: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: VendorCategory;
  status: VendorStatus;
  department: string;
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  website: string;
  createdDate: string;
  updatedDate: string;
  notes: string;
  // Governance fields
  dmbaVendorManager: AppUser | null;
  departmentOwner: string;
  documentationLink: string;
  baaRequired: boolean;
  individualsInvolved: AppUser[];
  processAssociations: VendorProcessAssociation[];
  // Plan associations (which benefit plans this vendor supports)
  planIds: string[];
}

export interface Contract {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  type: ContractType;
  status: ContractStatus;
  value: number;
  startDate: string;
  endDate: string;
  owner: string;
  department: string;
  description: string;
  autoRenew: boolean;
  noticePeriodDays: number;
  createdDate: string;
  updatedDate: string;
  // Extended fields
  sharepointLink: string;
  vendorCommunicationsDirect: boolean;
  hasAIFeatures: boolean;
  evergreen: boolean;
  budgetManager: string;
  vendorSignatory: string;
  companySignatory: string;
  businessOwners: AppUser[];
  individualsInvolved: AppUser[];
}

export interface ActivityItem {
  id: string;
  entityId: string;
  entityType: 'vendor' | 'contract';
  user: string;
  userInitials: string;
  action: string;
  timestamp: string;
}

export interface VendorContact {
  id: string;
  vendorId: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  type: ContactType;
  department: string;
  notes: string;
}

export type ConfigTable = 'Vendor' | 'Contract' | 'Process' | 'Control' | 'Risk' | 'Mitigation' | 'Product' | 'Assessment' | 'Contact' | 'Framework' | 'Compliance' | 'Checklist';
export type ConfigOptionStatus = 'Active' | 'Inactive';

export interface ConfigOption {
  id: string;
  table: ConfigTable;
  field: string;
  value: string;
  status: ConfigOptionStatus;
  sortOrder: number;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function daysUntil(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Mock Users ───────────────────────────────────────────────────────────────

export const MOCK_USERS: AppUser[] = [
  { id: 'USR-001', name: 'Emily Carter',    initials: 'EC', department: 'Technology'  },
  { id: 'USR-002', name: 'Marcus Johnson',  initials: 'MJ', department: 'Operations'  },
  { id: 'USR-003', name: 'Rachel Kim',      initials: 'RK', department: 'Sales'        },
  { id: 'USR-004', name: 'Alan Foster',     initials: 'AF', department: 'Finance'      },
  { id: 'USR-005', name: 'Donna Harris',    initials: 'DH', department: 'Facilities'  },
  { id: 'USR-006', name: 'Kevin Patel',     initials: 'KP', department: 'Technology'  },
  { id: 'USR-007', name: 'Thomas Ward',     initials: 'TW', department: 'Legal'        },
  { id: 'USR-008', name: 'Monica Shaw',     initials: 'MS', department: 'HR'           },
  { id: 'USR-009', name: 'Gary Bennett',    initials: 'GB', department: 'Operations'  },
  { id: 'USR-010', name: 'Jennifer Walsh',  initials: 'JW', department: 'Marketing'   },
  { id: 'USR-011', name: 'Daniel Cruz',     initials: 'DC', department: 'Strategy'    },
  { id: 'USR-012', name: 'Sarah Okonkwo',   initials: 'SO', department: 'Compliance'  },
];

// ─── Mock Vendors ────────────────────────────────────────────────────────────

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'VEN-001',
    name: 'Accenture',
    category: 'Business Services',
    status: 'Active',
    department: 'Technology',
    primaryContact: 'Sarah Mitchell',
    email: 'smitchell@accenture.com',
    phone: '+1 (312) 693-0161',
    address: '161 N Clark St, Chicago, IL 60601',
    taxId: '36-4056092',
    website: 'www.accenture.com',
    createdDate: '2022-03-14',
    updatedDate: '2024-11-05',
    notes: 'Strategic consulting partner for digital transformation initiatives.',
    dmbaVendorManager: MOCK_USERS[0],
    departmentOwner: 'Technology',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/accenture',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[1], MOCK_USERS[5]],
    processAssociations: [
      { processId: 'PRC-001' },
      { processId: 'PRC-002' },
    ],
    planIds: [],
  },
  {
    id: 'VEN-002',
    name: 'Microsoft',
    category: 'Software/Hardware/Technology',
    status: 'Active',
    department: 'Technology',
    primaryContact: 'James Hopper',
    email: 'jhopper@microsoft.com',
    phone: '+1 (425) 882-8080',
    address: 'One Microsoft Way, Redmond, WA 98052',
    taxId: '91-1144442',
    website: 'www.microsoft.com',
    createdDate: '2021-06-01',
    updatedDate: '2025-01-20',
    notes: 'Enterprise software licensing and cloud services provider.',
    dmbaVendorManager: MOCK_USERS[5],
    departmentOwner: 'Technology',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/microsoft',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[0]],
    processAssociations: [
      { processId: 'PRC-002' },
    ],
    planIds: [],
  },
  {
    id: 'VEN-003',
    name: 'Salesforce',
    category: 'Software/Hardware/Technology',
    status: 'Active',
    department: 'Sales',
    primaryContact: 'Linda Torres',
    email: 'ltorres@salesforce.com',
    phone: '+1 (415) 901-7000',
    address: '415 Mission St, San Francisco, CA 94105',
    taxId: '94-3320693',
    website: 'www.salesforce.com',
    createdDate: '2022-09-10',
    updatedDate: '2024-12-01',
    notes: 'CRM and marketing automation platform.',
    dmbaVendorManager: MOCK_USERS[2],
    departmentOwner: 'Sales',
    documentationLink: '',
    baaRequired: false,
    individualsInvolved: [],
    processAssociations: [],
    planIds: [],
  },
  {
    id: 'VEN-004',
    name: 'JLL',
    category: 'Facility Services',
    status: 'Active',
    department: 'Facilities',
    primaryContact: 'Robert Kane',
    email: 'rkane@jll.com',
    phone: '+1 (312) 782-5800',
    address: '200 E Randolph Dr, Chicago, IL 60601',
    taxId: '36-0869300',
    website: 'www.jll.com',
    createdDate: '2020-04-22',
    updatedDate: '2024-10-11',
    notes: 'Facilities management and commercial real estate services.',
    dmbaVendorManager: MOCK_USERS[4],
    departmentOwner: 'Facilities',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/jll',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[1]],
    processAssociations: [],
    planIds: [],
  },
  {
    id: 'VEN-005',
    name: 'Deloitte',
    category: 'Business Services',
    status: 'Active',
    department: 'Finance',
    primaryContact: 'Angela Brooks',
    email: 'abrooks@deloitte.com',
    phone: '+1 (212) 492-4000',
    address: '30 Rockefeller Plaza, New York, NY 10112',
    taxId: '13-3891517',
    website: 'www.deloitte.com',
    createdDate: '2021-01-15',
    updatedDate: '2025-02-01',
    notes: 'Audit, consulting, and tax advisory services.',
    dmbaVendorManager: MOCK_USERS[3],
    departmentOwner: 'Finance',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/deloitte',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[6], MOCK_USERS[11]],
    processAssociations: [
      { processId: 'PRC-003' },
      { processId: 'PRC-005' },
    ],
    planIds: [],
  },
  {
    id: 'VEN-006',
    name: 'Amazon Web Services',
    category: 'Software/Hardware/Technology',
    status: 'Active',
    department: 'Technology',
    primaryContact: 'Kevin Zhao',
    email: 'kzhao@aws.amazon.com',
    phone: '+1 (206) 266-1000',
    address: '410 Terry Ave N, Seattle, WA 98109',
    taxId: '91-1646860',
    website: 'aws.amazon.com',
    createdDate: '2020-11-03',
    updatedDate: '2025-01-10',
    notes: 'Cloud infrastructure and managed services.',
    dmbaVendorManager: MOCK_USERS[5],
    departmentOwner: 'Technology',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/aws',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[0], MOCK_USERS[1]],
    processAssociations: [],
    planIds: [],
  },
  {
    id: 'VEN-007',
    name: 'Iron Mountain',
    category: 'Facility Services',
    status: 'Inactive',
    department: 'Operations',
    primaryContact: 'Patricia Evans',
    email: 'pevans@ironmountain.com',
    phone: '+1 (617) 535-4766',
    address: '1 Federal St, Boston, MA 02110',
    taxId: '23-2588479',
    website: 'www.ironmountain.com',
    createdDate: '2019-07-18',
    updatedDate: '2024-06-30',
    notes: 'Document and records management. Contract not renewed in 2024.',
    dmbaVendorManager: MOCK_USERS[4],
    departmentOwner: 'Operations',
    documentationLink: '',
    baaRequired: false,
    individualsInvolved: [],
    processAssociations: [],
    planIds: [],
  },
  {
    id: 'VEN-008',
    name: 'McKinsey & Company',
    category: 'Business Services',
    status: 'Pending Review',
    department: 'Strategy',
    primaryContact: 'Daniel Park',
    email: 'dpark@mckinsey.com',
    phone: '+1 (212) 446-7000',
    address: '711 3rd Ave, New York, NY 10017',
    taxId: '13-1951951',
    website: 'www.mckinsey.com',
    createdDate: '2024-10-01',
    updatedDate: '2025-02-05',
    notes: 'Pending security and compliance review before onboarding.',
    dmbaVendorManager: MOCK_USERS[0],
    departmentOwner: 'Strategy',
    documentationLink: '',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[10]],
    processAssociations: [
      { processId: 'PRC-001' },
    ],
    planIds: [],
  },
  {
    id: 'VEN-009',
    name: 'WPP',
    category: 'Business Services',
    status: 'Active',
    department: 'Marketing',
    primaryContact: 'Claire Nguyen',
    email: 'cnguyen@wpp.com',
    phone: '+1 (212) 632-2200',
    address: '3 World Trade Center, New York, NY 10007',
    taxId: '13-3995901',
    website: 'www.wpp.com',
    createdDate: '2022-05-20',
    updatedDate: '2024-09-14',
    notes: 'Global advertising and marketing communications group.',
    dmbaVendorManager: MOCK_USERS[9],
    departmentOwner: 'Marketing',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/wpp',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[2]],
    processAssociations: [],
    planIds: [],
  },
  {
    id: 'VEN-010',
    name: 'Linklaters LLP',
    category: 'Business Services',
    status: 'Active',
    department: 'Legal',
    primaryContact: 'Thomas Whitfield',
    email: 'twhitfield@linklaters.com',
    phone: '+1 (212) 903-9000',
    address: '1345 Ave of the Americas, New York, NY 10105',
    taxId: '98-0201345',
    website: 'www.linklaters.com',
    createdDate: '2021-08-30',
    updatedDate: '2024-11-22',
    notes: 'Primary external legal counsel for M&A and regulatory matters.',
    dmbaVendorManager: MOCK_USERS[6],
    departmentOwner: 'Legal',
    documentationLink: 'https://company.sharepoint.com/sites/vendors/linklaters',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[11]],
    processAssociations: [
      { processId: 'PRC-002' },
    ],
    planIds: [],
  },
  {
    id: 'VEN-011',
    name: 'Randstad',
    category: 'Business Services',
    status: 'Inactive',
    department: 'HR',
    primaryContact: 'Monica Shaw',
    email: 'mshaw@randstad.com',
    phone: '+1 (770) 937-7000',
    address: '150 Presidential Way, Woburn, MA 01801',
    taxId: '23-1709601',
    website: 'www.randstad.com',
    createdDate: '2020-02-14',
    updatedDate: '2024-03-31',
    notes: 'Temporary staffing services. Engagement paused pending budget review.',
    dmbaVendorManager: MOCK_USERS[7],
    departmentOwner: 'HR',
    documentationLink: '',
    baaRequired: false,
    individualsInvolved: [],
    processAssociations: [
      { processId: 'PRC-004' },
    ],
    planIds: [],
  },
  {
    id: 'VEN-012',
    name: 'FedEx',
    category: 'Business Services',
    status: 'Pending Review',
    department: 'Operations',
    primaryContact: 'Gary Bennett',
    email: 'gbennett@fedex.com',
    phone: '+1 (800) 463-3339',
    address: '942 S Shady Grove Rd, Memphis, TN 38120',
    taxId: '62-1412501',
    website: 'www.fedex.com',
    createdDate: '2025-01-15',
    updatedDate: '2025-02-10',
    notes: 'Logistics and shipping vendor under contract negotiation.',
    dmbaVendorManager: MOCK_USERS[8],
    departmentOwner: 'Operations',
    documentationLink: '',
    baaRequired: false,
    individualsInvolved: [MOCK_USERS[1]],
    processAssociations: [],
    planIds: [],
  },
];

// ─── Mock Contracts ───────────────────────────────────────────────────────────

export const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'CON-001',
    vendorId: 'VEN-001',
    vendorName: 'Accenture',
    title: 'Digital Transformation Consulting MSA',
    type: 'Master Service Agreement',
    status: 'Active',
    value: 2400000,
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    owner: 'Emily Carter',
    department: 'Technology',
    description: 'Master agreement covering all consulting and implementation services for the enterprise digital transformation program.',
    autoRenew: false,
    noticePeriodDays: 90,
    createdDate: '2022-12-01',
    updatedDate: '2024-12-15',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-001',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Alan Foster',
    vendorSignatory: 'Sarah Mitchell',
    companySignatory: 'Emily Carter',
    businessOwners: [MOCK_USERS[0], MOCK_USERS[1]],
    individualsInvolved: [MOCK_USERS[5], MOCK_USERS[6]],
  },
  {
    id: 'CON-002',
    vendorId: 'VEN-001',
    vendorName: 'Accenture',
    title: 'ERP Implementation SOW – Phase 2',
    type: 'Statement of Work',
    status: 'Active',
    value: 850000,
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    owner: 'Marcus Johnson',
    department: 'Operations',
    description: 'Statement of Work for the second phase of ERP system implementation and data migration.',
    autoRenew: false,
    noticePeriodDays: 60,
    createdDate: '2024-05-10',
    updatedDate: '2024-05-10',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-002',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Marcus Johnson',
    vendorSignatory: 'Sarah Mitchell',
    companySignatory: 'Marcus Johnson',
    businessOwners: [MOCK_USERS[1]],
    individualsInvolved: [MOCK_USERS[0]],
  },
  {
    id: 'CON-003',
    vendorId: 'VEN-002',
    vendorName: 'Microsoft',
    title: 'Microsoft 365 Enterprise License',
    type: 'Master Service Agreement',
    status: 'Renewal Due',
    value: 1200000,
    startDate: '2023-03-01',
    endDate: '2025-03-15',
    owner: 'Emily Carter',
    department: 'Technology',
    description: 'Enterprise licensing agreement for Microsoft 365 E5 suite covering all employees.',
    autoRenew: true,
    noticePeriodDays: 60,
    createdDate: '2023-02-01',
    updatedDate: '2025-01-20',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-003',
    vendorCommunicationsDirect: true,
    hasAIFeatures: true,
    evergreen: true,
    budgetManager: 'Emily Carter',
    vendorSignatory: 'James Hopper',
    companySignatory: 'Emily Carter',
    businessOwners: [MOCK_USERS[0]],
    individualsInvolved: [MOCK_USERS[5], MOCK_USERS[7]],
  },
  {
    id: 'CON-004',
    vendorId: 'VEN-002',
    vendorName: 'Microsoft',
    title: 'Azure Cloud Services Agreement',
    type: 'Master Service Agreement',
    status: 'Active',
    value: 960000,
    startDate: '2024-01-01',
    endDate: '2026-12-31',
    owner: 'Kevin Patel',
    department: 'Technology',
    description: 'Cloud infrastructure and compute services including reserved instances and support tier.',
    autoRenew: true,
    noticePeriodDays: 90,
    createdDate: '2023-12-01',
    updatedDate: '2024-01-05',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-004',
    vendorCommunicationsDirect: false,
    hasAIFeatures: true,
    evergreen: false,
    budgetManager: 'Kevin Patel',
    vendorSignatory: 'James Hopper',
    companySignatory: 'Kevin Patel',
    businessOwners: [MOCK_USERS[5]],
    individualsInvolved: [MOCK_USERS[0], MOCK_USERS[1]],
  },
  {
    id: 'CON-005',
    vendorId: 'VEN-003',
    vendorName: 'Salesforce',
    title: 'Salesforce CRM Platform License',
    type: 'Master Service Agreement',
    status: 'Active',
    value: 540000,
    startDate: '2023-09-01',
    endDate: '2026-08-31',
    owner: 'Rachel Kim',
    department: 'Sales',
    description: 'Salesforce Sales Cloud and Service Cloud license for 250 users.',
    autoRenew: true,
    noticePeriodDays: 90,
    createdDate: '2023-08-10',
    updatedDate: '2024-12-01',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-005',
    vendorCommunicationsDirect: false,
    hasAIFeatures: true,
    evergreen: false,
    budgetManager: 'Rachel Kim',
    vendorSignatory: 'Linda Torres',
    companySignatory: 'Rachel Kim',
    businessOwners: [MOCK_USERS[2]],
    individualsInvolved: [],
  },
  {
    id: 'CON-006',
    vendorId: 'VEN-004',
    vendorName: 'JLL',
    title: 'Facilities Management Services',
    type: 'Master Service Agreement',
    status: 'Renewal Due',
    value: 3200000,
    startDate: '2020-05-01',
    endDate: '2025-04-01',
    owner: 'Donna Harris',
    department: 'Facilities',
    description: 'Comprehensive facilities management covering 12 office locations across North America.',
    autoRenew: false,
    noticePeriodDays: 120,
    createdDate: '2020-04-10',
    updatedDate: '2025-01-15',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-006',
    vendorCommunicationsDirect: true,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Donna Harris',
    vendorSignatory: 'Robert Kane',
    companySignatory: 'Donna Harris',
    businessOwners: [MOCK_USERS[4]],
    individualsInvolved: [MOCK_USERS[1]],
  },
  {
    id: 'CON-007',
    vendorId: 'VEN-005',
    vendorName: 'Deloitte',
    title: 'Annual Audit & Assurance Services',
    type: 'Statement of Work',
    status: 'Active',
    value: 680000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    owner: 'Alan Foster',
    department: 'Finance',
    description: 'External audit, financial statement assurance, and SOX compliance review.',
    autoRenew: false,
    noticePeriodDays: 90,
    createdDate: '2024-11-15',
    updatedDate: '2025-01-05',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-007',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Alan Foster',
    vendorSignatory: 'Angela Brooks',
    companySignatory: 'Alan Foster',
    businessOwners: [MOCK_USERS[3]],
    individualsInvolved: [MOCK_USERS[6], MOCK_USERS[11]],
  },
  {
    id: 'CON-008',
    vendorId: 'VEN-005',
    vendorName: 'Deloitte',
    title: 'Tax Advisory Services NDA',
    type: 'NDA',
    status: 'Active',
    value: 0,
    startDate: '2021-01-15',
    endDate: '2026-01-14',
    owner: 'Alan Foster',
    department: 'Finance',
    description: 'Non-disclosure agreement covering all advisory engagements with Deloitte tax practice.',
    autoRenew: true,
    noticePeriodDays: 30,
    createdDate: '2021-01-10',
    updatedDate: '2021-01-15',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-008',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: '',
    vendorSignatory: 'Angela Brooks',
    companySignatory: 'Thomas Ward',
    businessOwners: [MOCK_USERS[3]],
    individualsInvolved: [],
  },
  {
    id: 'CON-009',
    vendorId: 'VEN-006',
    vendorName: 'Amazon Web Services',
    title: 'AWS Enterprise Discount Program',
    type: 'Master Service Agreement',
    status: 'Active',
    value: 1800000,
    startDate: '2023-07-01',
    endDate: '2026-06-30',
    owner: 'Kevin Patel',
    department: 'Technology',
    description: 'Enterprise Discount Program covering all AWS services with committed spend and priority support.',
    autoRenew: false,
    noticePeriodDays: 120,
    createdDate: '2023-06-01',
    updatedDate: '2025-01-10',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-009',
    vendorCommunicationsDirect: false,
    hasAIFeatures: true,
    evergreen: false,
    budgetManager: 'Kevin Patel',
    vendorSignatory: 'Kevin Zhao',
    companySignatory: 'Kevin Patel',
    businessOwners: [MOCK_USERS[5]],
    individualsInvolved: [MOCK_USERS[0], MOCK_USERS[1]],
  },
  {
    id: 'CON-010',
    vendorId: 'VEN-007',
    vendorName: 'Iron Mountain',
    title: 'Records Management Services',
    type: 'Master Service Agreement',
    status: 'Expired',
    value: 145000,
    startDate: '2019-08-01',
    endDate: '2024-07-31',
    owner: 'Donna Harris',
    department: 'Operations',
    description: 'Physical and digital records storage, retrieval, and destruction services.',
    autoRenew: false,
    noticePeriodDays: 60,
    createdDate: '2019-07-15',
    updatedDate: '2024-07-31',
    sharepointLink: '',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Donna Harris',
    vendorSignatory: 'Patricia Evans',
    companySignatory: 'Donna Harris',
    businessOwners: [MOCK_USERS[4]],
    individualsInvolved: [],
  },
  {
    id: 'CON-011',
    vendorId: 'VEN-009',
    vendorName: 'WPP',
    title: 'Global Marketing Communications MSA',
    type: 'Master Service Agreement',
    status: 'Active',
    value: 4500000,
    startDate: '2022-06-01',
    endDate: '2025-05-31',
    owner: 'Rachel Kim',
    department: 'Marketing',
    description: 'Global agency of record agreement covering creative, media buying, and digital campaigns.',
    autoRenew: false,
    noticePeriodDays: 180,
    createdDate: '2022-05-15',
    updatedDate: '2024-09-14',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-011',
    vendorCommunicationsDirect: true,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Jennifer Walsh',
    vendorSignatory: 'Claire Nguyen',
    companySignatory: 'Rachel Kim',
    businessOwners: [MOCK_USERS[2], MOCK_USERS[9]],
    individualsInvolved: [],
  },
  {
    id: 'CON-012',
    vendorId: 'VEN-009',
    vendorName: 'WPP',
    title: 'Q1 2025 Campaign SOW',
    type: 'Statement of Work',
    status: 'Active',
    value: 320000,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    owner: 'Rachel Kim',
    department: 'Marketing',
    description: 'Q1 integrated campaign across digital and traditional media channels.',
    autoRenew: false,
    noticePeriodDays: 15,
    createdDate: '2024-12-10',
    updatedDate: '2025-01-01',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-012',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Jennifer Walsh',
    vendorSignatory: 'Claire Nguyen',
    companySignatory: 'Rachel Kim',
    businessOwners: [MOCK_USERS[2]],
    individualsInvolved: [],
  },
  {
    id: 'CON-013',
    vendorId: 'VEN-010',
    vendorName: 'Linklaters LLP',
    title: 'Legal Advisory Services Retainer',
    type: 'Master Service Agreement',
    status: 'Active',
    value: 750000,
    startDate: '2021-09-01',
    endDate: '2025-08-31',
    owner: 'Thomas Ward',
    department: 'Legal',
    description: 'Annual retainer for M&A legal advisory, regulatory counsel, and dispute resolution.',
    autoRenew: false,
    noticePeriodDays: 90,
    createdDate: '2021-08-20',
    updatedDate: '2024-11-22',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-013',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Alan Foster',
    vendorSignatory: 'Thomas Whitfield',
    companySignatory: 'Thomas Ward',
    businessOwners: [MOCK_USERS[6]],
    individualsInvolved: [MOCK_USERS[11]],
  },
  {
    id: 'CON-014',
    vendorId: 'VEN-011',
    vendorName: 'Randstad',
    title: 'Temporary Staffing Services Agreement',
    type: 'Master Service Agreement',
    status: 'Terminated',
    value: 210000,
    startDate: '2020-03-01',
    endDate: '2024-02-28',
    owner: 'Monica Shaw',
    department: 'HR',
    description: 'Agreement for temporary and contract staffing across administrative and technical roles.',
    autoRenew: false,
    noticePeriodDays: 30,
    createdDate: '2020-02-20',
    updatedDate: '2024-03-31',
    sharepointLink: '',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Monica Shaw',
    vendorSignatory: 'Monica Shaw',
    companySignatory: 'Monica Shaw',
    businessOwners: [MOCK_USERS[7]],
    individualsInvolved: [],
  },
  {
    id: 'CON-015',
    vendorId: 'VEN-008',
    vendorName: 'McKinsey & Company',
    title: 'Organizational Restructuring SOW',
    type: 'Statement of Work',
    status: 'Pending',
    value: 1100000,
    startDate: '2025-04-01',
    endDate: '2025-09-30',
    owner: 'Emily Carter',
    department: 'Strategy',
    description: 'Engagement to support organizational redesign and operating model transformation.',
    autoRenew: false,
    noticePeriodDays: 30,
    createdDate: '2025-02-01',
    updatedDate: '2025-02-10',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-015',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Alan Foster',
    vendorSignatory: 'Daniel Park',
    companySignatory: 'Emily Carter',
    businessOwners: [MOCK_USERS[0], MOCK_USERS[10]],
    individualsInvolved: [],
  },
  {
    id: 'CON-016',
    vendorId: 'VEN-001',
    vendorName: 'Accenture',
    title: 'Cybersecurity Services NDA',
    type: 'NDA',
    status: 'Active',
    value: 0,
    startDate: '2023-01-01',
    endDate: '2028-12-31',
    owner: 'Marcus Johnson',
    department: 'Technology',
    description: 'NDA covering cybersecurity assessments and vulnerability disclosures.',
    autoRenew: false,
    noticePeriodDays: 30,
    createdDate: '2022-12-28',
    updatedDate: '2023-01-02',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-016',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: '',
    vendorSignatory: 'Sarah Mitchell',
    companySignatory: 'Marcus Johnson',
    businessOwners: [MOCK_USERS[1]],
    individualsInvolved: [],
  },
  {
    id: 'CON-017',
    vendorId: 'VEN-012',
    vendorName: 'FedEx',
    title: 'Enterprise Shipping Services',
    type: 'Purchase Order',
    status: 'Pending',
    value: 95000,
    startDate: '2025-03-01',
    endDate: '2026-02-28',
    owner: 'Gary Bennett',
    department: 'Operations',
    description: 'Negotiated enterprise shipping rates and priority processing for all office locations.',
    autoRenew: true,
    noticePeriodDays: 60,
    createdDate: '2025-01-20',
    updatedDate: '2025-02-12',
    sharepointLink: '',
    vendorCommunicationsDirect: false,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Gary Bennett',
    vendorSignatory: 'Gary Bennett',
    companySignatory: 'Gary Bennett',
    businessOwners: [MOCK_USERS[8]],
    individualsInvolved: [MOCK_USERS[1]],
  },
  {
    id: 'CON-018',
    vendorId: 'VEN-004',
    vendorName: 'JLL',
    title: 'NYC HQ Lease Management Amendment',
    type: 'Amendment',
    status: 'Active',
    value: 480000,
    startDate: '2024-07-01',
    endDate: '2025-06-30',
    owner: 'Donna Harris',
    department: 'Facilities',
    description: 'Amendment to add NYC headquarters location to the master facilities management agreement.',
    autoRenew: false,
    noticePeriodDays: 60,
    createdDate: '2024-06-15',
    updatedDate: '2024-07-01',
    sharepointLink: 'https://company.sharepoint.com/sites/contracts/CON-018',
    vendorCommunicationsDirect: true,
    hasAIFeatures: false,
    evergreen: false,
    budgetManager: 'Donna Harris',
    vendorSignatory: 'Robert Kane',
    companySignatory: 'Donna Harris',
    businessOwners: [MOCK_USERS[4]],
    individualsInvolved: [],
  },
];

// ─── Mock Activity Feed ───────────────────────────────────────────────────────

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { id: 'ACT-001', entityId: 'CON-003', entityType: 'contract', user: 'Emily Carter', userInitials: 'EC', action: 'Flagged contract CON-003 as Renewal Due — expiring Mar 15, 2025', timestamp: '2025-02-14' },
  { id: 'ACT-002', entityId: 'VEN-008', entityType: 'vendor', user: 'Admin', userInitials: 'AD', action: 'Vendor McKinsey & Company added — Pending Review status', timestamp: '2025-02-10' },
  { id: 'ACT-003', entityId: 'CON-017', entityType: 'contract', user: 'Gary Bennett', userInitials: 'GB', action: 'Created Pending contract CON-017 with FedEx for enterprise shipping', timestamp: '2025-02-10' },
  { id: 'ACT-004', entityId: 'CON-015', entityType: 'contract', user: 'Emily Carter', userInitials: 'EC', action: 'Created Pending SOW CON-015 with McKinsey & Company', timestamp: '2025-02-05' },
  { id: 'ACT-005', entityId: 'VEN-005', entityType: 'vendor', user: 'Alan Foster', userInitials: 'AF', action: 'Deloitte vendor record updated — contact information revised', timestamp: '2025-02-01' },
  { id: 'ACT-006', entityId: 'CON-006', entityType: 'contract', user: 'Donna Harris', userInitials: 'DH', action: 'Flagged CON-006 JLL Facilities MSA for renewal — expires Apr 1, 2025', timestamp: '2025-01-15' },
  { id: 'ACT-007', entityId: 'CON-004', entityType: 'contract', user: 'Kevin Patel', userInitials: 'KP', action: 'Azure Cloud Services Agreement value updated following usage review', timestamp: '2025-01-10' },
  { id: 'ACT-008', entityId: 'CON-007', entityType: 'contract', user: 'Alan Foster', userInitials: 'AF', action: 'Annual Audit SOW CON-007 created and set to Active', timestamp: '2025-01-05' },
  { id: 'ACT-009', entityId: 'VEN-010', entityType: 'vendor', user: 'Thomas Ward', userInitials: 'TW', action: 'Linklaters LLP vendor record updated — notes revised', timestamp: '2024-11-22' },
  { id: 'ACT-010', entityId: 'CON-001', entityType: 'contract', user: 'Emily Carter', userInitials: 'EC', action: 'CON-001 Accenture MSA reviewed — no changes required', timestamp: '2024-12-15' },
];

// ─── Mock Vendor Contacts ─────────────────────────────────────────────────────

export const INITIAL_VENDOR_CONTACTS: VendorContact[] = [
  // VEN-001 Accenture
  {
    id: 'COT-001', vendorId: 'VEN-001', name: 'Sarah Mitchell', title: 'Account Executive',
    email: 'smitchell@accenture.com', phone: '+1 (312) 693-0161',
    type: 'External', department: 'Client Services', notes: 'Primary point of contact for all engagements.',
  },
  {
    id: 'COT-002', vendorId: 'VEN-001', name: 'David Okafor', title: 'Lead Consultant',
    email: 'dokafor@accenture.com', phone: '+1 (312) 693-0200',
    type: 'External', department: 'Technology Consulting', notes: 'Leads the ERP implementation team.',
  },
  {
    id: 'COT-003', vendorId: 'VEN-001', name: 'Emily Carter', title: 'Internal Relationship Owner',
    email: 'ecarter@yourcompany.com', phone: '+1 (646) 555-0110',
    type: 'Internal', department: 'Technology', notes: 'Owns the vendor relationship internally.',
  },

  // VEN-002 Microsoft
  {
    id: 'COT-004', vendorId: 'VEN-002', name: 'James Hopper', title: 'Enterprise Account Manager',
    email: 'jhopper@microsoft.com', phone: '+1 (425) 882-8080',
    type: 'External', department: 'Enterprise Sales', notes: 'Primary Microsoft account manager.',
  },
  {
    id: 'COT-005', vendorId: 'VEN-002', name: 'Priya Nair', title: 'Technical Account Manager',
    email: 'pnair@microsoft.com', phone: '+1 (425) 882-9000',
    type: 'External', department: 'Customer Success', notes: 'Handles technical escalations and support SLAs.',
  },
  {
    id: 'COT-006', vendorId: 'VEN-002', name: 'Kevin Patel', title: 'Internal IT Lead',
    email: 'kpatel@yourcompany.com', phone: '+1 (646) 555-0215',
    type: 'Internal', department: 'Technology', notes: 'Internal owner for Microsoft licensing.',
  },

  // VEN-003 Salesforce
  {
    id: 'COT-007', vendorId: 'VEN-003', name: 'Linda Torres', title: 'Account Executive',
    email: 'ltorres@salesforce.com', phone: '+1 (415) 901-7000',
    type: 'External', department: 'Enterprise Sales', notes: 'Manages our Salesforce CRM account.',
  },
  {
    id: 'COT-008', vendorId: 'VEN-003', name: 'Rachel Kim', title: 'Internal CRM Owner',
    email: 'rkim@yourcompany.com', phone: '+1 (646) 555-0322',
    type: 'Internal', department: 'Sales Operations', notes: 'Internal owner for Salesforce platform.',
  },

  // VEN-004 JLL
  {
    id: 'COT-009', vendorId: 'VEN-004', name: 'Robert Kane', title: 'Facilities Account Director',
    email: 'rkane@jll.com', phone: '+1 (312) 782-5800',
    type: 'External', department: 'Client Management', notes: 'Primary JLL contact for all locations.',
  },
  {
    id: 'COT-010', vendorId: 'VEN-004', name: 'Donna Harris', title: 'Internal Facilities Lead',
    email: 'dharris@yourcompany.com', phone: '+1 (646) 555-0418',
    type: 'Internal', department: 'Facilities', notes: 'Internal owner of the JLL relationship.',
  },

  // VEN-005 Deloitte
  {
    id: 'COT-011', vendorId: 'VEN-005', name: 'Angela Brooks', title: 'Engagement Partner',
    email: 'abrooks@deloitte.com', phone: '+1 (212) 492-4000',
    type: 'External', department: 'Audit & Assurance', notes: 'Lead engagement partner for annual audit.',
  },
  {
    id: 'COT-012', vendorId: 'VEN-005', name: 'Alan Foster', title: 'Internal Finance Lead',
    email: 'afoster@yourcompany.com', phone: '+1 (646) 555-0514',
    type: 'Internal', department: 'Finance', notes: 'Internal relationship owner for Deloitte.',
  },

  // VEN-006 AWS
  {
    id: 'COT-013', vendorId: 'VEN-006', name: 'Kevin Zhao', title: 'Enterprise Account Manager',
    email: 'kzhao@aws.amazon.com', phone: '+1 (206) 266-1000',
    type: 'External', department: 'Enterprise Sales', notes: 'Primary AWS enterprise contact.',
  },

  // VEN-009 WPP
  {
    id: 'COT-014', vendorId: 'VEN-009', name: 'Claire Nguyen', title: 'Agency Lead',
    email: 'cnguyen@wpp.com', phone: '+1 (212) 632-2200',
    type: 'External', department: 'Client Services', notes: 'Day-to-day agency lead for all campaigns.',
  },
  {
    id: 'COT-015', vendorId: 'VEN-009', name: 'Rachel Kim', title: 'Internal Marketing Owner',
    email: 'rkim@yourcompany.com', phone: '+1 (646) 555-0322',
    type: 'Internal', department: 'Marketing', notes: 'Internal owner for WPP agency relationship.',
  },

  // VEN-010 Linklaters
  {
    id: 'COT-016', vendorId: 'VEN-010', name: 'Thomas Whitfield', title: 'Partner',
    email: 'twhitfield@linklaters.com', phone: '+1 (212) 903-9000',
    type: 'External', department: 'M&A Advisory', notes: 'Lead partner on M&A transactions.',
  },
  {
    id: 'COT-017', vendorId: 'VEN-010', name: 'Thomas Ward', title: 'Internal Legal Lead',
    email: 'tward@yourcompany.com', phone: '+1 (646) 555-0611',
    type: 'Internal', department: 'Legal', notes: 'Internal relationship owner for Linklaters.',
  },
];

// ─── Mock Config Options ──────────────────────────────────────────────────────

export const INITIAL_CONFIG_OPTIONS: ConfigOption[] = [
  // Vendor → Category
  { id: 'CFG-001', table: 'Vendor', field: 'Category', value: 'Business Services',           status: 'Active', sortOrder: 1 },
  { id: 'CFG-002', table: 'Vendor', field: 'Category', value: 'Facility Services',            status: 'Active', sortOrder: 2 },
  { id: 'CFG-003', table: 'Vendor', field: 'Category', value: 'Software/Hardware/Technology', status: 'Active', sortOrder: 3 },
  { id: 'CFG-004', table: 'Vendor', field: 'Category', value: 'Events',                       status: 'Active', sortOrder: 4 },
  { id: 'CFG-005', table: 'Vendor', field: 'Category', value: 'Other',                        status: 'Active', sortOrder: 5 },
  // Vendor → Status
  { id: 'CFG-006', table: 'Vendor', field: 'Status', value: 'Active',          status: 'Active', sortOrder: 1 },
  { id: 'CFG-007', table: 'Vendor', field: 'Status', value: 'Inactive',        status: 'Active', sortOrder: 2 },
  { id: 'CFG-008', table: 'Vendor', field: 'Status', value: 'Pending Review',  status: 'Active', sortOrder: 3 },
  { id: 'CFG-009', table: 'Vendor', field: 'Status', value: 'Selected Vendor', status: 'Active', sortOrder: 4 },
  { id: 'CFG-010', table: 'Vendor', field: 'Status', value: 'Terminating',     status: 'Active', sortOrder: 5 },
  // Vendor → Department
  { id: 'CFG-030', table: 'Vendor', field: 'Department', value: 'Technology', status: 'Active', sortOrder: 1 },
  { id: 'CFG-031', table: 'Vendor', field: 'Department', value: 'Finance',    status: 'Active', sortOrder: 2 },
  { id: 'CFG-032', table: 'Vendor', field: 'Department', value: 'Operations', status: 'Active', sortOrder: 3 },
  { id: 'CFG-033', table: 'Vendor', field: 'Department', value: 'Marketing',  status: 'Active', sortOrder: 4 },
  { id: 'CFG-034', table: 'Vendor', field: 'Department', value: 'Sales',      status: 'Active', sortOrder: 5 },
  { id: 'CFG-035', table: 'Vendor', field: 'Department', value: 'Legal',      status: 'Active', sortOrder: 6 },
  { id: 'CFG-036', table: 'Vendor', field: 'Department', value: 'HR',         status: 'Active', sortOrder: 7 },
  { id: 'CFG-037', table: 'Vendor', field: 'Department', value: 'Strategy',   status: 'Active', sortOrder: 8 },
  { id: 'CFG-038', table: 'Vendor', field: 'Department', value: 'Facilities', status: 'Active', sortOrder: 9 },
  // Contract → Type
  { id: 'CFG-011', table: 'Contract', field: 'Type', value: 'Master Service Agreement', status: 'Active', sortOrder: 1 },
  { id: 'CFG-012', table: 'Contract', field: 'Type', value: 'Statement of Work',        status: 'Active', sortOrder: 2 },
  { id: 'CFG-013', table: 'Contract', field: 'Type', value: 'NDA',                      status: 'Active', sortOrder: 3 },
  { id: 'CFG-014', table: 'Contract', field: 'Type', value: 'Amendment',                status: 'Active', sortOrder: 4 },
  { id: 'CFG-015', table: 'Contract', field: 'Type', value: 'Purchase Order',           status: 'Active', sortOrder: 5 },
  // Contract → Status
  { id: 'CFG-016', table: 'Contract', field: 'Status', value: 'Active',      status: 'Active', sortOrder: 1 },
  { id: 'CFG-017', table: 'Contract', field: 'Status', value: 'Pending',     status: 'Active', sortOrder: 2 },
  { id: 'CFG-018', table: 'Contract', field: 'Status', value: 'Renewal Due', status: 'Active', sortOrder: 3 },
  { id: 'CFG-019', table: 'Contract', field: 'Status', value: 'Expired',     status: 'Active', sortOrder: 4 },
  { id: 'CFG-020', table: 'Contract', field: 'Status', value: 'Terminated',  status: 'Active', sortOrder: 5 },
  // Contract → Department
  { id: 'CFG-021', table: 'Contract', field: 'Department', value: 'Technology', status: 'Active', sortOrder: 1 },
  { id: 'CFG-022', table: 'Contract', field: 'Department', value: 'Finance',    status: 'Active', sortOrder: 2 },
  { id: 'CFG-023', table: 'Contract', field: 'Department', value: 'Operations', status: 'Active', sortOrder: 3 },
  { id: 'CFG-024', table: 'Contract', field: 'Department', value: 'Marketing',  status: 'Active', sortOrder: 4 },
  { id: 'CFG-025', table: 'Contract', field: 'Department', value: 'Sales',      status: 'Active', sortOrder: 5 },
  { id: 'CFG-026', table: 'Contract', field: 'Department', value: 'Legal',      status: 'Active', sortOrder: 6 },
  { id: 'CFG-027', table: 'Contract', field: 'Department', value: 'HR',         status: 'Active', sortOrder: 7 },
  { id: 'CFG-028', table: 'Contract', field: 'Department', value: 'Strategy',   status: 'Active', sortOrder: 8 },
  { id: 'CFG-029', table: 'Contract', field: 'Department', value: 'Facilities', status: 'Active', sortOrder: 9 },

  // ─── Process ─────────────────────────────────────────────────────────────────
  { id: 'CFG-100', table: 'Process', field: 'Business Domain', value: 'Procurement',    status: 'Active', sortOrder: 1 },
  { id: 'CFG-101', table: 'Process', field: 'Business Domain', value: 'Legal',           status: 'Active', sortOrder: 2 },
  { id: 'CFG-102', table: 'Process', field: 'Business Domain', value: 'Risk Management', status: 'Active', sortOrder: 3 },
  { id: 'CFG-103', table: 'Process', field: 'Business Domain', value: 'Human Resources', status: 'Active', sortOrder: 4 },
  { id: 'CFG-104', table: 'Process', field: 'Business Domain', value: 'Finance',         status: 'Active', sortOrder: 5 },
  { id: 'CFG-105', table: 'Process', field: 'Business Domain', value: 'Technology',      status: 'Active', sortOrder: 6 },
  { id: 'CFG-106', table: 'Process', field: 'Business Domain', value: 'Compliance',      status: 'Active', sortOrder: 7 },
  { id: 'CFG-107', table: 'Process', field: 'Business Domain', value: 'Operations',      status: 'Active', sortOrder: 8 },
  { id: 'CFG-108', table: 'Process', field: 'Business Domain', value: 'Marketing',       status: 'Active', sortOrder: 9 },
  { id: 'CFG-109', table: 'Process', field: 'Business Domain', value: 'Sales',           status: 'Active', sortOrder: 10 },
  { id: 'CFG-110', table: 'Process', field: 'Business Domain', value: 'Strategy',        status: 'Active', sortOrder: 11 },
  { id: 'CFG-111', table: 'Process', field: 'Status', value: 'Draft',   status: 'Active', sortOrder: 1 },
  { id: 'CFG-112', table: 'Process', field: 'Status', value: 'Active',  status: 'Active', sortOrder: 2 },
  { id: 'CFG-113', table: 'Process', field: 'Status', value: 'Retired', status: 'Active', sortOrder: 3 },

  // ─── Control ─────────────────────────────────────────────────────────────────
  { id: 'CFG-114', table: 'Control', field: 'Type', value: 'preventive',   status: 'Active', sortOrder: 1 },
  { id: 'CFG-115', table: 'Control', field: 'Type', value: 'detective',    status: 'Active', sortOrder: 2 },
  { id: 'CFG-116', table: 'Control', field: 'Type', value: 'corrective',   status: 'Active', sortOrder: 3 },
  { id: 'CFG-117', table: 'Control', field: 'Type', value: 'directive',    status: 'Active', sortOrder: 4 },
  { id: 'CFG-118', table: 'Control', field: 'Type', value: 'compensating', status: 'Active', sortOrder: 5 },
  { id: 'CFG-119', table: 'Control', field: 'Frequency', value: 'continuous', status: 'Active', sortOrder: 1 },
  { id: 'CFG-120', table: 'Control', field: 'Frequency', value: 'daily',      status: 'Active', sortOrder: 2 },
  { id: 'CFG-121', table: 'Control', field: 'Frequency', value: 'weekly',     status: 'Active', sortOrder: 3 },
  { id: 'CFG-122', table: 'Control', field: 'Frequency', value: 'monthly',    status: 'Active', sortOrder: 4 },
  { id: 'CFG-123', table: 'Control', field: 'Frequency', value: 'quarterly',  status: 'Active', sortOrder: 5 },
  { id: 'CFG-124', table: 'Control', field: 'Frequency', value: 'annual',     status: 'Active', sortOrder: 6 },
  { id: 'CFG-125', table: 'Control', field: 'Status', value: 'active',     status: 'Active', sortOrder: 1 },
  { id: 'CFG-126', table: 'Control', field: 'Status', value: 'in_design',  status: 'Active', sortOrder: 2 },
  { id: 'CFG-127', table: 'Control', field: 'Status', value: 'inactive',   status: 'Active', sortOrder: 3 },
  { id: 'CFG-128', table: 'Control', field: 'Status', value: 'deprecated', status: 'Active', sortOrder: 4 },
  { id: 'CFG-129', table: 'Control', field: 'Effectiveness', value: 'not_tested',         status: 'Active', sortOrder: 1 },
  { id: 'CFG-130', table: 'Control', field: 'Effectiveness', value: 'effective',           status: 'Active', sortOrder: 2 },
  { id: 'CFG-131', table: 'Control', field: 'Effectiveness', value: 'partially_effective', status: 'Active', sortOrder: 3 },
  { id: 'CFG-132', table: 'Control', field: 'Effectiveness', value: 'ineffective',         status: 'Active', sortOrder: 4 },
  { id: 'CFG-133', table: 'Control', field: 'Department', value: 'Technology', status: 'Active', sortOrder: 1 },
  { id: 'CFG-134', table: 'Control', field: 'Department', value: 'Operations', status: 'Active', sortOrder: 2 },
  { id: 'CFG-135', table: 'Control', field: 'Department', value: 'Finance',    status: 'Active', sortOrder: 3 },
  { id: 'CFG-136', table: 'Control', field: 'Department', value: 'Compliance', status: 'Active', sortOrder: 4 },
  { id: 'CFG-137', table: 'Control', field: 'Department', value: 'Legal',      status: 'Active', sortOrder: 5 },
  { id: 'CFG-138', table: 'Control', field: 'Department', value: 'HR',         status: 'Active', sortOrder: 6 },
  { id: 'CFG-139', table: 'Control', field: 'Department', value: 'Sales',      status: 'Active', sortOrder: 7 },
  { id: 'CFG-140', table: 'Control', field: 'Department', value: 'Marketing',  status: 'Active', sortOrder: 8 },
  { id: 'CFG-141', table: 'Control', field: 'Department', value: 'Strategy',   status: 'Active', sortOrder: 9 },
  { id: 'CFG-142', table: 'Control', field: 'Department', value: 'Facilities', status: 'Active', sortOrder: 10 },

  // ─── Risk ────────────────────────────────────────────────────────────────────
  { id: 'CFG-143', table: 'Risk', field: 'Status', value: 'draft',    status: 'Active', sortOrder: 1 },
  { id: 'CFG-144', table: 'Risk', field: 'Status', value: 'active',   status: 'Active', sortOrder: 2 },
  { id: 'CFG-145', table: 'Risk', field: 'Status', value: 'closed',   status: 'Active', sortOrder: 3 },
  { id: 'CFG-146', table: 'Risk', field: 'Status', value: 'archived', status: 'Active', sortOrder: 4 },
  { id: 'CFG-147', table: 'Risk', field: 'Type', value: 'strategic',    status: 'Active', sortOrder: 1 },
  { id: 'CFG-148', table: 'Risk', field: 'Type', value: 'operational',  status: 'Active', sortOrder: 2 },
  { id: 'CFG-149', table: 'Risk', field: 'Type', value: 'financial',    status: 'Active', sortOrder: 3 },
  { id: 'CFG-150', table: 'Risk', field: 'Type', value: 'compliance',   status: 'Active', sortOrder: 4 },
  { id: 'CFG-151', table: 'Risk', field: 'Type', value: 'reputational', status: 'Active', sortOrder: 5 },
  { id: 'CFG-152', table: 'Risk', field: 'Type', value: 'cyber',        status: 'Active', sortOrder: 6 },
  { id: 'CFG-153', table: 'Risk', field: 'Appetite Level', value: 'averse',   status: 'Active', sortOrder: 1 },
  { id: 'CFG-154', table: 'Risk', field: 'Appetite Level', value: 'minimal',  status: 'Active', sortOrder: 2 },
  { id: 'CFG-155', table: 'Risk', field: 'Appetite Level', value: 'cautious', status: 'Active', sortOrder: 3 },
  { id: 'CFG-156', table: 'Risk', field: 'Appetite Level', value: 'open',     status: 'Active', sortOrder: 4 },
  { id: 'CFG-157', table: 'Risk', field: 'Appetite Level', value: 'hungry',   status: 'Active', sortOrder: 5 },
  { id: 'CFG-158', table: 'Risk', field: 'Review Frequency', value: 'monthly',     status: 'Active', sortOrder: 1 },
  { id: 'CFG-159', table: 'Risk', field: 'Review Frequency', value: 'quarterly',   status: 'Active', sortOrder: 2 },
  { id: 'CFG-160', table: 'Risk', field: 'Review Frequency', value: 'semi_annual', status: 'Active', sortOrder: 3 },
  { id: 'CFG-161', table: 'Risk', field: 'Review Frequency', value: 'annual',      status: 'Active', sortOrder: 4 },
  { id: 'CFG-162', table: 'Risk', field: 'Department', value: 'Technology', status: 'Active', sortOrder: 1 },
  { id: 'CFG-163', table: 'Risk', field: 'Department', value: 'Operations', status: 'Active', sortOrder: 2 },
  { id: 'CFG-164', table: 'Risk', field: 'Department', value: 'Finance',    status: 'Active', sortOrder: 3 },
  { id: 'CFG-165', table: 'Risk', field: 'Department', value: 'Compliance', status: 'Active', sortOrder: 4 },
  { id: 'CFG-166', table: 'Risk', field: 'Department', value: 'Legal',      status: 'Active', sortOrder: 5 },
  { id: 'CFG-167', table: 'Risk', field: 'Department', value: 'HR',         status: 'Active', sortOrder: 6 },
  { id: 'CFG-168', table: 'Risk', field: 'Department', value: 'Sales',      status: 'Active', sortOrder: 7 },
  { id: 'CFG-169', table: 'Risk', field: 'Department', value: 'Marketing',  status: 'Active', sortOrder: 8 },
  { id: 'CFG-170', table: 'Risk', field: 'Department', value: 'Strategy',   status: 'Active', sortOrder: 9 },
  { id: 'CFG-171', table: 'Risk', field: 'Department', value: 'Facilities', status: 'Active', sortOrder: 10 },

  // ─── Mitigation ──────────────────────────────────────────────────────────────
  { id: 'CFG-172', table: 'Mitigation', field: 'Action Type', value: 'mitigate', status: 'Active', sortOrder: 1 },
  { id: 'CFG-173', table: 'Mitigation', field: 'Action Type', value: 'accept',   status: 'Active', sortOrder: 2 },
  { id: 'CFG-174', table: 'Mitigation', field: 'Action Type', value: 'transfer', status: 'Active', sortOrder: 3 },
  { id: 'CFG-175', table: 'Mitigation', field: 'Action Type', value: 'avoid',    status: 'Active', sortOrder: 4 },
  { id: 'CFG-176', table: 'Mitigation', field: 'Priority', value: 'critical', status: 'Active', sortOrder: 1 },
  { id: 'CFG-177', table: 'Mitigation', field: 'Priority', value: 'high',     status: 'Active', sortOrder: 2 },
  { id: 'CFG-178', table: 'Mitigation', field: 'Priority', value: 'medium',   status: 'Active', sortOrder: 3 },
  { id: 'CFG-179', table: 'Mitigation', field: 'Priority', value: 'low',      status: 'Active', sortOrder: 4 },
  { id: 'CFG-180', table: 'Mitigation', field: 'Status', value: 'open',        status: 'Active', sortOrder: 1 },
  { id: 'CFG-181', table: 'Mitigation', field: 'Status', value: 'in_progress', status: 'Active', sortOrder: 2 },
  { id: 'CFG-182', table: 'Mitigation', field: 'Status', value: 'complete',    status: 'Active', sortOrder: 3 },
  { id: 'CFG-183', table: 'Mitigation', field: 'Status', value: 'deferred',    status: 'Active', sortOrder: 4 },
  { id: 'CFG-184', table: 'Mitigation', field: 'Status', value: 'cancelled',   status: 'Active', sortOrder: 5 },

  // ─── Product (Benefits or Services) ──────────────────────────────────────────
  { id: 'CFG-185', table: 'Product', field: 'Status', value: 'Active',  status: 'Active', sortOrder: 1 },
  { id: 'CFG-186', table: 'Product', field: 'Status', value: 'Draft',   status: 'Active', sortOrder: 2 },
  { id: 'CFG-187', table: 'Product', field: 'Status', value: 'Sunset',  status: 'Active', sortOrder: 3 },
  { id: 'CFG-188', table: 'Product', field: 'Status', value: 'Retired', status: 'Active', sortOrder: 4 },
  { id: 'CFG-189', table: 'Product', field: 'Benefit Category', value: 'Defined Contribution Plan',   status: 'Active', sortOrder: 1 },
  { id: 'CFG-190', table: 'Product', field: 'Benefit Category', value: 'Defined Benefit Plan',        status: 'Active', sortOrder: 2 },
  { id: 'CFG-191', table: 'Product', field: 'Benefit Category', value: 'Active Employee Health Plan', status: 'Active', sortOrder: 3 },
  { id: 'CFG-192', table: 'Product', field: 'Benefit Category', value: 'Retiree Health Plan',         status: 'Active', sortOrder: 4 },
  { id: 'CFG-193', table: 'Product', field: 'Benefit Category', value: 'Life Insurance',              status: 'Active', sortOrder: 5 },
  { id: 'CFG-194', table: 'Product', field: 'Benefit Category', value: 'Disability Insurance',        status: 'Active', sortOrder: 6 },
  { id: 'CFG-195', table: 'Product', field: 'Benefit Category', value: 'Dental Plan',                 status: 'Active', sortOrder: 7 },
  { id: 'CFG-196', table: 'Product', field: 'Benefit Category', value: 'Vision Plan',                 status: 'Active', sortOrder: 8 },
  { id: 'CFG-197', table: 'Product', field: 'Benefit Category', value: 'HSA / FSA',                   status: 'Active', sortOrder: 9 },
  { id: 'CFG-198', table: 'Product', field: 'Benefit Category', value: 'Wellness Program',            status: 'Active', sortOrder: 10 },
  { id: 'CFG-199', table: 'Product', field: 'Benefit Category', value: 'Other Benefit',               status: 'Active', sortOrder: 11 },
  { id: 'CFG-200', table: 'Product', field: 'Service Category', value: 'Mental Health Navigation', status: 'Active', sortOrder: 1 },
  { id: 'CFG-201', table: 'Product', field: 'Service Category', value: 'Financial Planning',       status: 'Active', sortOrder: 2 },
  { id: 'CFG-202', table: 'Product', field: 'Service Category', value: 'Benefits Administration', status: 'Active', sortOrder: 3 },
  { id: 'CFG-203', table: 'Product', field: 'Service Category', value: 'Claims Processing',       status: 'Active', sortOrder: 4 },
  { id: 'CFG-204', table: 'Product', field: 'Service Category', value: 'Member Support',          status: 'Active', sortOrder: 5 },
  { id: 'CFG-205', table: 'Product', field: 'Service Category', value: 'Enrollment Services',     status: 'Active', sortOrder: 6 },
  { id: 'CFG-206', table: 'Product', field: 'Service Category', value: 'Data Analytics',          status: 'Active', sortOrder: 7 },
  { id: 'CFG-207', table: 'Product', field: 'Service Category', value: 'Compliance Advisory',     status: 'Active', sortOrder: 8 },
  { id: 'CFG-208', table: 'Product', field: 'Service Category', value: 'Other Service',           status: 'Active', sortOrder: 9 },

  // ─── Assessment ──────────────────────────────────────────────────────────────
  { id: 'CFG-209', table: 'Assessment', field: 'Type', value: 'periodic',  status: 'Active', sortOrder: 1 },
  { id: 'CFG-210', table: 'Assessment', field: 'Type', value: 'triggered', status: 'Active', sortOrder: 2 },
  { id: 'CFG-211', table: 'Assessment', field: 'Type', value: 'ad_hoc',    status: 'Active', sortOrder: 3 },

  // ─── Contact ─────────────────────────────────────────────────────────────────
  { id: 'CFG-212', table: 'Contact', field: 'Type', value: 'External', status: 'Active', sortOrder: 1 },
  { id: 'CFG-213', table: 'Contact', field: 'Type', value: 'Internal', status: 'Active', sortOrder: 2 },

  // ─── Framework ───────────────────────────────────────────────────────────────
  { id: 'CFG-214', table: 'Framework', field: 'Status', value: 'active', status: 'Active', sortOrder: 1 },
  { id: 'CFG-215', table: 'Framework', field: 'Status', value: 'sunset', status: 'Active', sortOrder: 2 },
  { id: 'CFG-216', table: 'Framework', field: 'Status', value: 'draft',  status: 'Active', sortOrder: 3 },

  // ─── Compliance ───────────────────────────────────────────────────────────────
  { id: 'CFG-217', table: 'Compliance', field: 'Implementation Status', value: 'not_started',    status: 'Active', sortOrder: 1 },
  { id: 'CFG-218', table: 'Compliance', field: 'Implementation Status', value: 'in_progress',    status: 'Active', sortOrder: 2 },
  { id: 'CFG-219', table: 'Compliance', field: 'Implementation Status', value: 'implemented',    status: 'Active', sortOrder: 3 },
  { id: 'CFG-220', table: 'Compliance', field: 'Implementation Status', value: 'not_applicable', status: 'Active', sortOrder: 4 },

  // ─── Regulation ──────────────────────────────────────────────────────────────
  { id: 'CFG-221', table: 'Regulation', field: 'Regulatory Body', value: 'SEC - Securities and Exchange Commission',      status: 'Active', sortOrder: 1 },
  { id: 'CFG-222', table: 'Regulation', field: 'Regulatory Body', value: 'FINRA - Financial Industry Regulatory Authority', status: 'Active', sortOrder: 2 },
  { id: 'CFG-223', table: 'Regulation', field: 'Regulatory Body', value: 'FDA - Food and Drug Administration',           status: 'Active', sortOrder: 3 },
  { id: 'CFG-224', table: 'Regulation', field: 'Regulatory Body', value: 'EPA - Environmental Protection Agency',        status: 'Active', sortOrder: 4 },
  { id: 'CFG-225', table: 'Regulation', field: 'Regulatory Body', value: 'OSHA - Occupational Safety and Health Administration', status: 'Active', sortOrder: 5 },
  { id: 'CFG-226', table: 'Regulation', field: 'Regulatory Body', value: 'FTC - Federal Trade Commission',              status: 'Active', sortOrder: 6 },
  { id: 'CFG-227', table: 'Regulation', field: 'Regulatory Body', value: 'CFPB - Consumer Financial Protection Bureau',  status: 'Active', sortOrder: 7 },
  { id: 'CFG-228', table: 'Regulation', field: 'Regulatory Body', value: 'EU Parliament',                               status: 'Active', sortOrder: 8 },
  { id: 'CFG-229', table: 'Regulation', field: 'Regulatory Body', value: 'FCA - UK Financial Conduct Authority',        status: 'Active', sortOrder: 9 },
  { id: 'CFG-230', table: 'Regulation', field: 'Regulatory Body', value: 'GDPR - EU Data Protection',                   status: 'Active', sortOrder: 10 },
  { id: 'CFG-231', table: 'Regulation', field: 'Regulatory Body', value: 'CCPA - California Consumer Privacy Act',      status: 'Active', sortOrder: 11 },
  { id: 'CFG-232', table: 'Regulation', field: 'Regulatory Body', value: 'SOX - Sarbanes-Oxley',                        status: 'Active', sortOrder: 12 },
  { id: 'CFG-233', table: 'Regulation', field: 'Regulatory Body', value: 'HIPAA - Health Insurance Portability',        status: 'Active', sortOrder: 13 },
  { id: 'CFG-234', table: 'Regulation', field: 'Regulatory Body', value: 'PCI DSS - Payment Card Industry',             status: 'Active', sortOrder: 14 },
  { id: 'CFG-235', table: 'Regulation', field: 'Regulatory Body', value: 'ISO/IEC Standards Body',                      status: 'Active', sortOrder: 15 },
  { id: 'CFG-236', table: 'Regulation', field: 'Regulatory Body', value: 'NIST - National Institute of Standards',      status: 'Active', sortOrder: 16 },
  { id: 'CFG-237', table: 'Regulation', field: 'Regulatory Body', value: 'Internal Policy',                             status: 'Active', sortOrder: 17 },
  { id: 'CFG-238', table: 'Regulation', field: 'Regulatory Body', value: 'Federal - USA',                               status: 'Active', sortOrder: 18 },

  { id: 'CFG-239', table: 'Regulation', field: 'Jurisdiction', value: 'Federal - USA',           status: 'Active', sortOrder: 1 },
  { id: 'CFG-240', table: 'Regulation', field: 'Jurisdiction', value: 'European Union',          status: 'Active', sortOrder: 2 },
  { id: 'CFG-241', table: 'Regulation', field: 'Jurisdiction', value: 'United Kingdom',          status: 'Active', sortOrder: 3 },
  { id: 'CFG-242', table: 'Regulation', field: 'Jurisdiction', value: 'California',              status: 'Active', sortOrder: 4 },
  { id: 'CFG-243', table: 'Regulation', field: 'Jurisdiction', value: 'New York',                status: 'Active', sortOrder: 5 },
  { id: 'CFG-244', table: 'Regulation', field: 'Jurisdiction', value: 'Texas',                   status: 'Active', sortOrder: 6 },
  { id: 'CFG-245', table: 'Regulation', field: 'Jurisdiction', value: 'Delaware',                status: 'Active', sortOrder: 7 },
  { id: 'CFG-246', table: 'Regulation', field: 'Jurisdiction', value: 'International',           status: 'Active', sortOrder: 8 },
  { id: 'CFG-247', table: 'Regulation', field: 'Jurisdiction', value: 'Multi-jurisdictional',    status: 'Active', sortOrder: 9 },
  { id: 'CFG-248', table: 'Regulation', field: 'Jurisdiction', value: 'State - Other',           status: 'Active', sortOrder: 10 },
  { id: 'CFG-249', table: 'Regulation', field: 'Jurisdiction', value: 'Municipal',               status: 'Active', sortOrder: 11 },

  { id: 'CFG-250', table: 'Regulation', field: 'Category', value: 'Financial Reporting',      status: 'Active', sortOrder: 1 },
  { id: 'CFG-251', table: 'Regulation', field: 'Category', value: 'Data Privacy',             status: 'Active', sortOrder: 2 },
  { id: 'CFG-252', table: 'Regulation', field: 'Category', value: 'Securities',               status: 'Active', sortOrder: 3 },
  { id: 'CFG-253', table: 'Regulation', field: 'Category', value: 'Environmental',            status: 'Active', sortOrder: 4 },
  { id: 'CFG-254', table: 'Regulation', field: 'Category', value: 'Health & Safety',          status: 'Active', sortOrder: 5 },
  { id: 'CFG-255', table: 'Regulation', field: 'Category', value: 'Labor & Employment',       status: 'Active', sortOrder: 6 },
  { id: 'CFG-256', table: 'Regulation', field: 'Category', value: 'Consumer Protection',      status: 'Active', sortOrder: 7 },
  { id: 'CFG-257', table: 'Regulation', field: 'Category', value: 'Anti-Money Laundering',    status: 'Active', sortOrder: 8 },
  { id: 'CFG-258', table: 'Regulation', field: 'Category', value: 'Cybersecurity',            status: 'Active', sortOrder: 9 },
  { id: 'CFG-259', table: 'Regulation', field: 'Category', value: 'Industry-Specific',        status: 'Active', sortOrder: 10 },

  { id: 'CFG-260', table: 'Regulation', field: 'Document Type', value: 'Legislation Text',       status: 'Active', sortOrder: 1 },
  { id: 'CFG-261', table: 'Regulation', field: 'Document Type', value: 'Amendment',              status: 'Active', sortOrder: 2 },
  { id: 'CFG-262', table: 'Regulation', field: 'Document Type', value: 'Impact Assessment',      status: 'Active', sortOrder: 3 },
  { id: 'CFG-263', table: 'Regulation', field: 'Document Type', value: 'Legal Opinion',          status: 'Active', sortOrder: 4 },
  { id: 'CFG-264', table: 'Regulation', field: 'Document Type', value: 'Implementation Guide',   status: 'Active', sortOrder: 5 },
  { id: 'CFG-265', table: 'Regulation', field: 'Document Type', value: 'Gap Analysis',           status: 'Active', sortOrder: 6 },
  { id: 'CFG-266', table: 'Regulation', field: 'Document Type', value: 'Compliance Report',      status: 'Active', sortOrder: 7 },
  { id: 'CFG-267', table: 'Regulation', field: 'Document Type', value: 'Evidence Documentation', status: 'Active', sortOrder: 8 },
  { id: 'CFG-268', table: 'Regulation', field: 'Document Type', value: 'Correspondence',         status: 'Active', sortOrder: 9 },
  { id: 'CFG-269', table: 'Regulation', field: 'Document Type', value: 'Committee Report',       status: 'Active', sortOrder: 10 },
  { id: 'CFG-270', table: 'Regulation', field: 'Document Type', value: 'Regulatory Notice',      status: 'Active', sortOrder: 11 },
  { id: 'CFG-271', table: 'Regulation', field: 'Document Type', value: 'Other',                  status: 'Active', sortOrder: 12 },

  // ─── Checklist ───────────────────────────────────────────────────────────────
  { id: 'CFG-272', table: 'Checklist', field: 'Activity Type', value: 'Due Diligence', status: 'Active', sortOrder: 1 },
  { id: 'CFG-273', table: 'Checklist', field: 'Activity Type', value: 'Monitoring',     status: 'Active', sortOrder: 2 },
  { id: 'CFG-274', table: 'Checklist', field: 'Activity Type', value: 'Assessment',     status: 'Active', sortOrder: 3 },
  { id: 'CFG-275', table: 'Checklist', field: 'Activity Type', value: 'Review',         status: 'Active', sortOrder: 4 },
  { id: 'CFG-276', table: 'Checklist', field: 'Activity Type', value: 'Audit',          status: 'Active', sortOrder: 5 },
  { id: 'CFG-277', table: 'Checklist', field: 'Activity Type', value: 'Verification',   status: 'Active', sortOrder: 6 },
];