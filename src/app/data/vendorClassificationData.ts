// ─── Types ───────────────────────────────────────────────────────────────────

export interface VendorClassification {
  id: string;                        // e.g., "VCLS-001"
  title: string;                     // e.g., "Vendor Risk Assessment"
  description: string;               // Overall description of the classification system
  weight: number;                    // Weight/importance of this classification system (0-100)
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface VendorClassificationLevel {
  id: string;                        // e.g., "VCL-001"
  classificationId: string;          // Parent classification
  levelNumber: number;               // e.g., 1, 2, 3, 4, 5
  levelLabel: string;                // e.g., "Level 5 - High Exposure"
  description: string;               // Detailed criteria for this level
  score: number;                     // Numeric score for this level (used in weighted calculations)
  sortOrder: number;                 // Display order
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const CLASSIFICATION_STORAGE_KEY = 'erm_vendor_classifications_v1';
const LEVEL_STORAGE_KEY = 'erm_vendor_classification_levels_v1';

// ─── Classification CRUD Functions ──────────────────────────────────────────

export function loadVendorClassifications(): VendorClassification[] {
  const stored = localStorage.getItem(CLASSIFICATION_STORAGE_KEY);
  if (!stored) {
    const seed = getSeedClassifications();
    saveVendorClassifications(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveVendorClassifications(classifications: VendorClassification[]): void {
  localStorage.setItem(CLASSIFICATION_STORAGE_KEY, JSON.stringify(classifications));
}

export function getClassificationById(
  classifications: VendorClassification[],
  id: string
): VendorClassification | undefined {
  return classifications.find(c => c.id === id);
}

export function createClassification(
  classifications: VendorClassification[],
  data: Omit<VendorClassification, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): VendorClassification {
  const nextNum = classifications.length + 1;
  const id = `VCLS-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newClassification: VendorClassification = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newClassification;
}

export function updateClassification(
  classifications: VendorClassification[],
  id: string,
  updates: Partial<Omit<VendorClassification, 'id' | 'createdAt' | 'createdBy'>>
): VendorClassification[] {
  const today = new Date().toISOString().split('T')[0];
  return classifications.map(c =>
    c.id === id ? { ...c, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : c
  );
}

export function deleteClassification(
  classifications: VendorClassification[],
  id: string
): VendorClassification[] {
  return classifications.filter(c => c.id !== id);
}

// ─── Level CRUD Functions ────────────────────────────────────────────────────

export function loadVendorClassificationLevels(): VendorClassificationLevel[] {
  const stored = localStorage.getItem(LEVEL_STORAGE_KEY);
  if (!stored) {
    const seed = getSeedLevels();
    saveVendorClassificationLevels(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveVendorClassificationLevels(levels: VendorClassificationLevel[]): void {
  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levels));
}

export function getLevelById(
  levels: VendorClassificationLevel[],
  id: string
): VendorClassificationLevel | undefined {
  return levels.find(l => l.id === id);
}

export function getLevelsByClassification(
  levels: VendorClassificationLevel[],
  classificationId: string
): VendorClassificationLevel[] {
  return levels
    .filter(l => l.classificationId === classificationId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createLevel(
  levels: VendorClassificationLevel[],
  data: Omit<VendorClassificationLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): VendorClassificationLevel {
  const nextNum = levels.length + 1;
  const id = `VCL-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newLevel: VendorClassificationLevel = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newLevel;
}

export function updateLevel(
  levels: VendorClassificationLevel[],
  id: string,
  updates: Partial<Omit<VendorClassificationLevel, 'id' | 'createdAt' | 'createdBy'>>
): VendorClassificationLevel[] {
  const today = new Date().toISOString().split('T')[0];
  return levels.map(l =>
    l.id === id ? { ...l, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : l
  );
}

export function deleteLevel(
  levels: VendorClassificationLevel[],
  id: string
): VendorClassificationLevel[] {
  return levels.filter(l => l.id !== id);
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedClassifications(): VendorClassification[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'VCLS-001',
      title: 'Vendor Risk Classification',
      description: 'Risk-based classification system to determine vendor oversight requirements based on exposure, criticality, and financial impact.',
      weight: 85,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
  ];
}

function getSeedLevels(): VendorClassificationLevel[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'VCL-001',
      classificationId: 'VCLS-001',
      levelNumber: 5,
      levelLabel: 'Level 5 - High Exposure',
      description: `Any one of the following applies:
• Annual vendor spend > $2M
• Sole source provider with estimated replacement > 12 months
• Vendor failure creates direct financial liability, participant restitution risk, or penalties
• Access to highly sensitive data (SSN, PHI, financial records)
• Critical to business continuity with no backup provider`,
      score: 100,
      sortOrder: 1,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VCL-002',
      classificationId: 'VCLS-001',
      levelNumber: 4,
      levelLabel: 'Level 4 - Elevated Exposure',
      description: `Any one of the following applies:
• Annual vendor spend between $500K - $2M
• Replacement timeline 6-12 months
• Access to moderately sensitive data
• Important to business operations with limited alternatives
• Regulatory or compliance oversight required`,
      score: 80,
      sortOrder: 2,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VCL-003',
      classificationId: 'VCLS-001',
      levelNumber: 3,
      levelLabel: 'Level 3 - Moderate Exposure',
      description: `Any one of the following applies:
• Annual vendor spend between $100K - $500K
• Replacement timeline 3-6 months
• Access to general business data (non-sensitive)
• Multiple alternatives available in market
• Standard commercial services`,
      score: 60,
      sortOrder: 3,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VCL-004',
      classificationId: 'VCLS-001',
      levelNumber: 2,
      levelLabel: 'Level 2 - Low Exposure',
      description: `Any one of the following applies:
• Annual vendor spend between $25K - $100K
• Replacement timeline < 3 months
• No access to sensitive data
• Commodity services readily available
• Limited business impact if service disrupted`,
      score: 40,
      sortOrder: 4,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VCL-005',
      classificationId: 'VCLS-001',
      levelNumber: 1,
      levelLabel: 'Level 1 - Minimal Exposure',
      description: `Any one of the following applies:
• Annual vendor spend < $25K
• One-time or infrequent purchases
• No data access or minimal public data only
• Immediately replaceable with multiple vendors
• No material business impact`,
      score: 20,
      sortOrder: 5,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
  ];
}