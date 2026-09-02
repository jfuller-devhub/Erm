import { generateId, MOCK_USERS } from './mockData';
import type { AppUser } from './mockData';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface VendorRisk {
  vendorId: string;
  riskId: string;
  relationshipNotes: string;
  createdAt: string;
  createdBy: AppUser | null;
}

// ─── LocalStorage helpers ────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_vendor_risks_v1';

function sanitizeVendorRisk(vr: any): VendorRisk {
  return {
    vendorId: vr.vendorId ?? '',
    riskId: vr.riskId ?? '',
    relationshipNotes: vr.relationshipNotes ?? '',
    createdAt: vr.createdAt ?? '',
    createdBy: vr.createdBy ?? null,
  };
}

export function loadVendorRisks(): VendorRisk[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeVendorRisk);
      }
    }
  } catch {
    // fall through to seed
  }
  const seed = SEED_VENDOR_RISKS;
  saveVendorRisks(seed);
  return seed;
}

export function saveVendorRisks(vendorRisks: VendorRisk[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vendorRisks));
}

/** Get all vendor-risk mappings for a specific vendor */
export function getRisksForVendor(vendorRisks: VendorRisk[], vendorId: string): VendorRisk[] {
  return vendorRisks.filter(vr => vr.vendorId === vendorId);
}

/** Get all vendor-risk mappings for a specific risk */
export function getVendorsForRisk(vendorRisks: VendorRisk[], riskId: string): VendorRisk[] {
  return vendorRisks.filter(vr => vr.riskId === riskId);
}

/** Check if a mapping already exists */
export function mappingExists(vendorRisks: VendorRisk[], vendorId: string, riskId: string): boolean {
  return vendorRisks.some(vr => vr.vendorId === vendorId && vr.riskId === riskId);
}

/** Count of linked risks for a vendor */
export function getRiskCountForVendor(vendorRisks: VendorRisk[], vendorId: string): number {
  return vendorRisks.filter(vr => vr.vendorId === vendorId).length;
}

/** Count of linked vendors for a risk */
export function getVendorCountForRisk(vendorRisks: VendorRisk[], riskId: string): number {
  return vendorRisks.filter(vr => vr.riskId === riskId).length;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const SEED_VENDOR_RISKS: VendorRisk[] = [
  {
    vendorId: 'VND-001',
    riskId: 'RSK-004',
    relationshipNotes: 'Data privacy compliance concerns with cloud storage provider',
    createdAt: '2024-01-15',
    createdBy: MOCK_USERS[0],
  },
  {
    vendorId: 'VND-002',
    riskId: 'RSK-003',
    relationshipNotes: 'Vendor dependency for critical payment processing infrastructure',
    createdAt: '2024-02-10',
    createdBy: MOCK_USERS[1],
  },
];
