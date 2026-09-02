// ─── Types ───────────────────────────────────────────────────────────────────

export type DocumentType =
  | 'regulation-text'
  | 'guidance'
  | 'legal-opinion'
  | 'impact-assessment'
  | 'internal-memo'
  | 'training-material'
  | 'audit-report'
  | 'correspondence'
  | 'other';

export interface RegulationDocument {
  id: string;                        // e.g., "DOC-001"
  regulationId: string;              // Parent regulation
  
  // File info
  fileName: string;
  fileSize: number;                  // bytes
  fileType: string;                  // MIME type or extension
  uploadedDate: string;
  
  // Metadata
  documentType: DocumentType;
  version: string;
  description: string;
  isOfficial: boolean;               // Official regulatory document
  tags: string[];
  
  // Versioning
  previousVersionId: string | null;  // Link to previous version
  
  // Mock file storage (in production would be actual file/blob)
  fileUrl: string | null;            // Simulated URL
  
  // Audit
  uploadedBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Labels & Styles ─────────────────────────────────────────────────────────

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'regulation-text': 'Regulation Text',
  guidance: 'Guidance',
  'legal-opinion': 'Legal Opinion',
  'impact-assessment': 'Impact Assessment',
  'internal-memo': 'Internal Memo',
  'training-material': 'Training Material',
  'audit-report': 'Audit Report',
  correspondence: 'Correspondence',
  other: 'Other',
};

export const DOCUMENT_TYPE_STYLES: Record<DocumentType, { background: string; color: string }> = {
  'regulation-text': { background: '#E3F2FD', color: '#1565C0' },
  guidance: { background: '#F3E5F5', color: '#6A1B9A' },
  'legal-opinion': { background: '#FFF3E0', color: '#E65100' },
  'impact-assessment': { background: '#E8F5E9', color: '#2E7D32' },
  'internal-memo': { background: '#FFF9C4', color: '#F57F17' },
  'training-material': { background: '#E1F5FE', color: '#0277BD' },
  'audit-report': { background: '#FCE4EC', color: '#C2185B' },
  correspondence: { background: '#F1F8E9', color: '#558B2F' },
  other: { background: '#F5F5F5', color: '#616161' },
};

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_regulation_documents_v1';

// ─── CRUD Functions ──────────────────────────────────────────────────────────

export function loadRegulationDocuments(): RegulationDocument[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = getSeedDocuments();
    saveRegulationDocuments(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveRegulationDocuments(documents: RegulationDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function getDocumentById(
  documents: RegulationDocument[],
  id: string
): RegulationDocument | undefined {
  return documents.find(d => d.id === id);
}

export function createDocument(
  documents: RegulationDocument[],
  data: Omit<RegulationDocument, 'id' | 'uploadedDate' | 'uploadedBy' | 'updatedAt' | 'updatedBy'>
): RegulationDocument {
  const nextNum = documents.length + 1;
  const id = `DOC-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newDocument: RegulationDocument = {
    ...data,
    id,
    uploadedDate: today,
    uploadedBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newDocument;
}

export function updateDocument(
  documents: RegulationDocument[],
  id: string,
  updates: Partial<Omit<RegulationDocument, 'id' | 'uploadedDate' | 'uploadedBy'>>
): RegulationDocument[] {
  const today = new Date().toISOString().split('T')[0];
  return documents.map(d =>
    d.id === id ? { ...d, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : d
  );
}

export function deleteDocument(documents: RegulationDocument[], id: string): RegulationDocument[] {
  return documents.filter(d => d.id !== id);
}

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getDocumentsForRegulation(
  documents: RegulationDocument[],
  regulationId: string
): RegulationDocument[] {
  return documents.filter(d => d.regulationId === regulationId);
}

export function getDocumentVersionHistory(
  documents: RegulationDocument[],
  documentId: string
): RegulationDocument[] {
  const doc = getDocumentById(documents, documentId);
  if (!doc) return [];

  const versions: RegulationDocument[] = [doc];
  let current = doc;

  // Walk backwards through version history
  while (current.previousVersionId) {
    const prev = getDocumentById(documents, current.previousVersionId);
    if (!prev) break;
    versions.push(prev);
    current = prev;
  }

  return versions;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedDocuments(): RegulationDocument[] {
  const today = new Date();
  const formatDate = (daysOffset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'DOC-001',
      regulationId: 'REG-001',
      fileName: 'GDPR_Official_Text_EN.pdf',
      fileSize: 1245600,
      fileType: 'application/pdf',
      uploadedDate: formatDate(-200),
      documentType: 'regulation-text',
      version: '1.0',
      description: 'Official GDPR regulation text in English, consolidated version',
      isOfficial: true,
      tags: ['official', 'full-text', 'english'],
      previousVersionId: null,
      fileUrl: '#',
      uploadedBy: 'Sarah Johnson',
      updatedAt: formatDate(-200),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'DOC-002',
      regulationId: 'REG-001',
      fileName: 'GDPR_Implementation_Guide.pdf',
      fileSize: 856300,
      fileType: 'application/pdf',
      uploadedDate: formatDate(-180),
      documentType: 'guidance',
      version: '2.1',
      description: 'ICO guidance on GDPR implementation for controllers and processors',
      isOfficial: false,
      tags: ['guidance', 'ico', 'implementation'],
      previousVersionId: null,
      fileUrl: '#',
      uploadedBy: 'Rachel Green',
      updatedAt: formatDate(-90),
      updatedBy: 'Rachel Green',
    },
    {
      id: 'DOC-003',
      regulationId: 'REG-001',
      fileName: 'GDPR_Impact_Assessment_Template.docx',
      fileSize: 124800,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadedDate: formatDate(-150),
      documentType: 'internal-memo',
      version: '1.0',
      description: 'Internal template for conducting GDPR data protection impact assessments',
      isOfficial: false,
      tags: ['template', 'dpia', 'internal'],
      previousVersionId: null,
      fileUrl: '#',
      uploadedBy: 'Emily Carter',
      updatedAt: formatDate(-150),
      updatedBy: 'Emily Carter',
    },
    {
      id: 'DOC-004',
      regulationId: 'REG-003',
      fileName: 'CCPA_Text_2023_Amendment.pdf',
      fileSize: 678900,
      fileType: 'application/pdf',
      uploadedDate: formatDate(-120),
      documentType: 'regulation-text',
      version: '3.0',
      description: 'Updated CCPA text including 2023 amendments',
      isOfficial: true,
      tags: ['official', 'amendment', '2023'],
      previousVersionId: null,
      fileUrl: '#',
      uploadedBy: 'Sarah Johnson',
      updatedAt: formatDate(-120),
      updatedBy: 'Sarah Johnson',
    },
    {
      id: 'DOC-005',
      regulationId: 'REG-003',
      fileName: 'Legal_Opinion_CCPA_Exemptions.pdf',
      fileSize: 234500,
      fileType: 'application/pdf',
      uploadedDate: formatDate(-60),
      documentType: 'legal-opinion',
      version: '1.0',
      description: 'External counsel opinion on CCPA small business exemption applicability',
      isOfficial: false,
      tags: ['legal', 'exemptions', 'confidential'],
      previousVersionId: null,
      fileUrl: '#',
      uploadedBy: 'Chris Martinez',
      updatedAt: formatDate(-60),
      updatedBy: 'Chris Martinez',
    },
  ];
}
