import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, Edit2, ChevronUp, ChevronDown,
  Shield, ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { RiskMitigationFormModal } from './RiskMitigationFormModal';
import type {
  RiskMitigationAction,
  MitigationStatus,
  MitigationPriority,
  MitigationActionType,
} from '../../data/riskMitigationData';
import {
  STATUS_LABELS, STATUS_STYLES,
  PRIORITY_LABELS, PRIORITY_STYLES,
  ACTION_TYPE_LABELS, ACTION_TYPE_STYLES,
  EFFECTIVENESS_LABELS,
  getMitigationsForRisk,
} from '../../data/riskMitigationData';
import { formatDate, formatCurrency, generateId } from '../../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiskMitigationSectionProps {
  riskId: string;
  mitigations: RiskMitigationAction[];
  onMitigationsChange: (updated: RiskMitigationAction[]) => void;
}

type SortField = 'title' | 'actionType' | 'status' | 'priority' | 'assignedTo' | 'dueDate' | 'costEstimate';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

// ─── Pill badge helper ───────────────────────────────────────────────────────

function PillBadge({ label, background, color }: { label: string; background: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        background,
        color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── Column definitions ──────────────────────────────────────────────────────

const COLUMNS: { key: string; label: string; sortable: boolean; minWidth?: string }[] = [
  { key: 'title', label: 'Title', sortable: true, minWidth: '200px' },
  { key: 'actionType', label: 'Type', sortable: true, minWidth: '90px' },
  { key: 'status', label: 'Status', sortable: true, minWidth: '100px' },
  { key: 'priority', label: 'Priority', sortable: true, minWidth: '90px' },
  { key: 'assignedTo', label: 'Assigned To', sortable: true, minWidth: '130px' },
  { key: 'dueDate', label: 'Due Date', sortable: true, minWidth: '110px' },
  { key: 'costEstimate', label: 'Est. Cost', sortable: true, minWidth: '100px' },
  { key: 'effectiveness', label: 'Eff.', sortable: false, minWidth: '50px' },
  { key: 'actions', label: 'Actions', sortable: false, minWidth: '80px' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskMitigationSection({
  riskId,
  mitigations,
  onMitigationsChange,
}: RiskMitigationSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editAction, setEditAction] = useState<RiskMitigationAction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const riskMitigations = useMemo(
    () => getMitigationsForRisk(mitigations, riskId),
    [mitigations, riskId]
  );

  // Summary stats
  const stats = useMemo(() => {
    const open = riskMitigations.filter(m => m.status === 'open').length;
    const inProgress = riskMitigations.filter(m => m.status === 'in_progress').length;
    const complete = riskMitigations.filter(m => m.status === 'complete').length;
    const overdue = riskMitigations.filter(m =>
      (m.status === 'open' || m.status === 'in_progress') &&
      m.dueDate < new Date().toISOString().split('T')[0]
    ).length;
    const totalCost = riskMitigations.reduce((sum, m) => sum + (m.costEstimate ?? 0), 0);
    return { open, inProgress, complete, overdue, totalCost };
  }, [riskMitigations]);

  // Sort
  const sortedMitigations = useMemo(() => {
    const arr = [...riskMitigations];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'actionType':
          cmp = a.actionType.localeCompare(b.actionType);
          break;
        case 'status': {
          const statusOrder: Record<MitigationStatus, number> = { open: 0, in_progress: 1, complete: 2, deferred: 3, cancelled: 4 };
          cmp = statusOrder[a.status] - statusOrder[b.status];
          break;
        }
        case 'priority': {
          const prioOrder: Record<MitigationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
          cmp = prioOrder[a.priority] - prioOrder[b.priority];
          break;
        }
        case 'assignedTo':
          cmp = (a.assignedTo?.name ?? '').localeCompare(b.assignedTo?.name ?? '');
          break;
        case 'dueDate':
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        case 'costEstimate':
          cmp = (a.costEstimate ?? 0) - (b.costEstimate ?? 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [riskMitigations, sortField, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedMitigations.length / PAGE_SIZE));
  const pagedMitigations = sortedMitigations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function handleSaveMitigation(data: Omit<RiskMitigationAction, 'id' | 'createdAt' | 'updatedAt'>) {
    const today = new Date().toISOString().split('T')[0];
    if (editAction) {
      const updated = mitigations.map(m =>
        m.id === editAction.id
          ? { ...m, ...data, updatedAt: today }
          : m
      );
      onMitigationsChange(updated);
    } else {
      const newAction: RiskMitigationAction = {
        ...data,
        id: 'MIT-' + generateId(),
        createdAt: today,
        updatedAt: today,
      };
      onMitigationsChange([...mitigations, newAction]);
    }
    setEditAction(null);
  }

  function handleDelete(id: string) {
    onMitigationsChange(mitigations.filter(m => m.id !== id));
    setDeleteConfirmId(null);
  }

  const today = new Date().toISOString().split('T')[0];

  // ─── Cell styles ─────────────────────────────────────────────────────────────

  const cellStyle: React.CSSProperties = {
    padding: '0 12px',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-regular)',
    color: 'var(--foreground)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const headerCellStyle: React.CSSProperties = {
    padding: '0 12px',
    fontFamily: 'var(--font-family-primary)',
    fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--muted-foreground)',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    background: 'var(--muted)',
    height: '36px',
    verticalAlign: 'middle',
    userSelect: 'none',
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Empty state */}
      {riskMitigations.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '32px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-card)',
              background: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--muted-foreground)',
            }}
          >
            <Shield size={24} />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '20px',
            }}
          >
            No mitigation actions
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: 0,
              maxWidth: '360px',
              lineHeight: '22px',
            }}
          >
            Add mitigation actions to track specific steps being taken to reduce this risk's residual score.
          </p>
          <button
            onClick={() => { setEditAction(null); setFormOpen(true); }}
            style={{
              marginTop: '4px',
              height: '36px',
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} />
            Add Mitigation Action
          </button>
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Summary KPI chips */}
              <SummaryChip label="Open" value={stats.open} color="#2322F0" bg="rgba(35,34,240,0.08)" />
              <SummaryChip label="In Progress" value={stats.inProgress} color="#E07B00" bg="#FFF3E0" />
              <SummaryChip label="Complete" value={stats.complete} color="#1C8A45" bg="#E8F5EE" />
              {stats.overdue > 0 && (
                <SummaryChip label="Overdue" value={stats.overdue} color="#C0392B" bg="rgba(192,57,43,0.10)" />
              )}
              {stats.totalCost > 0 && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Total Est. Cost: {formatCurrency(stats.totalCost)}
                </span>
              )}
            </div>
            <button
              onClick={() => { setEditAction(null); setFormOpen(true); }}
              style={{
                height: '36px',
                padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <Plus size={14} />
              Add Action
            </button>
          </div>

          {/* Grid */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: '900px',
                }}
              >
                <thead>
                  <tr>
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        onClick={col.sortable ? () => handleSort(col.key as SortField) : undefined}
                        style={{
                          ...headerCellStyle,
                          minWidth: col.minWidth,
                          cursor: col.sortable ? 'pointer' : 'default',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {col.label}
                          {col.sortable && sortField === col.key && (
                            sortDir === 'asc'
                              ? <ChevronUp size={12} style={{ color: 'var(--primary)' }} />
                              : <ChevronDown size={12} style={{ color: 'var(--primary)' }} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedMitigations.flatMap((m, idx) => {
                    const isOverdue = (m.status === 'open' || m.status === 'in_progress') && m.dueDate < today;
                    const isExpanded = expandedId === m.id;
                    const rowBg = idx % 2 === 1 ? 'var(--muted)' : 'transparent';
                    const rows: React.ReactElement[] = [(
                        <tr
                          key={m.id}
                          style={{ height: '40px', background: rowBg, transition: 'background 0.1s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(35,34,240,0.03)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = rowBg; }}
                        >
                          {/* Title */}
                          <td style={{ ...cellStyle, maxWidth: '260px' }}>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : m.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--primary)',
                                textAlign: 'left',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '100%',
                                display: 'block',
                              }}
                              title={m.title}
                            >
                              {m.title}
                            </button>
                          </td>
                          {/* Type */}
                          <td style={cellStyle}>
                            <PillBadge
                              label={ACTION_TYPE_LABELS[m.actionType]}
                              background={ACTION_TYPE_STYLES[m.actionType].background}
                              color={ACTION_TYPE_STYLES[m.actionType].color}
                            />
                          </td>
                          {/* Status */}
                          <td style={cellStyle}>
                            <PillBadge
                              label={STATUS_LABELS[m.status]}
                              background={STATUS_STYLES[m.status].background}
                              color={STATUS_STYLES[m.status].color}
                            />
                          </td>
                          {/* Priority */}
                          <td style={cellStyle}>
                            <PillBadge
                              label={PRIORITY_LABELS[m.priority]}
                              background={PRIORITY_STYLES[m.priority].background}
                              color={PRIORITY_STYLES[m.priority].color}
                            />
                          </td>
                          {/* Assigned To */}
                          <td style={cellStyle}>
                            {m.assignedTo?.name ?? '—'}
                          </td>
                          {/* Due Date */}
                          <td style={cellStyle}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: isOverdue ? 'var(--destructive)' : 'var(--foreground)',
                                fontWeight: isOverdue ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                              }}
                            >
                              {isOverdue && <AlertTriangle size={12} />}
                              {formatDate(m.dueDate)}
                            </span>
                          </td>
                          {/* Cost */}
                          <td style={{ ...cellStyle, textAlign: 'right' }}>
                            {m.costEstimate != null ? formatCurrency(m.costEstimate) : '—'}
                          </td>
                          {/* Effectiveness */}
                          <td style={{ ...cellStyle, textAlign: 'center' }}>
                            {m.effectivenessScore != null ? (
                              <span
                                title={EFFECTIVENESS_LABELS[m.effectivenessScore]}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '100px',
                                  background: m.effectivenessScore >= 4 ? '#E8F5EE' : m.effectivenessScore >= 3 ? '#FFF8E1' : 'rgba(192,57,43,0.10)',
                                  color: m.effectivenessScore >= 4 ? '#1C8A45' : m.effectivenessScore >= 3 ? '#B8860B' : '#C0392B',
                                  fontFamily: 'var(--font-family-primary)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  cursor: 'default',
                                }}
                              >
                                {m.effectivenessScore}
                              </span>
                            ) : '—'}
                          </td>
                          {/* Actions */}
                          <td style={cellStyle}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => { setEditAction(m); setFormOpen(true); }}
                                title="Edit"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  border: 'none',
                                  borderRadius: 'var(--radius-input)',
                                  background: 'transparent',
                                  color: 'var(--primary)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(m.id)}
                                title="Delete"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  border: 'none',
                                  borderRadius: 'var(--radius-input)',
                                  background: 'transparent',
                                  color: 'var(--destructive)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                    )];

                    if (isExpanded) {
                      rows.push(
                        <tr key={`${m.id}-expanded`}>
                          <td
                            colSpan={COLUMNS.length}
                            style={{
                              padding: '12px 16px 16px 16px',
                              background: 'rgba(35,34,240,0.02)',
                              borderTop: '1px solid var(--border)',
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              {/* Left: Description */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-family-primary)',
                                    fontSize: '12px',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--muted-foreground)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Description
                                </span>
                                <p
                                  style={{
                                    fontFamily: 'var(--font-family-primary)',
                                    fontSize: 'var(--text-base)',
                                    fontWeight: 'var(--font-weight-regular)',
                                    color: 'var(--foreground)',
                                    margin: 0,
                                    lineHeight: '22px',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {m.description || 'No description provided.'}
                                </p>
                              </div>
                              {/* Right: Metadata */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <DetailRow label="Approved By" value={m.approvedBy?.name ?? '—'} />
                                <DetailRow label="Completion Date" value={m.completionDate ? formatDate(m.completionDate) : '—'} />
                                {m.effectivenessScore != null && (
                                  <DetailRow label="Effectiveness" value={`${m.effectivenessScore}/5 — ${EFFECTIVENESS_LABELS[m.effectivenessScore]}`} />
                                )}
                                <DetailRow label="Created" value={formatDate(m.createdAt)} />
                                <DetailRow label="Last Updated" value={formatDate(m.updatedAt)} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return rows;
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sortedMitigations.length > PAGE_SIZE && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--muted)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedMitigations.length)} of {sortedMitigations.length}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <PaginationBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} />
                  </PaginationBtn>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <PaginationBtn key={p} active={p === page} onClick={() => setPage(p)}>
                      {p}
                    </PaginationBtn>
                  ))}
                  <PaginationBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={14} />
                  </PaginationBtn>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            padding: '24px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirmId(null); }}
        >
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 8px 0',
              }}
            >
              Delete Mitigation Action
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
                lineHeight: '22px',
              }}
            >
              Are you sure you want to delete this mitigation action? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--card)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{
                  height: '36px',
                  padding: '0 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <RiskMitigationFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditAction(null); }}
        onSave={handleSaveMitigation}
        initialData={editAction}
        riskId={riskId}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '28px',
        padding: '0 10px',
        borderRadius: '100px',
        background: bg,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        color,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '14px',
          fontWeight: 'var(--font-weight-bold)',
        }}
      >
        {value}
      </span>
      {label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          minWidth: '110px',
          flexShrink: 0,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PaginationBtn({
  children,
  disabled,
  active,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        minWidth: '28px',
        height: '28px',
        padding: '0 6px',
        border: active ? '1px solid var(--primary)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        background: active ? 'var(--primary)' : 'var(--card)',
        color: active ? 'var(--primary-foreground)' : disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}