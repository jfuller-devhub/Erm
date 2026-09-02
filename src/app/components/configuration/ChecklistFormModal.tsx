import React, { useState } from 'react';
import { X, AlertCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { ChecklistItem, VendorLevelChecklistAssociation } from '../../data/checklistData';
import type { VendorLevel } from '../../data/vendorLevelData';
import type { ConfigOption } from '../../data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

type RruleFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface AssociationDetail {
  vendorStatusAssignments: Record<string, 'required' | 'optional'>; // Assignment status per vendor status
  rruleFreq: RruleFreq;
  rruleInterval: number;
  rruleByDay: string[];
  rruleByMonthDay: number;
  advanceNoticeDays: number;
  gracePeriodDays: number;
  evidenceRequired: boolean;
  evidenceType: string;
  assignees: string[];
}

interface ChecklistFormModalProps {
  initialData?: ChecklistItem;
  vendorLevels: VendorLevel[];
  existingAssociations: VendorLevelChecklistAssociation[];
  configOptions: ConfigOption[];
  onClose: () => void;
  onSubmit: (
    data: Omit<ChecklistItem, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    associations: Array<{
      vendorLevelId: string;
      vendorStatusAssignments: Record<string, 'required' | 'optional'>;
      rrule?: string;
      advanceNoticeDays?: number;
      gracePeriodDays?: number;
      evidenceRequired?: boolean;
      evidenceType?: string;
      assignees?: string[];
    }>
  ) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Security', label: 'Security' },
  { value: 'Financial', label: 'Financial' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Operational', label: 'Operational' },
  { value: 'Legal', label: 'Legal' },
];

const FREQ_OPTIONS: { value: RruleFreq; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const WEEKDAYS = [
  { value: 'MO', label: 'Mon' },
  { value: 'TU', label: 'Tue' },
  { value: 'WE', label: 'Wed' },
  { value: 'TH', label: 'Thu' },
  { value: 'FR', label: 'Fri' },
  { value: 'SA', label: 'Sat' },
  { value: 'SU', label: 'Sun' },
];

const EVIDENCE_TYPE_OPTIONS = [
  { value: 'Document', label: 'Document' },
  { value: 'Attestation', label: 'Attestation' },
  { value: 'Screenshot', label: 'Screenshot' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'Report', label: 'Report' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Other', label: 'Other' },
];

const ASSIGNEE_OPTIONS = [
  { value: 'Vendor Manager', label: 'Vendor Manager' },
  { value: 'Individuals Involved', label: 'Individuals Involved' },
];

const EXECUTION_START_DATE_OPTIONS = [
  { value: 'Vendor Add Date', label: 'Vendor Add Date' },
  { value: 'Vendor Activation Date', label: 'Vendor Activation Date' },
  { value: 'January 1st', label: 'January 1st' },
  { value: 'Vendor Termination Date', label: 'Vendor Termination Date' },
];

const VENDOR_STATUS_OPTIONS = [
  { value: 'Under Consideration', label: 'Under Consideration' },
  { value: 'Under Due Diligence', label: 'Under Due Diligence' },
  { value: 'Contract Negotiation', label: 'Contract Negotiation' },
  { value: 'Active (In Service)', label: 'Active (In Service)' },
  { value: 'Active (Under Scheduled Review)', label: 'Active (Under Scheduled Review)' },
  { value: 'Offboarding (Termination in Progress)', label: 'Offboarding (Termination in Progress)' },
  { value: 'Terminated', label: 'Terminated' },
  { value: 'Archived', label: 'Archived' },
];

// ─── RRULE Builder ────────────────────────────────────────────────────────────

function buildRrule(detail: AssociationDetail): string {
  const parts: string[] = [`FREQ=${detail.rruleFreq}`];

  if (detail.rruleInterval > 1) {
    parts.push(`INTERVAL=${detail.rruleInterval}`);
  }

  if (detail.rruleFreq === 'WEEKLY' && detail.rruleByDay.length > 0) {
    parts.push(`BYDAY=${detail.rruleByDay.join(',')}`);
  }

  if (detail.rruleFreq === 'MONTHLY' && detail.rruleByMonthDay > 0) {
    parts.push(`BYMONTHDAY=${detail.rruleByMonthDay}`);
  }

  return parts.join(';');
}

function describeRrule(detail: AssociationDetail): string {
  const { rruleFreq, rruleInterval, rruleByDay, rruleByMonthDay } = detail;
  const every = rruleInterval === 1 ? '' : `every ${rruleInterval} `;

  if (rruleFreq === 'DAILY') return `Every ${every}day`;

  if (rruleFreq === 'WEEKLY') {
    const days = rruleByDay
      .map(d => WEEKDAYS.find(w => w.value === d)?.label ?? d)
      .join(', ');
    return `Every ${every}week${days ? ` on ${days}` : ''}`;
  }

  if (rruleFreq === 'MONTHLY') {
    return `Every ${every}month${rruleByMonthDay ? ` on the ${rruleByMonthDay}${ordinal(rruleByMonthDay)}` : ''}`;
  }

  return `Every ${every}year`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

function parseRrule(rrule?: string): Partial<AssociationDetail> {
  if (!rrule) return {};
  const parts: Record<string, string> = {};
  rrule.split(';').forEach(part => {
    const [k, v] = part.split('=');
    if (k && v) parts[k] = v;
  });

  return {
    rruleFreq: (parts['FREQ'] as RruleFreq) ?? 'YEARLY',
    rruleInterval: parts['INTERVAL'] ? parseInt(parts['INTERVAL'], 10) : 1,
    rruleByDay: parts['BYDAY'] ? parts['BYDAY'].split(',') : [],
    rruleByMonthDay: parts['BYMONTHDAY'] ? parseInt(parts['BYMONTHDAY'], 10) : 1,
  };
}

function defaultDetail(): AssociationDetail {
  return {
    vendorStatusAssignments: {},
    rruleFreq: 'YEARLY',
    rruleInterval: 1,
    rruleByDay: [],
    rruleByMonthDay: 1,
    advanceNoticeDays: 30,
    gracePeriodDays: 7,
    evidenceRequired: false,
    evidenceType: 'Document',
    assignees: [],
  };
}

// ─── Shared input style helpers ───────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-input)',
  fontFamily: 'var(--font-family-primary)',
  fontSize: '13px',
  background: 'var(--input-background)',
  color: 'var(--foreground)',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-family-primary)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--foreground)',
  marginBottom: '4px',
};

// ─── RRULE Builder Sub-Component ──────────────────────────────────────────────

function RruleBuilder({
  detail,
  onChange,
}: {
  detail: AssociationDetail;
  onChange: (updates: Partial<AssociationDetail>) => void;
}) {
  const rruleString = buildRrule(detail);
  const humanReadable = describeRrule(detail);

  return (
    <div
      style={{
        background: 'var(--muted)',
        borderRadius: '6px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Row 1: Frequency + Interval */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Frequency <span style={{ color: 'var(--destructive)' }}>*</span></label>
          <select
            value={detail.rruleFreq}
            onChange={e => onChange({ rruleFreq: e.target.value as RruleFreq, rruleByDay: [], rruleByMonthDay: 1 })}
            style={inputStyle}
          >
            {FREQ_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Repeat Every</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              min={1}
              max={99}
              value={detail.rruleInterval}
              onChange={e => onChange({ rruleInterval: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              style={{ ...inputStyle, width: '70px' }}
            />
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
              {detail.rruleFreq === 'DAILY' && (detail.rruleInterval === 1 ? 'day' : 'days')}
              {detail.rruleFreq === 'WEEKLY' && (detail.rruleInterval === 1 ? 'week' : 'weeks')}
              {detail.rruleFreq === 'MONTHLY' && (detail.rruleInterval === 1 ? 'month' : 'months')}
              {detail.rruleFreq === 'YEARLY' && (detail.rruleInterval === 1 ? 'year' : 'years')}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly: day selector */}
      {detail.rruleFreq === 'WEEKLY' && (
        <div>
          <label style={labelStyle}>On Days</label>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {WEEKDAYS.map(day => {
              const active = detail.rruleByDay.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? detail.rruleByDay.filter(d => d !== day.value)
                      : [...detail.rruleByDay, day.value];
                    onChange({ rruleByDay: next });
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '100px',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary)' : 'var(--card)',
                    color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly: day of month */}
      {detail.rruleFreq === 'MONTHLY' && (
        <div>
          <label style={labelStyle}>On Day of Month</label>
          <input
            type="number"
            min={1}
            max={31}
            value={detail.rruleByMonthDay}
            onChange={e => onChange({ rruleByMonthDay: Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
            style={{ ...inputStyle, width: '80px' }}
          />
        </div>
      )}

      {/* Human-readable preview + RRULE string */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            {humanReadable}
          </span>
        </div>
        <code
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            background: 'var(--card)',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'inline-block',
            wordBreak: 'break-all',
          }}
        >
          {rruleString}
        </code>
      </div>
    </div>
  );
}

// ─── Per-Level Association Detail Panel ───────────────────────────────────────

function AssociationDetailPanel({
  detail,
  onChange,
}: {
  detail: AssociationDetail;
  onChange: (updates: Partial<AssociationDetail>) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        paddingTop: '14px',
      }}
    >
      {/* Vendor Status Assignments */}
      <div>
        <label style={labelStyle}>Vendor Status Assignments <span style={{ color: 'var(--destructive)' }}>*</span></label>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-input)',
            padding: '10px',
            background: 'var(--input-background)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {VENDOR_STATUS_OPTIONS.map(opt => {
            const assignmentStatus = detail.vendorStatusAssignments[opt.value];
            const isSelected = assignmentStatus !== undefined;
            return (
              <div
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px',
                  background: isSelected ? 'var(--muted)' : 'transparent',
                  borderRadius: '6px',
                }}
              >
                {/* Checkbox to select/deselect vendor status */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    const newAssignments = { ...detail.vendorStatusAssignments };
                    if (isSelected) {
                      delete newAssignments[opt.value];
                    } else {
                      newAssignments[opt.value] = 'required';
                    }
                    onChange({ vendorStatusAssignments: newAssignments });
                  }}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', flexShrink: 0 }}
                />

                {/* Vendor status label */}
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '13px',
                    color: isSelected ? 'var(--foreground)' : 'var(--muted-foreground)',
                    fontWeight: isSelected ? 600 : 400,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {opt.label}
                </span>

                {/* Assignment status buttons (only when selected) */}
                {isSelected && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {(['required', 'optional'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          const newAssignments = { ...detail.vendorStatusAssignments, [opt.value]: s };
                          onChange({ vendorStatusAssignments: newAssignments });
                        }}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '100px',
                          border: `1px solid ${assignmentStatus === s ? (s === 'required' ? 'var(--destructive)' : 'var(--chart-2)') : 'var(--border)'}`,
                          background: assignmentStatus === s ? (s === 'required' ? 'var(--destructive)' : 'var(--chart-2)') : 'var(--card)',
                          color: assignmentStatus === s ? 'white' : 'var(--muted-foreground)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', margin: '3px 0 0 0' }}>
          Select vendor statuses and specify whether this checklist is required or optional for each status
        </p>
      </div>

      {/* Recurrence / RRULE */}
      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>
          Recurrence Schedule <span style={{ color: 'var(--destructive)' }}>*</span>
        </label>
        <RruleBuilder detail={detail} onChange={onChange} />
      </div>

      {/* Advance Notice + Grace Period */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Advance Notice Days <span style={{ color: 'var(--destructive)' }}>*</span></label>
          <input
            type="number"
            min={0}
            max={365}
            value={detail.advanceNoticeDays}
            onChange={e => onChange({ advanceNoticeDays: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            style={inputStyle}
          />
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', margin: '3px 0 0 0' }}>
            Days before due date to notify
          </p>
        </div>
        <div>
          <label style={labelStyle}>Grace Period Days <span style={{ color: 'var(--destructive)' }}>*</span></label>
          <input
            type="number"
            min={0}
            max={365}
            value={detail.gracePeriodDays}
            onChange={e => onChange({ gracePeriodDays: Math.max(0, parseInt(e.target.value, 10) || 0) })}
            style={inputStyle}
          />
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', margin: '3px 0 0 0' }}>
            Days after due date before escalation
          </p>
        </div>
      </div>

      {/* Evidence Required */}
      <div>
        <label style={labelStyle}>Evidence Required <span style={{ color: 'var(--destructive)' }}>*</span></label>
        <div style={{ display: 'flex', gap: '20px' }}>
          {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(opt => (
            <label
              key={String(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '13px',
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                checked={detail.evidenceRequired === opt.value}
                onChange={() => onChange({ evidenceRequired: opt.value })}
                style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Evidence Type — only when evidence is required */}
      {detail.evidenceRequired && (
        <div>
          <label style={labelStyle}>Evidence Type <span style={{ color: 'var(--destructive)' }}>*</span></label>
          <select
            value={detail.evidenceType}
            onChange={e => onChange({ evidenceType: e.target.value })}
            style={inputStyle}
          >
            {EVIDENCE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Assignees — Multi-select */}
      <div>
        <label style={labelStyle}>Assignees</label>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-input)',
            padding: '8px',
            background: 'var(--input-background)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {ASSIGNEE_OPTIONS.map(opt => {
            const isChecked = detail.assignees.includes(opt.value);
            return (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '13px',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const newAssignees = isChecked
                      ? detail.assignees.filter(a => a !== opt.value)
                      : [...detail.assignees, opt.value];
                    onChange({ assignees: newAssignees });
                  }}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', margin: '3px 0 0 0' }}>
          Who should be assigned to complete this checklist item for vendors at this level
        </p>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ChecklistFormModal({
  initialData,
  vendorLevels,
  existingAssociations,
  configOptions,
  onClose,
  onSubmit,
}: ChecklistFormModalProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'Compliance');
  const [activityType, setActivityType] = useState(initialData?.activityType ?? '');
  const [executionStartDate, setExecutionStartDate] = useState(initialData?.executionStartDate ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get activity type options from config
  const activityTypeOptions = configOptions
    .filter(opt => opt.table === 'Checklist' && opt.field === 'Activity Type' && opt.status === 'Active')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(opt => ({ value: opt.value, label: opt.value }));

  // Per-level association detail. Null = not associated.
  const [levelDetails, setLevelDetails] = useState<Record<string, AssociationDetail | null>>(() => {
    const init: Record<string, AssociationDetail | null> = {};
    vendorLevels.forEach(level => { init[level.id] = null; });

    if (initialData) {
      existingAssociations
        .filter(a => a.checklistItemId === initialData.id)
        .forEach(a => {
          const parsed = parseRrule(a.rrule);

          // Handle both new and legacy data formats
          let vendorStatusAssignments: Record<string, 'required' | 'optional'> = {};
          if (a.vendorStatusAssignments) {
            // New format
            vendorStatusAssignments = a.vendorStatusAssignments;
          } else if (a.vendorStatuses && a.vendorStatuses.length > 0) {
            // Legacy format: convert vendorStatuses array + status to vendorStatusAssignments
            a.vendorStatuses.forEach(status => {
              vendorStatusAssignments[status] = a.status;
            });
          }

          init[a.vendorLevelId] = {
            vendorStatusAssignments,
            rruleFreq: parsed.rruleFreq ?? 'YEARLY',
            rruleInterval: parsed.rruleInterval ?? 1,
            rruleByDay: parsed.rruleByDay ?? [],
            rruleByMonthDay: parsed.rruleByMonthDay ?? 1,
            advanceNoticeDays: a.advanceNoticeDays ?? 30,
            gracePeriodDays: a.gracePeriodDays ?? 7,
            evidenceRequired: a.evidenceRequired ?? false,
            evidenceType: a.evidenceType ?? 'Document',
            assignees: a.assignees ?? [],
          };
        });

    }

    return init;
  });

  // Separate initialization for expanded levels to avoid closure issues
  const [expandedLevelsInit] = useState<Set<string>>(() => {
    if (!initialData) return new Set<string>();
    const expanded = new Set<string>();
    existingAssociations
      .filter(a => a.checklistItemId === initialData.id)
      .forEach(a => expanded.add(a.vendorLevelId));
    return expanded;
  });

  const [localExpandedLevels, setLocalExpandedLevels] = useState<Set<string>>(expandedLevelsInit);

  function toggleAssociation(levelId: string) {
    setLevelDetails(prev => {
      if (prev[levelId] !== null) {
        // Disassociate
        setLocalExpandedLevels(e => { const n = new Set(e); n.delete(levelId); return n; });
        return { ...prev, [levelId]: null };
      } else {
        // Associate with defaults
        setLocalExpandedLevels(e => new Set([...e, levelId]));
        return { ...prev, [levelId]: defaultDetail() };
      }
    });
  }

  function toggleExpand(levelId: string) {
    setLocalExpandedLevels(prev => {
      const next = new Set(prev);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }

  function updateLevelDetail(levelId: string, updates: Partial<AssociationDetail>) {
    setLevelDetails(prev => {
      const current = prev[levelId];
      if (!current) return prev;
      return { ...prev, [levelId]: { ...current, ...updates } };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (name.trim().length < 3) {
      setValidationError('Checklist name must be at least 3 characters');
      return;
    }
    if (description.trim().length < 10) {
      setValidationError('Description must be at least 10 characters');
      return;
    }
    if (!activityType) {
      setValidationError('Activity Type is required');
      return;
    }
    if (!executionStartDate) {
      setValidationError('Execution Start Date is required');
      return;
    }

    setValidationError(null);

    const associations = Object.entries(levelDetails)
      .filter(([, detail]) => detail !== null)
      .map(([vendorLevelId, detail]) => ({
        vendorLevelId,
        vendorStatusAssignments: detail!.vendorStatusAssignments,
        rrule: buildRrule(detail!),
        advanceNoticeDays: detail!.advanceNoticeDays,
        gracePeriodDays: detail!.gracePeriodDays,
        evidenceRequired: detail!.evidenceRequired,
        evidenceType: detail!.evidenceRequired ? detail!.evidenceType : undefined,
        assignees: detail!.assignees,
      }));

    onSubmit({ name: name.trim(), description: description.trim(), category, activityType, executionStartDate }, associations);
  }

  const isValid = name.trim().length >= 3 && description.trim().length >= 10 && activityType !== '' && executionStartDate !== '';
  const sortedLevels = [...vendorLevels].sort((a, b) => b.levelNumber - a.levelNumber);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--elevation-sm)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            {initialData ? 'Edit Checklist Item' : 'Add Checklist Item'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {validationError && (
              <div
                style={{
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  padding: '12px',
                  borderRadius: 'var(--radius-card)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px' }}>
                  {validationError}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* ── Checklist Item Name ── */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Checklist Item Name <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Annual Risk Assessment"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>

              {/* ── Description ── */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Description <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what this checklist item involves..."
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* ── Category ── */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Category <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  Used to group and organize checklist items
                </p>
              </div>

              {/* ── Activity Type ── */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Activity Type <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <select
                  value={activityType}
                  onChange={e => setActivityType(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value="">Select activity type...</option>
                  {activityTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  Indicates whether this is a due diligence, monitoring, assessment, or other type of activity
                </p>
              </div>

              {/* ── Execution Start Date ── */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Execution Start Date <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <select
                  value={executionStartDate}
                  onChange={e => setExecutionStartDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                >
                  <option value="">Select execution start date...</option>
                  {EXECUTION_START_DATE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  The date this checklist item will begin executing from for applicable vendors
                </p>
              </div>

              {/* ── Vendor Level Assignments ── */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--foreground)',
                    marginBottom: '4px',
                  }}
                >
                  Vendor Level Assignments
                </label>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '0 0 12px 0',
                  }}
                >
                  Toggle a vendor level to assign it, then expand to configure its recurrence schedule and requirements.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sortedLevels.map(level => {
                    const detail = levelDetails[level.id];
                    const isAssociated = detail !== null;
                    const isExpanded = localExpandedLevels.has(level.id);

                    return (
                      <div
                        key={level.id}
                        style={{
                          border: `1px solid ${isAssociated ? level.color : 'var(--border)'}`,
                          borderRadius: 'var(--radius-card)',
                          background: isAssociated ? `${level.color}0d` : 'var(--card)',
                          overflow: 'hidden',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                      >
                        {/* Level Header Row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 12px',
                            gap: '10px',
                          }}
                        >
                          {/* Toggle checkbox-style */}
                          <button
                            type="button"
                            onClick={() => toggleAssociation(level.id)}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              border: `2px solid ${isAssociated ? level.color : 'var(--border)'}`,
                              background: isAssociated ? level.color : 'transparent',
                              flexShrink: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {isAssociated && '✓'}
                          </button>

                          {/* Level badge */}
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              background: level.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                              {level.levelNumber}
                            </span>
                          </div>

                          {/* Level name + score */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                              {level.levelName}
                            </div>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                              Score {level.minScore}–{level.maxScore}
                            </div>
                          </div>

                          {/* Vendor Status Assignments Summary */}
                          {isAssociated && detail && Object.keys(detail.vendorStatusAssignments).length > 0 && (
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '100px',
                                background: 'var(--muted)',
                                color: 'var(--muted-foreground)',
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '11px',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {Object.keys(detail.vendorStatusAssignments).length} status{Object.keys(detail.vendorStatusAssignments).length !== 1 ? 'es' : ''}
                            </span>
                          )}

                          {/* RRULE summary badge */}
                          {isAssociated && detail && (
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '100px',
                                background: 'var(--muted)',
                                color: 'var(--muted-foreground)',
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '11px',
                                fontWeight: 500,
                                flexShrink: 0,
                                maxWidth: '140px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={buildRrule(detail)}
                            >
                              {describeRrule(detail)}
                            </span>
                          )}

                          {/* Expand/collapse toggle */}
                          {isAssociated && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(level.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--muted-foreground)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px',
                                flexShrink: 0,
                              }}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </div>

                        {/* Expanded detail panel */}
                        {isAssociated && isExpanded && detail && (
                          <div
                            style={{
                              borderTop: `1px solid ${level.color}40`,
                              padding: '0 16px 16px 16px',
                            }}
                          >
                            <AssociationDetailPanel
                              detail={detail}
                              onChange={updates => updateLevelDetail(level.id, updates)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              style={{
                padding: '8px 16px',
                background: isValid ? 'var(--primary)' : 'var(--muted)',
                color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              {initialData ? 'Update' : 'Add Checklist Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
