// ─── Types ───────────────────────────────────────────────────────────────────

export interface VendorLevel {
  id: string;                        // e.g., "VL-001"
  levelNumber: number;               // e.g., 1, 2, 3, 4, 5
  levelName: string;                 // e.g., "Critical Vendor", "High Risk Vendor"
  description: string;               // What this level means
  minScore: number;                  // Minimum calculated score (0-100)
  maxScore: number;                  // Maximum calculated score (0-100)
  color: string;                     // Display color for badges (CSS var or hex)
  sortOrder: number;                 // Display order
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// ─── Storage Key ─────────────────────────────────────────────────────────────

const VENDOR_LEVEL_STORAGE_KEY = 'erm_vendor_levels_v1';

// ─── Vendor Level CRUD Functions ─────────────────────────────────────────────

export function loadVendorLevels(): VendorLevel[] {
  const stored = localStorage.getItem(VENDOR_LEVEL_STORAGE_KEY);
  if (!stored) {
    const seed = getSeedVendorLevels();
    saveVendorLevels(seed);
    return seed;
  }
  return JSON.parse(stored);
}

export function saveVendorLevels(levels: VendorLevel[]): void {
  localStorage.setItem(VENDOR_LEVEL_STORAGE_KEY, JSON.stringify(levels));
}

export function getVendorLevelById(
  levels: VendorLevel[],
  id: string
): VendorLevel | undefined {
  return levels.find(l => l.id === id);
}

export function getVendorLevelByScore(
  levels: VendorLevel[],
  score: number
): VendorLevel | undefined {
  return levels.find(l => score >= l.minScore && score <= l.maxScore);
}

export function createVendorLevel(
  levels: VendorLevel[],
  data: Omit<VendorLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>
): VendorLevel {
  const nextNum = levels.length + 1;
  const id = `VL-${String(nextNum).padStart(3, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const newLevel: VendorLevel = {
    ...data,
    id,
    createdAt: today,
    createdBy: 'Emily Carter',
    updatedAt: today,
    updatedBy: 'Emily Carter',
  };

  return newLevel;
}

export function updateVendorLevel(
  levels: VendorLevel[],
  id: string,
  updates: Partial<Omit<VendorLevel, 'id' | 'createdAt' | 'createdBy'>>
): VendorLevel[] {
  const today = new Date().toISOString().split('T')[0];
  return levels.map(l =>
    l.id === id ? { ...l, ...updates, updatedAt: today, updatedBy: 'Emily Carter' } : l
  );
}

export function deleteVendorLevel(
  levels: VendorLevel[],
  id: string
): VendorLevel[] {
  return levels.filter(l => l.id !== id);
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateScoreRanges(levels: VendorLevel[], excludeId?: string): {
  isValid: boolean;
  error?: string;
} {
  const relevantLevels = levels.filter(l => l.id !== excludeId);
  
  // Check for overlapping ranges
  for (let i = 0; i < relevantLevels.length; i++) {
    for (let j = i + 1; j < relevantLevels.length; j++) {
      const a = relevantLevels[i];
      const b = relevantLevels[j];
      
      if (
        (a.minScore <= b.maxScore && a.maxScore >= b.minScore) ||
        (b.minScore <= a.maxScore && b.maxScore >= a.minScore)
      ) {
        return {
          isValid: false,
          error: `Score ranges overlap between "${a.levelName}" and "${b.levelName}"`,
        };
      }
    }
  }
  
  return { isValid: true };
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function getSeedVendorLevels(): VendorLevel[] {
  const today = new Date().toISOString().split('T')[0];

  return [
    {
      id: 'VL-001',
      levelNumber: 5,
      levelName: 'Critical Vendor',
      description: 'Highest risk vendors requiring maximum oversight and controls',
      minScore: 80,
      maxScore: 100,
      color: 'var(--destructive)',
      sortOrder: 1,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VL-002',
      levelNumber: 4,
      levelName: 'High Risk Vendor',
      description: 'Elevated risk vendors requiring enhanced monitoring and regular reviews',
      minScore: 60,
      maxScore: 79,
      color: 'var(--warning)',
      sortOrder: 2,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VL-003',
      levelNumber: 3,
      levelName: 'Moderate Risk Vendor',
      description: 'Standard vendors with moderate risk profile requiring regular oversight',
      minScore: 40,
      maxScore: 59,
      color: 'var(--chart-3)',
      sortOrder: 3,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VL-004',
      levelNumber: 2,
      levelName: 'Low Risk Vendor',
      description: 'Lower risk vendors with minimal monitoring requirements',
      minScore: 20,
      maxScore: 39,
      color: 'var(--chart-2)',
      sortOrder: 4,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
    {
      id: 'VL-005',
      levelNumber: 1,
      levelName: 'Minimal Risk Vendor',
      description: 'Lowest risk vendors with minimal oversight requirements',
      minScore: 0,
      maxScore: 19,
      color: 'var(--chart-1)',
      sortOrder: 5,
      createdAt: today,
      createdBy: 'System',
      updatedAt: today,
      updatedBy: 'System',
    },
  ];
}