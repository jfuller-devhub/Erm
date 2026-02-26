import React, { useState, useMemo } from 'react';
import {
  Plus, Trash2, CheckCircle2, TrendingDown, TrendingUp,
  Activity, Edit2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { RiskAssessmentFormModal } from './RiskAssessmentFormModal';
import type { RiskAssessment, RiskRating, AssessmentType } from '../../data/riskAssessmentData';
import {
  RISK_RATING_LABELS, RISK_RATING_STYLES,
  ASSESSMENT_TYPE_LABELS,
  LIKELIHOOD_LABELS, IMPACT_LABELS, VELOCITY_LABELS,
  deriveRiskRating,
  getAssessmentsForRisk, getCurrentAssessment,
} from '../../data/riskAssessmentData';
import { formatDate, generateId } from '../../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiskAssessmentSectionProps {
  riskId: string;
  assessments: RiskAssessment[];
  onAssessmentsChange: (updated: RiskAssessment[]) => void;
}

type SortField = 'assessmentDate' | 'assessmentType' | 'reviewer' | 'inherentScore' | 'residualScore' | 'riskRating';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

// ─── Rating badge ────────────────────────────────────────────────────────────

function RatingBadge({ rating, size = 'md' }: { rating: RiskRating; size?: 'sm' | 'md' }) {
  const style = RISK_RATING_STYLES[rating];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: size === 'sm' ? '20px' : '22px',
        padding: size === 'sm' ? '0 8px' : '0 10px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {RISK_RATING_LABELS[rating]}
    </span>
  );
}

// ─── Assessment type badge ───────────────────────────────────────────────────

const TYPE_BADGE_STYLES: Record<AssessmentType, { background: string; color: string }> = {
  periodic:  { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  triggered: { background: '#FFF3E0', color: '#E07B00' },
  ad_hoc:    { background: '#F0F2F7', color: '#6B7489' },
};

function AssessmentTypeBadge({ type }: { type: AssessmentType }) {
  const style = TYPE_BADGE_STYLES[type];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        background: style.background,
        color: style.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
      }}
    >
      {ASSESSMENT_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Column definitions ──────────────────────────────────────────────────────

const COLUMNS: { key: string; label: string; sortable: boolean; minWidth?: string }[] = [
  { key: 'assessmentDate', label: 'Date', sortable: true, minWidth: '110px' },
  { key: 'assessmentType', label: 'Type', sortable: true, minWidth: '90px' },
  { key: 'reviewer', label: 'Reviewer', sortable: true, minWidth: '120px' },
  { key: 'likelihoodImpact', label: 'L × I', sortable: false, minWidth: '70px' },
  { key: 'velocity', label: 'Velocity', sortable: false, minWidth: '80px' },
  { key: 'inherentScore', label: 'Inherent', sortable: true, minWidth: '80px' },
  { key: 'residualScore', label: 'Residual', sortable: true, minWidth: '80px' },
  { key: 'targetScore', label: 'Target', sortable: false, minWidth: '70px' },
  { key: 'riskRating', label: 'Rating', sortable: true, minWidth: '90px' },
  { key: 'isCurrent', label: 'Current', sortable: false, minWidth: '70px' },
  { key: 'actions', label: 'Actions', sortable: false, minWidth: '80px' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskAssessmentSection({
  riskId,
  assessments,
  onAssessmentsChange,
}: RiskAssessmentSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editAssessment, setEditAssessment] = useState<RiskAssessment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('assessmentDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const riskAssessments = useMemo(
    () => getAssessmentsForRisk(assessments, riskId),
    [assessments, riskId]
  );

  const current = useMemo(
    () => getCurrentAssessment(assessments, riskId),
    [assessments, riskId]
  );

  // Previous assessment for trend
  const previous = useMemo(() => {
    if (!current) return undefined;
    const sorted = riskAssessments.filter(a => a.id !== current.id);
    return sorted.length > 0 ? sorted[0] : undefined;
  }, [current, riskAssessments]);

  const trendDirection = useMemo(() => {
    if (!current || !previous) return null;
    if (current.residualScore < previous.residualScore) return 'improving';
    if (current.residualScore > previous.residualScore) return 'worsening';
    return 'stable';
  }, [current, previous]);

  // Sort assessments
  const sortedAssessments = useMemo(() => {
    const arr = [...riskAssessments];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'assessmentDate':
          cmp = a.assessmentDate.localeCompare(b.assessmentDate);
          break;
        case 'assessmentType':
          cmp = a.assessmentType.localeCompare(b.assessmentType);
          break;
        case 'reviewer':
          cmp = (a.reviewer?.name ?? '').localeCompare(b.reviewer?.name ?? '');
          break;
        case 'inherentScore':
          cmp = a.inherentScore - b.inherentScore;
          break;
        case 'residualScore':
          cmp = a.residualScore - b.residualScore;
          break;
        case 'riskRating': {
          const order: Record<RiskRating, number> = { critical: 4, high: 3, medium: 2, low: 1, negligible: 0 };
          cmp = order[a.riskRating] - order[b.riskRating];
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [riskAssessments, sortField, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sortedAssessments.length / PAGE_SIZE));
  const pagedAssessments = sortedAssessments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  function handleSaveAssessment(data: Omit<RiskAssessment, 'id' | 'createdAt' | 'updatedAt'>) {
    const today = new Date().toISOString().split('T')[0];

    if (editAssessment) {
      let updated = assessments.map(a =>
        a.id === editAssessment.id
          ? { ...a, ...data, updatedAt: today }
          : a
      );
      if (data.isCurrent) {
        updated = updated.map(a =>
          a.riskId === riskId && a.id !== editAssessment.id
            ? { ...a, isCurrent: false }
            : a
        );
      }
      onAssessmentsChange(updated);
    } else {
      const newAssessment: RiskAssessment = {
        ...data,
        id: 'ASMT-' + generateId(),
        createdAt: today,
        updatedAt: today,
      };
      let updated = [...assessments, newAssessment];
      if (data.isCurrent) {
        updated = updated.map(a =>
          a.riskId === riskId && a.id !== newAssessment.id
            ? { ...a, isCurrent: false }
            : a
        );
      }
      onAssessmentsChange(updated);
    }
    setEditAssessment(null);
  }

  function handleDelete(id: string) {
    onAssessmentsChange(assessments.filter(a => a.id !== id));
    setDeleteConfirmId(null);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4, 16px)' }}>
      {/* Empty state */}
      {riskAssessments.length === 0 ? (
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
            <Activity size={24} />
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
            No assessments recorded
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
            Add the first risk assessment to begin scoring and tracking this risk over time.
          </p>
          <button
            onClick={() => { setEditAssessment(null); setFormOpen(true); }}
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
            Add Assessment
          </button>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          {/* Header bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
                Risk Assessments ({riskAssessments.length})
              </h3>
              {/* Trend indicator next to title */}
              {current && trendDirection && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    height: '22px',
                    padding: '0 8px',
                    borderRadius: '100px',
                    background:
                      trendDirection === 'improving'
                        ? '#E8F5EE'
                        : trendDirection === 'worsening'
                        ? 'rgba(192,57,43,0.08)'
                        : 'var(--muted)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color:
                      trendDirection === 'improving'
                        ? '#1C8A45'
                        : trendDirection === 'worsening'
                        ? '#C0392B'
                        : 'var(--muted-foreground)',
                  }}
                >
                  {trendDirection === 'improving' && <TrendingDown size={12} />}
                  {trendDirection === 'worsening' && <TrendingUp size={12} />}
                  {trendDirection === 'improving'
                    ? 'Improving'
                    : trendDirection === 'worsening'
                    ? 'Worsening'
                    : 'Stable'}
                </span>
              )}
            </div>
            <button
              onClick={() => { setEditAssessment(null); setFormOpen(true); }}
              style={{
                height: '28px',
                padding: '0 10px',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={12} />
              New Assessment
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  {COLUMNS.map(col => {
                    const isSorted = col.sortable && sortField === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={col.sortable ? () => handleSort(col.key as SortField) : undefined}
                        style={{
                          padding: '0 12px',
                          height: '36px',
                          textAlign: 'left',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--muted-foreground)',
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          whiteSpace: 'nowrap',
                          cursor: col.sortable ? 'pointer' : 'default',
                          userSelect: 'none',
                          minWidth: col.minWidth,
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {col.label}
                          {col.sortable && (
                            <span
                              style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                lineHeight: 0,
                                opacity: isSorted ? 1 : 0.35,
                              }}
                            >
                              <ChevronUp
                                size={10}
                                style={{
                                  color: isSorted && sortDir === 'asc' ? 'var(--primary)' : 'var(--muted-foreground)',
                                  marginBottom: '-2px',
                                }}
                              />
                              <ChevronDown
                                size={10}
                                style={{
                                  color: isSorted && sortDir === 'desc' ? 'var(--primary)' : 'var(--muted-foreground)',
                                  marginTop: '-2px',
                                }}
                              />
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pagedAssessments.flatMap((a, idx) => {
                  const isCurrentRow = a.isCurrent;
                  const rowBg = isCurrentRow
                    ? 'rgba(35,34,240,0.04)'
                    : idx % 2 === 0
                    ? 'var(--card)'
                    : 'var(--muted)';

                  const rows: React.ReactElement[] = [];

                  rows.push(
                    <tr
                      key={a.id}
                      style={{
                        borderBottom: expandedNotes === a.id ? 'none' : '1px solid var(--border)',
                        background: rowBg,
                        borderLeft: isCurrentRow ? '3px solid var(--primary)' : '3px solid transparent',
                        cursor: a.notes ? 'pointer' : 'default',
                      }}
                      onClick={() => {
                        if (a.notes) {
                          setExpandedNotes(prev => (prev === a.id ? null : a.id));
                        }
                      }}
                      title={a.notes ? 'Click to expand notes' : undefined}
                    >
                      {/* Date */}
                      <td style={cellStyle}>
                        <span style={{ ...cellTextStyle, fontWeight: 'var(--font-weight-regular)' }}>
                          {formatDate(a.assessmentDate)}
                        </span>
                      </td>

                      {/* Type */}
                      <td style={cellStyle}>
                        <AssessmentTypeBadge type={a.assessmentType} />
                      </td>

                      {/* Reviewer */}
                      <td style={cellStyle}>
                        <span style={cellTextStyle}>
                          {a.reviewer?.name ?? '—'}
                        </span>
                      </td>

                      {/* L × I */}
                      <td style={cellStyle}>
                        <span style={cellTextStyle}>
                          <span
                            title={`Likelihood: ${a.likelihoodScore} (${LIKELIHOOD_LABELS[a.likelihoodScore]})`}
                          >
                            {a.likelihoodScore}
                          </span>
                          {' × '}
                          <span
                            title={`Impact: ${a.impactScore} (${IMPACT_LABELS[a.impactScore]})`}
                          >
                            {a.impactScore}
                          </span>
                        </span>
                      </td>

                      {/* Velocity */}
                      <td style={cellStyle}>
                        <span style={cellTextStyle}>
                          {a.velocityScore != null ? (
                            <span title={VELOCITY_LABELS[a.velocityScore]}>
                              {a.velocityScore} — {VELOCITY_LABELS[a.velocityScore]}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                          )}
                        </span>
                      </td>

                      {/* Inherent */}
                      <td style={cellStyle}>
                        <span
                          style={{
                            ...cellTextStyle,
                            fontWeight: 'var(--font-weight-semibold)',
                            color: RISK_RATING_STYLES[deriveRiskRating(a.inherentScore)].color,
                          }}
                        >
                          {a.inherentScore}
                        </span>
                      </td>

                      {/* Residual */}
                      <td style={cellStyle}>
                        <span
                          style={{
                            ...cellTextStyle,
                            fontWeight: 'var(--font-weight-semibold)',
                            color: RISK_RATING_STYLES[a.riskRating].color,
                          }}
                        >
                          {a.residualScore}
                        </span>
                      </td>

                      {/* Target */}
                      <td style={cellStyle}>
                        <span
                          style={{
                            ...cellTextStyle,
                            color: a.targetScore != null ? 'var(--foreground)' : 'var(--muted-foreground)',
                          }}
                        >
                          {a.targetScore != null ? a.targetScore : '—'}
                        </span>
                      </td>

                      {/* Rating */}
                      <td style={cellStyle}>
                        <RatingBadge rating={a.riskRating} size="sm" />
                      </td>

                      {/* Current */}
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        {a.isCurrent ? (
                          <CheckCircle2 size={16} style={{ color: '#1C8A45' }} />
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontSize: '12px' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={cellStyle}>
                        <div
                          style={{ display: 'flex', gap: '4px' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { setEditAssessment(a); setFormOpen(true); }}
                            title="Edit"
                            style={actionBtnStyle}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(a.id)}
                            title="Delete"
                            style={{ ...actionBtnStyle, color: 'var(--destructive)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );

                  if (expandedNotes === a.id && a.notes) {
                    rows.push(
                      <tr
                        key={`${a.id}-notes`}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: rowBg,
                        }}
                      >
                        <td
                          colSpan={COLUMNS.length}
                          style={{
                            padding: '0 12px 12px 12px',
                          }}
                        >
                          <div
                            style={{
                              padding: '8px 12px',
                              background: 'var(--muted)',
                              borderRadius: 'var(--radius-card)',
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '12px',
                              fontWeight: 'var(--font-weight-regular)',
                              color: 'var(--foreground)',
                              lineHeight: '18px',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--muted-foreground)',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginRight: '8px',
                              }}
                            >
                              Notes:
                            </span>
                            {a.notes}
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
          {sortedAssessments.length > PAGE_SIZE && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
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
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedAssessments.length)} of{' '}
                {sortedAssessments.length}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '28px',
                      height: '28px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: p === page ? '1px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      background: p === page ? 'var(--primary)' : 'var(--card)',
                      color: p === page ? 'var(--primary-foreground)' : 'var(--foreground)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
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
              Delete Assessment
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
                lineHeight: '22px',
              }}
            >
              Are you sure you want to delete this assessment record? This action cannot be undone.
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
      <RiskAssessmentFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditAssessment(null); }}
        onSave={handleSaveAssessment}
        initialData={editAssessment}
        riskId={riskId}
      />
    </div>
  );
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const cellStyle: React.CSSProperties = {
  padding: '0 12px',
  height: '40px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const cellTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-primary)',
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-weight-regular)',
  color: 'var(--foreground)',
};

const actionBtnStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  border: 'none',
  borderRadius: 'var(--radius-input)',
  background: 'transparent',
  color: 'var(--muted-foreground)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};