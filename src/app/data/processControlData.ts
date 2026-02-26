import { generateId } from './mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PCTestingFrequency =
  | 'Continuous' | 'Daily' | 'Weekly' | 'Monthly'
  | 'Quarterly' | 'Annual' | 'Ad-hoc';

export const PC_TESTING_FREQUENCIES: PCTestingFrequency[] = [
  'Continuous', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Ad-hoc',
];

export interface ProcessControlLink {
  id: string;
  processId: string;
  subProcessId: string | null;
  controlId: string;
  /** Why this control exists in this process */
  controlObjective: string;
  /** SOX / SOC 2 key control flag */
  isKeyControl: boolean;
  testingFrequency: PCTestingFrequency;
  linkedAt: string;
  linkedBy: string;
}

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_process_controls_v1';

function sanitizeLink(l: any): ProcessControlLink {
  return {
    id:               l.id               ?? 'PCL-' + generateId(),
    processId:        l.processId        ?? '',
    subProcessId:     l.subProcessId     ?? null,
    controlId:        l.controlId        ?? '',
    controlObjective: l.controlObjective ?? '',
    isKeyControl:     l.isKeyControl     ?? false,
    testingFrequency: l.testingFrequency ?? 'Quarterly',
    linkedAt:         l.linkedAt         ?? '',
    linkedBy:         l.linkedBy         ?? '',
  };
}

export function loadProcessControlLinks(): ProcessControlLink[] {
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

export function saveProcessControlLinks(links: ProcessControlLink[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export function getControlLinksForProcess(
  links: ProcessControlLink[],
  processId: string,
): ProcessControlLink[] {
  return links.filter(l => l.processId === processId);
}

export function getProcessLinksForControl(
  links: ProcessControlLink[],
  controlId: string,
): ProcessControlLink[] {
  return links.filter(l => l.controlId === controlId);
}

export function processControlLinkExists(
  links: ProcessControlLink[],
  processId: string,
  controlId: string,
): boolean {
  return links.some(l => l.processId === processId && l.controlId === controlId);
}
