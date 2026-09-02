import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Clock, Plus, Link2,
  Link2Off, Search, X, Check, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { KPITile } from '../shared/KPITile';
import { EmptyState } from '../shared/EmptyState';
import { Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserAvatar } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { Process, SubProcess } from '../../data/processData';
import type { Risk, RiskType, RiskCategory, RiskStatus, AppetiteLevel, ReviewFrequency } from '../../data/riskData';
import {
  loadRisks, saveRisks, loadRiskCategories,
  RISK_STATUS_LABELS, RISK_TYPE_LABELS, APPETITE_LEVEL_LABELS, REVIEW_FREQUENCY_LABELS,
} from '../../data/riskData';
import type { RiskAssessment } from '../../data/riskAssessmentData';
import { loadRiskAssessments, RISK_RATING_LABELS, RISK_RATING_STYLES } from '../../data/riskAssessmentData';
import type { ProcessRiskLink } from '../../data/processRiskData';
import {
  loadProcessRiskLinks, saveProcessRiskLinks, getLinksForProcess,
} from '../../data/processRiskData';
import { formatDate, generateId, MOCK_USERS } from '../../data/mockData';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Badge styles ─────────────────────────────────────────────────────────────

const RISK_STATUS_STYLES: Record<RiskStatus, { bg: string; fg: string }> = {
  draft:    { bg: '#FFF3E0', fg: '#E07B00' },
  active:   { bg: '#E8F5EE', fg: '#1C8A45' },
  closed:   { bg: '#F0F0F0', fg: '#6B7489' },
  archived: { bg: '#F0F0F0', fg: '#6B7489' },
};

const RISK_TYPE_STYLES: Record<RiskType, { bg: string; fg: string }> = {
  strategic:    { bg: 'rgba(35,34,240,0.08)', fg: '#2322F0' },
  operational:  { bg: '#FFF3E0', fg: '#E07B00' },
  financial:    { bg: '#E8F5EE', fg: '#1C8A45' },
  compliance:   { bg: '#E0F5F5', fg: '#00A3A3' },
  reputational: { bg: '#FDE8E8', fg: '#C0392B' },
  cyber:        { bg: '#F0E8FF', fg: '#6B3FA0' },
};

// ─── Small shared badge ────────────────────────────────────────────────────────

function Pill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center',
        height: '20px', padding: '0 8px', borderRadius: '100px',
        background: bg, color: fg,
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)', lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const s = RISK_STATUS_STYLES[status] ?? { bg: '#F0F0F0', fg: '#6B7489' };
  return <Pill bg={s.bg} fg={s.fg} label={RISK_STATUS_LABELS[status]} />;
}

function RiskTypeBadge({ type }: { type: RiskType }) {
  const s = RISK_TYPE_STYLES[type] ?? { bg: '#F0F0F0', fg: '#6B7489' };
  return <Pill bg={s.bg} fg={s.fg} label={RISK_TYPE_LABELS[type]} />;
}

function RatingBadge({ riskId, map }: { riskId: string; map: Map<string, RiskAssessment> }) {
  const a = map.get(riskId);
  if (!a) {
    return (
      <span style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
      }}>—</span>
    );
  }
  const s = RISK_RATING_STYLES[a.riskRating] ?? { background: '#F0F0F0', color: '#6B7489' };
  return (
    <Pill bg={s.background} fg={s.color}
      label={`${RISK_RATING_LABELS[a.riskRating]} (${a.residualScore})`}
    />
  );
}

// ─── Quarter helper ────────────────────────────────────────────────────────────

function isThisQuarter(dateStr: string): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const qStart = new Date(now.getFullYear(), q * 3, 1);
  const qEnd   = new Date(now.getFullYear(), q * 3 + 3, 0);
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date >= qStart && date <= qEnd;
}

// ─── Btn helpers (shared style generators) ────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px',
  border: 'none', borderRadius: 'var(--radius-button)',
  background: 'var(--primary)', color: 'var(--primary-foreground)',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'opacity 0.1s', flexShrink: 0,
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px',
  border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)',
  background: 'transparent', color: 'var(--primary)',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'background 0.1s', flexShrink: 0,
};

const dangerBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  height: '36px', padding: '0 16px',
  border: 'none', borderRadius: 'var(--radius-button)',
  background: 'var(--destructive)', color: '#fff',
  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  transition: 'opacity 0.1s', flexShrink: 0,
};

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
      <span style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
        textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

// ─── Identify New Risk — inline form ─────────────────────────────────────────

interface IdentifyFormState {
  title: string;
  riskType: RiskType;
  categoryId: string;
  description: string;
  appetiteLevel: string;
  department: string;
  ownerId: string;
  reviewFrequency: string;
  subProcessId: string;
  notes: string;
}

interface IdentifyFormErrors {
  title?: string;
  riskType?: string;
  categoryId?: string;
  description?: string;
}

interface IdentifyRiskFormProps {
  form: IdentifyFormState;
  errors: IdentifyFormErrors;
  categories: RiskCategory[];
  subProcesses: SubProcess[];
  process: Process;
  onChange: (patch: Partial<IdentifyFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function IdentifyRiskForm({
  form, errors, categories, subProcesses, onChange, onSubmit, onCancel,
}: IdentifyRiskFormProps) {
  return (
    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ── Risk Details section ── */}
        <SectionDivider label="Risk Details" />

        {/* Title */}
        <Field label="Risk Title" required error={errors.title}>
          <TextInput
            value={form.title}
            hasError={!!errors.title}
            placeholder="Concise description of the risk"
            onChange={e => onChange({ title: e.target.value })}
          />
        </Field>

        {/* Risk Type + Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Risk Type" required error={errors.riskType}>
            <SelectInput
              value={form.riskType}
              hasError={!!errors.riskType}
              onChange={e => onChange({ riskType: e.target.value as RiskType })}
            >
              {riskTypes.map(t => (
                <option key={t} value={t}>{RISK_TYPE_LABELS[t as RiskType] ?? t}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Risk Category" required error={errors.categoryId}>
            <SelectInput
              value={form.categoryId}
              hasError={!!errors.categoryId}
              onChange={e => onChange({ categoryId: e.target.value })}
            >
              <option value="">— Select category —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Description */}
        <Field
          label="Description"
          required
          error={errors.description}
          helpText="Describe the nature, cause, and potential impact of the risk."
        >
          <TextareaInput
            value={form.description}
            hasError={!!errors.description}
            rows={3}
            placeholder="Describe the nature, cause, and potential impact of this risk…"
            onChange={e => onChange({ description: e.target.value })}
          />
        </Field>

        {/* Appetite + Review Frequency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Risk Appetite" helpText="Organisation's tolerance level for this risk.">
            <SelectInput
              value={form.appetiteLevel}
              onChange={e => onChange({ appetiteLevel: e.target.value })}
            >
              {appetiteLvls.map(a => (
                <option key={a} value={a}>{APPETITE_LEVEL_LABELS[a as AppetiteLevel] ?? a}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Review Frequency">
            <SelectInput
              value={form.reviewFrequency}
              onChange={e => onChange({ reviewFrequency: e.target.value })}
            >
              {reviewFreqs.map(f => (
                <option key={f} value={f}>{REVIEW_FREQUENCY_LABELS[f as ReviewFrequency] ?? f}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Owner + Department */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Risk Owner" helpText="Person accountable for managing this risk.">
            <SelectInput
              value={form.ownerId}
              onChange={e => onChange({ ownerId: e.target.value })}
            >
              <option value="">— No owner —</option>
              {MOCK_USERS.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Department">
            <SelectInput
              value={form.department}
              onChange={e => onChange({ department: e.target.value })}
            >
              <option value="">— Select department —</option>
              {deptOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* ── Process Linkage section ── */}
        <SectionDivider label="Process Linkage" />

        {/* Sub-Process Association */}
        {subProcesses.length > 0 && (
          <Field
            label="Sub-Process Association"
            helpText="Optionally link this risk to a specific sub-process where it manifests."
          >
            <SelectInput
              value={form.subProcessId}
              onChange={e => onChange({ subProcessId: e.target.value })}
            >
              <option value="">Process-level (not sub-process specific)</option>
              {subProcesses.map(sp => (
                <option key={sp.id} value={sp.id}>{sp.name}</option>
              ))}
            </SelectInput>
          </Field>
        )}

        {/* Linkage notes */}
        <Field
          label="Linkage Notes"
          helpText="Describe how this risk relates to this process (optional)."
        >
          <TextareaInput
            value={form.notes}
            rows={2}
            placeholder="e.g. This risk is introduced in the data ingestion step of this process…"
            onChange={e => onChange({ notes: e.target.value })}
          />
        </Field>

        {/* Actions — right-aligned per Appian guidelines */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={secondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            style={primaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> Add to Register & Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Risks Grid ────────────────────────────────────────────────────────────────

interface RisksGridProps {
  processLinks: ProcessRiskLink[];
  allRisks: Risk[];
  subProcesses: SubProcess[];
  latestAssessmentMap: Map<string, RiskAssessment>;
  navigate: (path: string) => void;
  onUnlink: (linkId: string) => void;
}

function RisksGrid({
  processLinks, allRisks, subProcesses, latestAssessmentMap, navigate, onUnlink,
}: RisksGridProps) {
  const [page, setPage] = useState(1);

  // Reset page when links change
  useEffect(() => { setPage(1); }, [processLinks.length]);

  const totalPages = Math.ceil(processLinks.length / PAGE_SIZE);
  const paged = processLinks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const subMap = useMemo(() => {
    const m = new Map<string, string>();
    subProcesses.forEach(sp => m.set(sp.id, sp.name));
    return m;
  }, [subProcesses]);

  const riskMap = useMemo(() => {
    const m = new Map<string, Risk>();
    allRisks.forEach(r => m.set(r.id, r));
    return m;
  }, [allRisks]);

  const colHdr: React.CSSProperties = {
    padding: '8px 12px',
    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
    textAlign: 'left', whiteSpace: 'nowrap', userSelect: 'none',
    background: 'var(--muted)', borderBottom: '1px solid var(--border)',
  };

  const cell: React.CSSProperties = {
    padding: '10px 12px', verticalAlign: 'middle',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
  };

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...colHdr, width: '100px' }}>Risk ID</th>
              <th style={{ ...colHdr }}>Title</th>
              <th style={{ ...colHdr, width: '120px' }}>Type</th>
              <th style={{ ...colHdr, width: '140px' }}>Rating</th>
              <th style={{ ...colHdr, width: '160px' }}>Sub-Process</th>
              <th style={{ ...colHdr, width: '90px' }}>Status</th>
              <th style={{ ...colHdr, width: '150px' }}>Owner</th>
              <th style={{ ...colHdr, width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((link, idx) => {
              const risk = riskMap.get(link.riskId);
              if (!risk) return null;
              const isEven = idx % 2 === 0;
              return (
                <tr
                  key={link.id}
                  style={{ background: isEven ? 'var(--card)' : 'var(--muted)' }}
                >
                  {/* Risk ID */}
                  <td style={{ ...cell }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/risks/${risk.id}`)}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
                        textDecoration: 'underline', textUnderlineOffset: '2px',
                      }}
                    >
                      {risk.id}
                    </button>
                  </td>
                  {/* Title */}
                  <td style={{ ...cell }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/risks/${risk.id}`)}
                      style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
                    >
                      {risk.title}
                    </button>
                    {link.notes && (
                      <div style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                        marginTop: '2px', lineHeight: '16px',
                      }}>
                        {link.notes}
                      </div>
                    )}
                  </td>
                  {/* Type */}
                  <td style={{ ...cell }}><RiskTypeBadge type={risk.riskType} /></td>
                  {/* Rating */}
                  <td style={{ ...cell }}><RatingBadge riskId={risk.id} map={latestAssessmentMap} /></td>
                  {/* Sub-Process */}
                  <td style={{ ...cell }}>
                    {link.subProcessId
                      ? (
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                        }}>
                          {subMap.get(link.subProcessId) ?? link.subProcessId}
                        </span>
                      )
                      : (
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          fontStyle: 'italic',
                        }}>
                          Process-level
                        </span>
                      )}
                  </td>
                  {/* Status */}
                  <td style={{ ...cell }}><RiskStatusBadge status={risk.status} /></td>
                  {/* Owner */}
                  <td style={{ ...cell }}>
                    {risk.owner ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <UserAvatar user={risk.owner} size={22} />
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
                        }}>
                          {risk.owner.name}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted-foreground)', fontSize: '12px', fontFamily: 'var(--font-family-primary)' }}>—</span>
                    )}
                  </td>
                  {/* Unlink */}
                  <td style={{ ...cell, textAlign: 'right' }}>
                    <button
                      type="button"
                      title="Unlink risk"
                      onClick={() => onUnlink(link.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                        background: 'transparent', cursor: 'pointer',
                        color: 'var(--muted-foreground)', transition: 'border-color 0.1s, color 0.1s',
                      }}
                      onMouseEnter={e => {
                        const b = e.currentTarget as HTMLButtonElement;
                        b.style.borderColor = 'var(--destructive)';
                        b.style.color = 'var(--destructive)';
                      }}
                      onMouseLeave={e => {
                        const b = e.currentTarget as HTMLButtonElement;
                        b.style.borderColor = 'var(--border)';
                        b.style.color = 'var(--muted-foreground)';
                      }}
                    >
                      <Link2Off size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination — shown only when > 10 rows (Appian guideline) */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderTop: '1px solid var(--border)',
        }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, processLinks.length)} of {processLinks.length}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)', background: 'transparent',
                cursor: page === 1 ? 'default' : 'pointer',
                color: 'var(--muted-foreground)', opacity: page === 1 ? 0.35 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              padding: '0 8px',
            }}>
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)', background: 'transparent',
                cursor: page === totalPages ? 'default' : 'pointer',
                color: 'var(--muted-foreground)', opacity: page === totalPages ? 0.35 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Link Existing Risk Modal ─────────────────────────────────────────────────

interface LinkRiskModalProps {
  availableRisks: Risk[];
  allRisks: Risk[];
  subProcesses: SubProcess[];
  search: string;
  statusFilter: string;
  typeFilter: string;
  selectedRiskId: string | null;
  subProcessId: string;
  notes: string;
  latestAssessmentMap: Map<string, RiskAssessment>;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onTypeFilterChange: (v: string) => void;
  onSelectRisk: (id: string | null) => void;
  onSubProcessChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onLink: () => void;
  onClose: () => void;
}

const RISK_STATUSES_FILTER = ['draft', 'active', 'closed', 'archived'] as const;

function LinkRiskModal({
  availableRisks, subProcesses, search, statusFilter, typeFilter, selectedRiskId,
  subProcessId, notes, latestAssessmentMap,
  onSearchChange, onStatusFilterChange, onTypeFilterChange, onSelectRisk,
  onSubProcessChange, onNotesChange, onLink, onClose,
}: LinkRiskModalProps) {
  const selectedRisk = availableRisks.find(r => r.id === selectedRiskId)
    ?? (selectedRiskId ? undefined : undefined);

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
    lineHeight: '20px',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
          width: '100%', maxWidth: '720px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
            }}>
              Link Existing Risk
            </h2>
            <p style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              margin: '2px 0 0 0',
            }}>
              Select a risk from the register to associate with this process.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none', borderRadius: 'var(--radius-input)',
              background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px' }}>

          {/* Search + Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
              <Search size={14} style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Search by title or ID…"
                style={{
                  width: '100%', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                  background: 'var(--input-background)', color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => onStatusFilterChange(e.target.value)}
              style={{
                height: '36px', padding: '0 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)', cursor: 'pointer', minWidth: '130px',
              }}
            >
              <option value="">All Statuses</option>
              {RISK_STATUSES_FILTER.map(s => (
                <option key={s} value={s}>{RISK_STATUS_LABELS[s]}</option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={e => onTypeFilterChange(e.target.value)}
              style={{
                height: '36px', padding: '0 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)', cursor: 'pointer', minWidth: '140px',
              }}
            >
              <option value="">All Types</option>
              {riskTypes.map(t => (
                <option key={t} value={t}>{RISK_TYPE_LABELS[t as RiskType] ?? t}</option>
              ))}
            </select>
          </div>

          {/* Risk list */}
          <div style={{
            border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
            overflow: 'hidden', maxHeight: '280px', overflowY: 'auto',
          }}>
            {availableRisks.length === 0 ? (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
              }}>
                {search || statusFilter || typeFilter
                  ? 'No risks match your filters.'
                  : 'All risks are already linked to this process.'}
              </div>
            ) : (
              availableRisks.map((risk, idx) => {
                const isSelected = selectedRiskId === risk.id;
                const isEven = idx % 2 === 0;
                const assessment = latestAssessmentMap.get(risk.id);
                return (
                  <div
                    key={risk.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectRisk(isSelected ? null : risk.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectRisk(isSelected ? null : risk.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px', cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(35,34,240,0.06)'
                        : isEven ? 'var(--card)' : 'var(--muted)',
                      borderBottom: idx < availableRisks.length - 1 ? '1px solid var(--border)' : 'none',
                      outline: 'none', transition: 'background 0.1s',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    }}
                  >
                    {/* Selection indicator */}
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--primary)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.1s, background 0.1s',
                    }}>
                      {isSelected && <Check size={10} style={{ color: 'var(--primary-foreground)' }} />}
                    </div>

                    {/* Risk info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                        }}>
                          {risk.id}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {risk.title}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <RiskTypeBadge type={risk.riskType} />
                        <RiskStatusBadge status={risk.status} />
                        {assessment && (
                          <Pill
                            bg={RISK_RATING_STYLES[assessment.riskRating].background}
                            fg={RISK_RATING_STYLES[assessment.riskRating].color}
                            label={RISK_RATING_LABELS[assessment.riskRating]}
                          />
                        )}
                        {risk.owner && (
                          <span style={{
                            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                          }}>
                            {risk.owner.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Linkage details — only shown when a risk is selected */}
          {selectedRiskId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SectionDivider label="Linkage Details" />

              {subProcesses.length > 0 && (
                <Field
                  label="Sub-Process Association"
                  helpText="Optionally narrow this link to a specific sub-process."
                >
                  <SelectInput
                    value={subProcessId}
                    onChange={e => onSubProcessChange(e.target.value)}
                  >
                    <option value="">Process-level (not sub-process specific)</option>
                    {subProcesses.map(sp => (
                      <option key={sp.id} value={sp.id}>{sp.name}</option>
                    ))}
                  </SelectInput>
                </Field>
              )}

              <Field
                label="Linkage Notes"
                helpText="Describe how this risk relates to this process (optional)."
              >
                <TextareaInput
                  value={notes}
                  rows={2}
                  placeholder="e.g. Relevant in the data handling phase of this process…"
                  onChange={e => onNotesChange(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px',
          padding: '16px 24px', borderTop: '1px solid var(--border)', flexShrink: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={secondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedRiskId}
            onClick={onLink}
            style={{
              ...primaryBtn,
              opacity: selectedRiskId ? 1 : 0.45,
              cursor: selectedRiskId ? 'pointer' : 'default',
            }}
            onMouseEnter={e => { if (selectedRiskId) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { if (selectedRiskId) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Link2 size={14} /> Link Risk
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unlink Confirmation Dialog ───────────────────────────────────────────────

function UnlinkConfirmDialog({
  riskTitle, onConfirm, onCancel,
}: { riskTitle: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '440px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '18px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
        }}>
          Unlink Risk
        </h3>
        <p style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          margin: 0, lineHeight: '22px',
        }}>
          Remove the link between this process and{' '}
          <strong style={{ color: 'var(--foreground)' }}>{riskTitle}</strong>?{' '}
          The risk will remain in the register — only the process association will be removed.
        </p>
        {/* Contextual warning */}
        <div style={{
          padding: '12px', background: 'rgba(192,57,43,0.06)',
          borderRadius: 'var(--radius-card)', border: '1px solid rgba(192,57,43,0.2)',
        }}>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--destructive)',
            margin: 0, lineHeight: '18px',
          }}>
            This action cannot be undone. You can re-link the risk at any time via "Link Existing Risk".
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={secondaryBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={dangerBtn}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Link2Off size={14} /> Unlink Risk
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────

interface ProcessRisksTabProps {
  process: Process;
  navigate: (path: string) => void;
  onCountChange: (count: number) => void;
}

export function ProcessRisksTab({ process, navigate, onCountChange }: ProcessRisksTabProps) {
  const { getActiveOptions } = useApp();
  const riskTypes     = getActiveOptions('Risk', 'Type');
  const appetiteLvls  = getActiveOptions('Risk', 'Appetite Level');
  const reviewFreqs   = getActiveOptions('Risk', 'Review Frequency');
  const deptOptions   = getActiveOptions('Risk', 'Department');

  // ── Data state ───────────────────────────────────────────────────────────────
  const [allLinks, setAllLinks] = useState<ProcessRiskLink[]>([]);
  const [allRisks, setAllRisks] = useState<Risk[]>([]);
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showIdentifyForm, setShowIdentifyForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [unlinkingLinkId, setUnlinkingLinkId] = useState<string | null>(null);

  // Link modal sub-state
  const [linkSearch, setLinkSearch] = useState('');
  const [linkStatusFilter, setLinkStatusFilter] = useState('');
  const [linkTypeFilter, setLinkTypeFilter] = useState('');
  const [linkSelectedRiskId, setLinkSelectedRiskId] = useState<string | null>(null);
  const [linkSubProcessId, setLinkSubProcessId] = useState('');
  const [linkNotes, setLinkNotes] = useState('');

  // Identify form
  const defaultForm = (): IdentifyFormState => ({
    title: '',
    riskType: 'operational',
    categoryId: '',
    description: '',
    appetiteLevel: 'cautious',
    department: process.owner?.department ?? '',
    ownerId: process.owner?.id ?? '',
    reviewFrequency: 'quarterly',
    subProcessId: '',
    notes: '',
  });

  const [identifyForm, setIdentifyForm] = useState<IdentifyFormState>(defaultForm);
  const [identifyErrors, setIdentifyErrors] = useState<IdentifyFormErrors>({});

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setAllLinks(loadProcessRiskLinks());
    setAllRisks(loadRisks());
    setCategories(loadRiskCategories());
    setAssessments(loadRiskAssessments());
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const processLinks = useMemo(
    () => getLinksForProcess(allLinks, process.id),
    [allLinks, process.id],
  );

  const linkedRiskIds = useMemo(() => new Set(processLinks.map(l => l.riskId)), [processLinks]);

  const linkedRisks = useMemo(
    () => allRisks.filter(r => linkedRiskIds.has(r.id)),
    [allRisks, linkedRiskIds],
  );

  const latestAssessmentMap = useMemo(() => {
    const byRisk = new Map<string, RiskAssessment[]>();
    assessments.forEach(a => {
      if (!byRisk.has(a.riskId)) byRisk.set(a.riskId, []);
      byRisk.get(a.riskId)!.push(a);
    });
    const map = new Map<string, RiskAssessment>();
    byRisk.forEach((list, riskId) => {
      const current = list.find(a => a.isCurrent);
      if (current) {
        map.set(riskId, current);
      } else {
        const sorted = [...list].sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
        if (sorted.length) map.set(riskId, sorted[0]);
      }
    });
    return map;
  }, [assessments]);

  // Available risks for linking (not yet linked)
  const availableToLink = useMemo(() => {
    const q = linkSearch.toLowerCase().trim();
    return allRisks.filter(r => {
      if (linkedRiskIds.has(r.id)) return false;
      if (linkStatusFilter && r.status !== linkStatusFilter) return false;
      if (linkTypeFilter && r.riskType !== linkTypeFilter) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRisks, linkedRiskIds, linkSearch, linkStatusFilter, linkTypeFilter]);

  // ── KPI calculations ─────────────────────────────────────────────────────────
  const totalLinked = processLinks.length;
  const activeCount = linkedRisks.filter(r => r.status === 'active').length;
  const critHighCount = linkedRisks.filter(r => {
    const a = latestAssessmentMap.get(r.id);
    return a && (a.riskRating === 'critical' || a.riskRating === 'high');
  }).length;
  const dueThisQuarter = linkedRisks.filter(r => isThisQuarter(r.nextReviewDate)).length;

  // ── Notify parent ────────────────────────────────────────────────────────────
  useEffect(() => {
    onCountChange(processLinks.length);
  }, [processLinks.length, onCountChange]);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  function persistLinks(links: ProcessRiskLink[]) {
    setAllLinks(links);
    saveProcessRiskLinks(links);
  }
  function persistRisks(risks: Risk[]) {
    setAllRisks(risks);
    saveRisks(risks);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleUnlink() {
    if (!unlinkingLinkId) return;
    persistLinks(allLinks.filter(l => l.id !== unlinkingLinkId));
    setUnlinkingLinkId(null);
  }

  function handleLinkExisting() {
    if (!linkSelectedRiskId) return;
    const now = new Date().toISOString().split('T')[0];
    persistLinks([...allLinks, {
      id: 'PRL-' + generateId(),
      processId: process.id,
      subProcessId: linkSubProcessId || null,
      riskId: linkSelectedRiskId,
      notes: linkNotes,
      linkedAt: now,
      linkedBy: 'Current User',
    }]);
    resetLinkModal();
  }

  function resetLinkModal() {
    setShowLinkModal(false);
    setLinkSearch(''); setLinkStatusFilter(''); setLinkTypeFilter('');
    setLinkSelectedRiskId(null); setLinkSubProcessId(''); setLinkNotes('');
  }

  function validateIdentify(): boolean {
    const errs: IdentifyFormErrors = {};
    if (!identifyForm.title.trim()) errs.title = 'Risk title is required';
    if (!identifyForm.categoryId) errs.categoryId = 'Category is required';
    if (!identifyForm.description.trim()) errs.description = 'Description is required';
    setIdentifyErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleIdentifySubmit() {
    if (!validateIdentify()) return;
    const owner = MOCK_USERS.find(u => u.id === identifyForm.ownerId) ?? null;
    const now = new Date().toISOString().split('T')[0];
    const newRisk: Risk = {
      id: 'RSK-' + generateId(),
      categoryId: identifyForm.categoryId,
      department: identifyForm.department,
      owner,
      title: identifyForm.title.trim(),
      description: identifyForm.description.trim(),
      status: 'draft',
      riskType: identifyForm.riskType,
      appetiteLevel: identifyForm.appetiteLevel as any,
      reviewFrequency: identifyForm.reviewFrequency as any,
      nextReviewDate: '',
      isEnterpriseRisk: false,
      enterpriseRiskId: null,
      createdAt: now,
      createdBy: owner?.name ?? 'Current User',
      updatedAt: now,
      updatedBy: owner?.name ?? 'Current User',
    };
    persistRisks([...allRisks, newRisk]);
    persistLinks([...allLinks, {
      id: 'PRL-' + generateId(),
      processId: process.id,
      subProcessId: identifyForm.subProcessId || null,
      riskId: newRisk.id,
      notes: identifyForm.notes,
      linkedAt: now,
      linkedBy: owner?.name ?? 'Current User',
    }]);
    setShowIdentifyForm(false);
    setIdentifyForm(defaultForm());
    setIdentifyErrors({});
  }

  function handleCancelIdentify() {
    setShowIdentifyForm(false);
    setIdentifyForm(defaultForm());
    setIdentifyErrors({});
  }

  function handleOpenIdentify() {
    setShowLinkModal(false);
    setShowIdentifyForm(true);
  }

  const subs = process.subProcesses ?? [];
  const unlinkingLink = unlinkingLinkId ? allLinks.find(l => l.id === unlinkingLinkId) : null;
  const unlinkingRisk = unlinkingLink ? allRisks.find(r => r.id === unlinkingLink.riskId) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── KPI Strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        <KPITile
          label="Linked Risks"
          value={totalLinked}
          icon={ShieldAlert}
        />
        <KPITile
          label="Active"
          value={activeCount}
          icon={ShieldCheck}
          iconColor="#1C8A45"
        />
        <KPITile
          label="Critical / High"
          value={critHighCount}
          icon={AlertTriangle}
          iconColor={critHighCount > 0 ? '#C0392B' : undefined}
        />
        <KPITile
          label="Due This Quarter"
          value={dueThisQuarter}
          icon={Clock}
          iconColor={dueThisQuarter > 0 ? '#E07B00' : undefined}
        />
      </div>

      {/* ── Linked Risks Card ── */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: (totalLinked > 0 || showIdentifyForm) ? '1px solid var(--border)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            }}>
              Linked Risks
            </span>
            {totalLinked > 0 && (
              <span style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                background: 'var(--muted)', borderRadius: '100px', padding: '1px 7px',
              }}>
                {totalLinked}
              </span>
            )}
          </div>

          {/* Action buttons — right-aligned per Appian SAIL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => { handleCancelIdentify(); setShowLinkModal(true); }}
              style={secondaryBtn}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Link2 size={14} /> Link Existing
            </button>
            <button
              type="button"
              onClick={showIdentifyForm ? handleCancelIdentify : handleOpenIdentify}
              style={{
                ...primaryBtn,
                background: showIdentifyForm ? 'var(--muted)' : 'var(--primary)',
                color: showIdentifyForm ? 'var(--foreground)' : 'var(--primary-foreground)',
                border: showIdentifyForm ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              {showIdentifyForm ? <X size={14} /> : <Plus size={14} />}
              {showIdentifyForm ? 'Cancel' : 'Identify New Risk'}
            </button>
          </div>
        </div>

        {/* Identify New Risk inline form */}
        {showIdentifyForm && (
          <IdentifyRiskForm
            form={identifyForm}
            errors={identifyErrors}
            categories={categories}
            subProcesses={subs}
            process={process}
            onChange={patch => setIdentifyForm(f => ({ ...f, ...patch }))}
            onSubmit={handleIdentifySubmit}
            onCancel={handleCancelIdentify}
          />
        )}

        {/* Empty state */}
        {!showIdentifyForm && totalLinked === 0 && (
          <EmptyState
            icon={ShieldAlert}
            title="No risks identified"
            description="Link existing risks from the register, or identify new ones to build a risk profile for this process."
            action={{ label: 'Identify First Risk', onClick: handleOpenIdentify }}
          />
        )}

        {/* Risk grid */}
        {!showIdentifyForm && totalLinked > 0 && (
          <RisksGrid
            processLinks={processLinks}
            allRisks={allRisks}
            subProcesses={subs}
            latestAssessmentMap={latestAssessmentMap}
            navigate={navigate}
            onUnlink={setUnlinkingLinkId}
          />
        )}
      </div>

      {/* Link Existing modal */}
      {showLinkModal && (
        <LinkRiskModal
          availableRisks={availableToLink}
          allRisks={allRisks}
          subProcesses={subs}
          search={linkSearch}
          statusFilter={linkStatusFilter}
          typeFilter={linkTypeFilter}
          selectedRiskId={linkSelectedRiskId}
          subProcessId={linkSubProcessId}
          notes={linkNotes}
          latestAssessmentMap={latestAssessmentMap}
          onSearchChange={setLinkSearch}
          onStatusFilterChange={setLinkStatusFilter}
          onTypeFilterChange={setLinkTypeFilter}
          onSelectRisk={setLinkSelectedRiskId}
          onSubProcessChange={setLinkSubProcessId}
          onNotesChange={setLinkNotes}
          onLink={handleLinkExisting}
          onClose={resetLinkModal}
        />
      )}

      {/* Unlink confirmation */}
      {unlinkingLinkId && unlinkingRisk && (
        <UnlinkConfirmDialog
          riskTitle={unlinkingRisk.title}
          onConfirm={handleUnlink}
          onCancel={() => setUnlinkingLinkId(null)}
        />
      )}
    </div>
  );
}
