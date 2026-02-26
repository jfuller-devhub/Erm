import { generateId } from './mockData';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface FrameworkRequirement {
  id: string;
  frameworkId: string;
  parentRequirementId: string;       // '' for top-level domains
  referenceCode: string;             // e.g. '01.b', 'CC6.1', 'A.9.2.1'
  title: string;
  description: string;
  domain: string;                    // Top-level grouping label
  maturityLevel: number | null;      // For HITRUST implementation levels (1-3)
  isRequired: boolean;
  sortOrder: number;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_framework_requirements_v1';

function sanitizeRequirement(r: any): FrameworkRequirement {
  return {
    id: r.id ?? 'REQ-' + generateId(),
    frameworkId: r.frameworkId ?? '',
    parentRequirementId: r.parentRequirementId ?? '',
    referenceCode: r.referenceCode ?? '',
    title: r.title ?? '',
    description: r.description ?? '',
    domain: r.domain ?? '',
    maturityLevel: typeof r.maturityLevel === 'number' ? r.maturityLevel : null,
    isRequired: typeof r.isRequired === 'boolean' ? r.isRequired : true,
    sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0,
  };
}

export function loadRequirements(): FrameworkRequirement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeRequirement);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_REQUIREMENTS;
  saveRequirements(seed);
  return seed;
}

export function saveRequirements(requirements: FrameworkRequirement[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirements));
}

/** Get all requirements for a framework */
export function getRequirementsForFramework(
  requirements: FrameworkRequirement[],
  frameworkId: string,
): FrameworkRequirement[] {
  return requirements
    .filter(r => r.frameworkId === frameworkId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get top-level domain requirements (no parent) for a framework */
export function getDomainRequirements(
  requirements: FrameworkRequirement[],
  frameworkId: string,
): FrameworkRequirement[] {
  return requirements
    .filter(r => r.frameworkId === frameworkId && r.parentRequirementId === '')
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Get child requirements for a given parent */
export function getChildRequirements(
  requirements: FrameworkRequirement[],
  parentId: string,
): FrameworkRequirement[] {
  return requirements
    .filter(r => r.parentRequirementId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

// We use a flat list with parentRequirementId references for the tree.
// Domains have parentRequirementId = '' (top-level).
// Leaf requirements have a parentRequirementId pointing to their domain.

export const SEED_REQUIREMENTS: FrameworkRequirement[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // FWK-001: HITRUST CSF v11.3
  // ═══════════════════════════════════════════════════════════════════════════

  // Domain: 01 – Access Control
  {
    id: 'REQ-H-01',
    frameworkId: 'FWK-001',
    parentRequirementId: '',
    referenceCode: '01',
    title: 'Access Control',
    description: 'Policies and controls governing user access to information assets, including identification, authentication, and authorization.',
    domain: 'Access Control',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 100,
  },
  {
    id: 'REQ-H-01a',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-01',
    referenceCode: '01.a',
    title: 'Access Control Policy',
    description: 'Establish, document, and review an access control policy based on business and security requirements.',
    domain: 'Access Control',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 101,
  },
  {
    id: 'REQ-H-01b',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-01',
    referenceCode: '01.b',
    title: 'User Registration and De-registration',
    description: 'A formal user registration and de-registration procedure shall be implemented for granting and revoking access to all information systems and services.',
    domain: 'Access Control',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 102,
  },
  {
    id: 'REQ-H-01c',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-01',
    referenceCode: '01.c',
    title: 'Privilege Management',
    description: 'The allocation and use of privileges shall be restricted and controlled. Privileged access rights shall be reviewed at regular intervals.',
    domain: 'Access Control',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 103,
  },

  // Domain: 09 – Information Transfer
  {
    id: 'REQ-H-09',
    frameworkId: 'FWK-001',
    parentRequirementId: '',
    referenceCode: '09',
    title: 'Information Transfer',
    description: 'Controls to protect information in transit, including encryption, secure protocols, and data exchange agreements.',
    domain: 'Information Transfer',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 200,
  },
  {
    id: 'REQ-H-09aa',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-09',
    referenceCode: '09.aa',
    title: 'Audit Logging',
    description: 'Audit logs recording user activities, exceptions, and security events shall be produced, kept, and regularly reviewed.',
    domain: 'Information Transfer',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 201,
  },
  {
    id: 'REQ-H-09ab',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-09',
    referenceCode: '09.ab',
    title: 'Monitoring System Use',
    description: 'Procedures for monitoring the use of information processing facilities shall be established and the results of monitoring activities reviewed regularly.',
    domain: 'Information Transfer',
    maturityLevel: 2,
    isRequired: true,
    sortOrder: 202,
  },

  // Domain: 10 – Information Systems Acquisition
  {
    id: 'REQ-H-10',
    frameworkId: 'FWK-001',
    parentRequirementId: '',
    referenceCode: '10',
    title: 'Information Systems Acquisition, Development and Maintenance',
    description: 'Security requirements for information systems, including secure development lifecycle, change management, and testing.',
    domain: 'Systems Acquisition',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 300,
  },
  {
    id: 'REQ-H-10a',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-10',
    referenceCode: '10.a',
    title: 'Security Requirements Analysis',
    description: 'Information security requirements shall be included in the requirements for new information systems or enhancements to existing information systems.',
    domain: 'Systems Acquisition',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 301,
  },
  {
    id: 'REQ-H-10b',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-10',
    referenceCode: '10.b',
    title: 'Change Control Procedures',
    description: 'Changes to information systems within the development lifecycle shall be controlled by the use of formal change control procedures.',
    domain: 'Systems Acquisition',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 302,
  },

  // Domain: 11 – Business Continuity
  {
    id: 'REQ-H-11',
    frameworkId: 'FWK-001',
    parentRequirementId: '',
    referenceCode: '11',
    title: 'Business Continuity Management',
    description: 'Planning and testing for maintaining business operations during adverse events.',
    domain: 'Business Continuity',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 400,
  },
  {
    id: 'REQ-H-11a',
    frameworkId: 'FWK-001',
    parentRequirementId: 'REQ-H-11',
    referenceCode: '11.a',
    title: 'Including InfoSec in Business Continuity',
    description: 'Information security shall be embedded within the organization\'s business continuity management processes.',
    domain: 'Business Continuity',
    maturityLevel: 1,
    isRequired: true,
    sortOrder: 401,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FWK-002: ISO 27001:2022
  // ═══════════════════════════════════════════════════════════════════════════

  // Domain: A.6 – People Controls
  {
    id: 'REQ-I-A6',
    frameworkId: 'FWK-002',
    parentRequirementId: '',
    referenceCode: 'A.6',
    title: 'People Controls',
    description: 'Controls relating to human resource security including screening, terms of employment, awareness, training, and disciplinary processes.',
    domain: 'People Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 100,
  },
  {
    id: 'REQ-I-A6.3',
    frameworkId: 'FWK-002',
    parentRequirementId: 'REQ-I-A6',
    referenceCode: 'A.6.3',
    title: 'Information Security Awareness, Education and Training',
    description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness education and training and regular updates of the organization\'s information security policy.',
    domain: 'People Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 101,
  },

  // Domain: A.8 – Technological Controls
  {
    id: 'REQ-I-A8',
    frameworkId: 'FWK-002',
    parentRequirementId: '',
    referenceCode: 'A.8',
    title: 'Technological Controls',
    description: 'Technology-specific controls including access management, cryptography, secure development, vulnerability management, logging, and network security.',
    domain: 'Technological Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 200,
  },
  {
    id: 'REQ-I-A8.2',
    frameworkId: 'FWK-002',
    parentRequirementId: 'REQ-I-A8',
    referenceCode: 'A.8.2',
    title: 'Privileged Access Rights',
    description: 'The allocation and use of privileged access rights shall be restricted and managed.',
    domain: 'Technological Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 201,
  },
  {
    id: 'REQ-I-A8.15',
    frameworkId: 'FWK-002',
    parentRequirementId: 'REQ-I-A8',
    referenceCode: 'A.8.15',
    title: 'Logging',
    description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analyzed.',
    domain: 'Technological Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 202,
  },
  {
    id: 'REQ-I-A8.22',
    frameworkId: 'FWK-002',
    parentRequirementId: 'REQ-I-A8',
    referenceCode: 'A.8.22',
    title: 'Web Filtering',
    description: 'Access to external websites shall be managed to reduce exposure to malicious content.',
    domain: 'Technological Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 203,
  },

  // Domain: A.5 – Organizational Controls
  {
    id: 'REQ-I-A5',
    frameworkId: 'FWK-002',
    parentRequirementId: '',
    referenceCode: 'A.5',
    title: 'Organizational Controls',
    description: 'Organizational-level policies, roles, responsibilities, and management practices for information security.',
    domain: 'Organizational Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 300,
  },
  {
    id: 'REQ-I-A5.31',
    frameworkId: 'FWK-002',
    parentRequirementId: 'REQ-I-A5',
    referenceCode: 'A.5.31',
    title: 'Legal, Statutory, Regulatory and Contractual Requirements',
    description: 'Legal, statutory, regulatory and contractual requirements relevant to information security and the organization\'s approach to meet these requirements shall be identified, documented and kept up to date.',
    domain: 'Organizational Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 301,
  },
  {
    id: 'REQ-I-A5.34',
    frameworkId: 'FWK-002',
    parentRequirementId: 'REQ-I-A5',
    referenceCode: 'A.5.34',
    title: 'Privacy and Protection of PII',
    description: 'The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII as applicable.',
    domain: 'Organizational Controls',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 302,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FWK-003: SOC 2 Type II
  // ═══════════════════════════════════════════════════════════════════════════

  // Domain: CC5 – Control Activities
  {
    id: 'REQ-S-CC5',
    frameworkId: 'FWK-003',
    parentRequirementId: '',
    referenceCode: 'CC5',
    title: 'Control Activities',
    description: 'Actions established through policies and procedures that help ensure management\'s directives to mitigate risks to the achievement of objectives are carried out.',
    domain: 'Control Activities',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 100,
  },
  {
    id: 'REQ-S-CC5.2',
    frameworkId: 'FWK-003',
    parentRequirementId: 'REQ-S-CC5',
    referenceCode: 'CC5.2',
    title: 'Segregation of Duties',
    description: 'COSO Principle 10: The entity selects and develops control activities that contribute to the mitigation of risks to the achievement of objectives to acceptable levels, including segregation of incompatible duties.',
    domain: 'Control Activities',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 101,
  },

  // Domain: CC6 – Logical and Physical Access
  {
    id: 'REQ-S-CC6',
    frameworkId: 'FWK-003',
    parentRequirementId: '',
    referenceCode: 'CC6',
    title: 'Logical and Physical Access Controls',
    description: 'Controls over the logical and physical access to system components, including identity management, authentication, and authorization.',
    domain: 'Logical & Physical Access',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 200,
  },
  {
    id: 'REQ-S-CC6.1',
    frameworkId: 'FWK-003',
    parentRequirementId: 'REQ-S-CC6',
    referenceCode: 'CC6.1',
    title: 'Logical Access Security',
    description: 'The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.',
    domain: 'Logical & Physical Access',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 201,
  },
  {
    id: 'REQ-S-CC6.3',
    frameworkId: 'FWK-003',
    parentRequirementId: 'REQ-S-CC6',
    referenceCode: 'CC6.3',
    title: 'Role-based Access and Least Privilege',
    description: 'The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles, responsibilities, or the system design and changes.',
    domain: 'Logical & Physical Access',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 202,
  },

  // Domain: CC9 – Risk Mitigation
  {
    id: 'REQ-S-CC9',
    frameworkId: 'FWK-003',
    parentRequirementId: '',
    referenceCode: 'CC9',
    title: 'Risk Mitigation',
    description: 'The entity identifies, selects, and develops risk mitigation activities for risks arising from potential business disruptions.',
    domain: 'Risk Mitigation',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 300,
  },
  {
    id: 'REQ-S-CC9.2',
    frameworkId: 'FWK-003',
    parentRequirementId: 'REQ-S-CC9',
    referenceCode: 'CC9.2',
    title: 'Vendor and Business Partner Risk',
    description: 'The entity assesses and manages risks associated with vendors and business partners.',
    domain: 'Risk Mitigation',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 301,
  },

  // Domain: A1 – Availability
  {
    id: 'REQ-S-A1',
    frameworkId: 'FWK-003',
    parentRequirementId: '',
    referenceCode: 'A1',
    title: 'Additional Criteria for Availability',
    description: 'The entity maintains, monitors, and evaluates current processing capacity and use of system components to manage capacity demand and enable the implementation of additional capacity.',
    domain: 'Availability',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 400,
  },
  {
    id: 'REQ-S-A1.2',
    frameworkId: 'FWK-003',
    parentRequirementId: 'REQ-S-A1',
    referenceCode: 'A1.2',
    title: 'Environmental Protections and Recovery',
    description: 'The entity authorizes, designs, develops or acquires, implements, operates, approves, maintains, and monitors environmental protections, software, data back-up processes, and recovery infrastructure.',
    domain: 'Availability',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 401,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FWK-004: NIST CSF 2.0
  // ═══════════════════════════════════════════════════════════════════════════

  // Function: Identify (ID)
  {
    id: 'REQ-N-ID',
    frameworkId: 'FWK-004',
    parentRequirementId: '',
    referenceCode: 'ID',
    title: 'Identify',
    description: 'Develop an organizational understanding to manage cybersecurity risk to systems, people, assets, data, and capabilities.',
    domain: 'Identify',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 100,
  },
  {
    id: 'REQ-N-ID.SC-4',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-ID',
    referenceCode: 'ID.SC-4',
    title: 'Supply Chain Risk Assessment',
    description: 'Suppliers and third-party partners are routinely assessed using audits, test results, or other forms of evaluations to confirm they are meeting their contractual obligations.',
    domain: 'Identify',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 101,
  },

  // Function: Protect (PR)
  {
    id: 'REQ-N-PR',
    frameworkId: 'FWK-004',
    parentRequirementId: '',
    referenceCode: 'PR',
    title: 'Protect',
    description: 'Develop and implement appropriate safeguards to ensure delivery of critical services.',
    domain: 'Protect',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 200,
  },
  {
    id: 'REQ-N-PR.AC-1',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-PR',
    referenceCode: 'PR.AC-1',
    title: 'Identities and Credentials',
    description: 'Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users, and processes.',
    domain: 'Protect',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 201,
  },
  {
    id: 'REQ-N-PR.AT-1',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-PR',
    referenceCode: 'PR.AT-1',
    title: 'Awareness and Training',
    description: 'All users are informed and trained to perform their information security related duties and responsibilities.',
    domain: 'Protect',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 202,
  },

  // Function: Detect (DE)
  {
    id: 'REQ-N-DE',
    frameworkId: 'FWK-004',
    parentRequirementId: '',
    referenceCode: 'DE',
    title: 'Detect',
    description: 'Develop and implement appropriate activities to identify the occurrence of a cybersecurity event.',
    domain: 'Detect',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 300,
  },
  {
    id: 'REQ-N-DE.CM-4',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-DE',
    referenceCode: 'DE.CM-4',
    title: 'Malicious Code Detection',
    description: 'Malicious code is detected and reported.',
    domain: 'Detect',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 301,
  },

  // Function: Respond (RS)
  {
    id: 'REQ-N-RS',
    frameworkId: 'FWK-004',
    parentRequirementId: '',
    referenceCode: 'RS',
    title: 'Respond',
    description: 'Develop and implement appropriate activities to take action regarding a detected cybersecurity incident.',
    domain: 'Respond',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 400,
  },
  {
    id: 'REQ-N-RS.RP-1',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-RS',
    referenceCode: 'RS.RP-1',
    title: 'Response Planning',
    description: 'Response plan is executed during or after a cybersecurity incident.',
    domain: 'Respond',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 401,
  },

  // Function: Recover (RC)
  {
    id: 'REQ-N-RC',
    frameworkId: 'FWK-004',
    parentRequirementId: '',
    referenceCode: 'RC',
    title: 'Recover',
    description: 'Develop and implement appropriate activities to maintain plans for resilience and restore any capabilities or services impaired due to a cybersecurity incident.',
    domain: 'Recover',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 500,
  },
  {
    id: 'REQ-N-RC.RP-1',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-RC',
    referenceCode: 'RC.RP-1',
    title: 'Recovery Planning',
    description: 'Recovery plan is executed during or after a cybersecurity incident.',
    domain: 'Recover',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 501,
  },

  // Function: Protect (PR) - Network
  {
    id: 'REQ-N-PR.PT-4',
    frameworkId: 'FWK-004',
    parentRequirementId: 'REQ-N-PR',
    referenceCode: 'PR.PT-4',
    title: 'Communications and Control Network Protection',
    description: 'Communications and control networks are protected.',
    domain: 'Protect',
    maturityLevel: null,
    isRequired: true,
    sortOrder: 203,
  },
];
