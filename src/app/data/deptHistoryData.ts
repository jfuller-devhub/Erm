import { generateId } from './mockData';
import type { Department } from './departmentData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DeptHistoryEntry {
  id: string;
  deptId: string;
  parentId: string;      // '' = top level at this point in time
  parentName: string;    // snapshot of parent name at time of record
  leadId: string;        // lead during this period
  periodStart: string;   // YYYY-MM-DD when this reporting relationship began
  periodEnd: string;     // YYYY-MM-DD when it ended; '' = still active
  recordedAt: string;    // ISO 8601 datetime when this was logged
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'erm_dept_history_v1';

function sanitize(e: any): DeptHistoryEntry {
  return {
    id:          String(e.id          ?? generateId()),
    deptId:      String(e.deptId      ?? ''),
    parentId:    String(e.parentId    ?? ''),
    parentName:  String(e.parentName  ?? ''),
    leadId:      String(e.leadId      ?? ''),
    periodStart: String(e.periodStart ?? ''),
    periodEnd:   String(e.periodEnd   ?? ''),
    recordedAt:  String(e.recordedAt  ?? new Date().toISOString()),
  };
}

export function loadDeptHistory(seedFrom?: Department[]): DeptHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(sanitize);
    }
  } catch { /* fall through */ }

  // Seed initial history from current dept data so existing records aren't blank
  if (seedFrom && seedFrom.length > 0) {
    const seed = seedFrom
      .filter(d => d.parentId !== '')
      .map(d => sanitize({
        id: 'DHE-' + generateId(),
        deptId: d.id,
        parentId: d.parentId,
        parentName: seedFrom.find(p => p.id === d.parentId)?.name ?? '',
        leadId: d.leadId,
        periodStart: d.reportingStartDate || d.createdDate,
        periodEnd: d.reportingEndDate || '',
        recordedAt: d.createdDate
          ? new Date(d.createdDate).toISOString()
          : new Date().toISOString(),
      }));
    saveDeptHistory(seed);
    return seed;
  }

  return [];
}

export function saveDeptHistory(entries: DeptHistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function getDeptHistory(entries: DeptHistoryEntry[], deptId: string): DeptHistoryEntry[] {
  return [...entries.filter(e => e.deptId === deptId)].sort(
    (a, b) => b.recordedAt.localeCompare(a.recordedAt)
  );
}

// ─── Write helpers ───────────────────────────────────────────────────────────

// Opens the first history entry for a dept (call on create with a parent).
export function recordInitialRelationship(
  entries: DeptHistoryEntry[],
  deptId: string,
  parentId: string,
  parentName: string,
  leadId: string,
  periodStart: string,
): DeptHistoryEntry[] {
  const entry: DeptHistoryEntry = {
    id: 'DHE-' + generateId(),
    deptId,
    parentId,
    parentName: parentName || 'Top Level',
    leadId,
    periodStart: periodStart || new Date().toISOString().split('T')[0],
    periodEnd: '',
    recordedAt: new Date().toISOString(),
  };
  return [...entries, entry];
}

// Closes the current open entry and opens a new one (call on every move/reparent).
export function recordMove(
  entries: DeptHistoryEntry[],
  deptId: string,
  newParentId: string,
  newParentName: string,
  leadId: string,
  newPeriodStart: string,
  effectiveDate: string,
): DeptHistoryEntry[] {
  const today = effectiveDate || new Date().toISOString().split('T')[0];

  // Close any currently open entry for this dept
  const closed = entries.map(e =>
    e.deptId === deptId && e.periodEnd === '' ? { ...e, periodEnd: today } : e
  );

  // Open the new entry
  const next: DeptHistoryEntry = {
    id: 'DHE-' + generateId(),
    deptId,
    parentId: newParentId,
    parentName: newParentName || 'Top Level',
    leadId,
    periodStart: newPeriodStart || today,
    periodEnd: '',
    recordedAt: new Date().toISOString(),
  };

  return [...closed, next];
}

// ─── Direct CRUD on individual entries ───────────────────────────────────────

export function addReportingEntry(
  entries: DeptHistoryEntry[],
  data: Omit<DeptHistoryEntry, 'id' | 'recordedAt'>,
): DeptHistoryEntry[] {
  const entry: DeptHistoryEntry = {
    ...data,
    id: 'DHE-' + generateId(),
    recordedAt: new Date().toISOString(),
  };
  return [...entries, entry];
}

export function updateReportingEntry(
  entries: DeptHistoryEntry[],
  id: string,
  changes: Partial<Pick<DeptHistoryEntry, 'parentId' | 'parentName' | 'leadId' | 'periodStart' | 'periodEnd'>>,
): DeptHistoryEntry[] {
  return entries.map(e => e.id === id ? { ...e, ...changes } : e);
}

export function deleteReportingEntry(
  entries: DeptHistoryEntry[],
  id: string,
): DeptHistoryEntry[] {
  return entries.filter(e => e.id !== id);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatPeriodDuration(start: string, end: string): string {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  const totalMonths =
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (totalMonths < 1) return 'Less than a month';
  if (totalMonths < 12) return `${totalMonths} mo`;
  const years = Math.floor(totalMonths / 12);
  const rem = totalMonths % 12;
  return rem === 0 ? `${years} yr` : `${years} yr ${rem} mo`;
}
