import { generateId } from './mockData';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ProcessRiskLink {
  id: string;
  processId: string;
  subProcessId: string | null;
  riskId: string;
  notes: string;
  linkedAt: string;
  linkedBy: string;
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_process_risks_v1';

function sanitizeLink(l: any): ProcessRiskLink {
  return {
    id: l.id ?? 'PRL-' + generateId(),
    processId: l.processId ?? '',
    subProcessId: l.subProcessId ?? null,
    riskId: l.riskId ?? '',
    notes: l.notes ?? '',
    linkedAt: l.linkedAt ?? '',
    linkedBy: l.linkedBy ?? '',
  };
}

export function loadProcessRiskLinks(): ProcessRiskLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(sanitizeLink);
    }
  } catch {
    // fall through
  }
  return [];
}

export function saveProcessRiskLinks(links: ProcessRiskLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function getLinksForProcess(links: ProcessRiskLink[], processId: string): ProcessRiskLink[] {
  return links.filter(l => l.processId === processId);
}

export function getLinksForRisk(links: ProcessRiskLink[], riskId: string): ProcessRiskLink[] {
  return links.filter(l => l.riskId === riskId);
}

export function linkExists(links: ProcessRiskLink[], processId: string, riskId: string): boolean {
  return links.some(l => l.processId === processId && l.riskId === riskId);
}
