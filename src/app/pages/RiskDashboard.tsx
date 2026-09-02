import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Search, X, ShieldAlert, ShieldCheck,
  Settings2, FileText, Clock, Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { KPITile } from '../components/shared/KPITile';
import { RecordGrid, type GridColumn } from '../components/shared/RecordGrid';
import { EmptyState } from '../components/shared/EmptyState';
import { RiskFormModal } from '../components/risks/RiskFormModal';
import { RiskCategoryModal } from '../components/risks/RiskCategoryModal';
import type { Risk, RiskStatus, RiskType, RiskCategory } from '../data/riskData';
import { useApp } from '../context/AppContext';
import {
  loadRisks, saveRisks, loadRiskCategories, saveRiskCategories,
  RISK_STATUS_LABELS, RISK_TYPE_LABELS, APPETITE_LEVEL_LABELS, REVIEW_FREQUENCY_LABELS,
} from '../data/riskData';
import type { RiskAssessment } from '../data/riskAssessmentData';
import {
  loadRiskAssessments,
  RISK_RATING_LABELS, RISK_RATING_STYLES,
} from '../data/riskAssessmentData';
import { formatDate, generateId } from '../data/mockData';
import { DEPARTMENTS } from '../data/controlData';

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<RiskStatus, { background: string; color: string }> = {
  draft:    { background: '#FFF3E0', color: '#E07B00' },
  active:   { background: '#E8F5EE', color: '#1C8A45' },
  closed:   { background: '#F0F0F0', color: '#6B7489' },
  archived: { background: '#F0F0F0', color: '#6B7489' },
};

function RiskStatusBadge({ status }: { status: RiskStatus }) {
  const style = STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };
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
      {RISK_STATUS_LABELS[status]}
    </span>
  );
}

// ─── Risk Type badge ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<RiskType, { background: string; color: string }> = {
  strategic:    { background: 'rgba(35,34,240,0.08)', color: '#2322F0' },
  operational:  { background: '#FFF3E0', color: '#E07B00' },
  financial:    { background: '#E8F5EE', color: '#1C8A45' },
  compliance:   { background: '#E0F5F5', color: '#00A3A3' },
  reputational: { background: '#FDE8E8', color: '#C0392B' },
  cyber:        { background: '#F0E8FF', color: '#6B3FA0' },
};

function RiskTypeBadge({ type }: { type: RiskType }) {
  const style = TYPE_STYLES[type] ?? { background: '#F0F0F0', color: '#6B7489' };
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
      {RISK_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Enterprise Risk badge ────────────────────────────────────────────────────

function EnterpriseRiskBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height: '20px',
        padding: '0 8px',
        borderRadius: '100px',
        background: 'rgba(35,34,240,0.1)',
        color: 'var(--primary)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: '16px',
        whiteSpace: 'nowrap',
        border: '1px solid rgba(35,34,240,0.2)',
      }}
    >
      <Building2 size={10} />
      Enterprise
    </span>
  );
}

// ─── Category color chip ─────────────────────────────────────────────────────

function CategoryChip({ category }: { category: RiskCategory | undefined }) {
  if (!category) return <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>—</span>;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--font-family-primary)',
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-regular)',
        color: 'var(--foreground)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: category.colorHex,
          flexShrink: 0,
        }}
      />
      {category.name}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskDashboard() {
  const navigate = useNavigate();
  const { getActiveOptions } = useApp();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [allAssessments, setAllAssessments] = useState<RiskAssessment[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RiskStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<RiskType | ''>('');
  const riskStatusOpts = getActiveOptions('Risk', 'Status');
  const riskTypeOpts   = getActiveOptions('Risk', 'Type');

  const [formOpen, setFormOpen] = useState(false);
  const [editRisk, setEditRisk] = useState<Risk | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    setRisks(loadRisks());
    setCategories(loadRiskCategories());
    setAllAssessments(loadRiskAssessments());
  }, []);

  // Persist
  const persistRisks = useCallback((updated: Risk[]) => {
    setRisks(updated);
    saveRisks(updated);
  }, []);

  const persistCategories = useCallback((updated: RiskCategory[]) => {
    setCategories(updated);
    saveRiskCategories(updated);
  }, []);

  // Category lookup
  const catMap = useMemo(() => {
    const map = new Map<string, RiskCategory>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Assessment lookup: riskId → current assessment
  const assessmentMap = useMemo(() => {
    const map = new Map<string, RiskAssessment>();
    allAssessments.forEach(a => {
      if (a.isCurrent) map.set(a.riskId, a);
    });
    return map;
  }, [allAssessments]);

  // Filter
  const filtered = useMemo(() => {
    let result = [...risks];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        (r.owner?.name ?? '').toLowerCase().includes(q) ||
        (catMap.get(r.categoryId)?.name ?? '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(r => r.status === statusFilter);
    if (typeFilter) result = result.filter(r => r.riskType === typeFilter);
    return result;
  }, [risks, search, statusFilter, typeFilter, catMap]);

  // KPIs
  const kpis = useMemo(() => {
    const total = risks.length;
    const active = risks.filter(r => r.status === 'active').length;
    const draft = risks.filter(r => r.status === 'draft').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = risks.filter(r => r.status === 'active' && r.nextReviewDate && r.nextReviewDate < today).length;
    return { total, active, draft, overdue };
  }, [risks]);

  // Add / Edit
  function handleSaveRisk(data: Omit<Risk, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    const today = new Date().toISOString().split('T')[0];
    if (editRisk) {
      const updated = risks.map(r =>
        r.id === editRisk.id
          ? { ...r, ...data, updatedAt: today, updatedBy: 'Emily Carter' }
          : r
      );
      persistRisks(updated);
    } else {
      const newRisk: Risk = {
        ...data,
        id: 'RSK-' + generateId(),
        createdAt: today,
        createdBy: 'Emily Carter',
        updatedAt: today,
        updatedBy: 'Emily Carter',
      };
      persistRisks([...risks, newRisk]);
    }
    setEditRisk(null);
  }

  function handleDeleteRisk(id: string) {
    persistRisks(risks.filter(r => r.id !== id));
    setDeleteConfirmId(null);
  }

  // Grid columns
  const columns: GridColumn<Record<string, unknown>>[] = useMemo(() => [
    {
      key: 'id',
      header: 'Risk ID',
      sortable: true,
      width: '100px',
      render: (_v, row) => (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--primary)',
            cursor: 'pointer',
          }}
        >
          {String(row.id)}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      width: '240px',
      render: (_v, row) => (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: '240px',
          }}
        >
          {String(row.title)}
        </span>
      ),
    },
    {
      key: 'isEnterpriseRisk',
      header: 'Enterprise',
      sortable: false,
      width: '110px',
      render: (_v, row) => {
        if (row.isEnterpriseRisk) return <EnterpriseRiskBadge />;
        if (row.enterpriseRiskId) {
          const parent = risks.find(r => r.id === String(row.enterpriseRiskId));
          return (
            <span
              title={parent ? `Linked to: ${parent.title}` : ''}
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
              }}
            >
              ↳ {String(row.enterpriseRiskId)}
            </span>
          );
        }
        return <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px' }}>—</span>;
      },
    },
    {
      key: 'categoryId',
      header: 'Category',
      sortable: true,
      width: '160px',
      render: (_v) => <CategoryChip category={catMap.get(String(_v))} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '100px',
      render: (_v) => <RiskStatusBadge status={String(_v) as RiskStatus} />,
    },
    {
      key: 'riskType',
      header: 'Risk Type',
      sortable: true,
      width: '120px',
      render: (_v) => <RiskTypeBadge type={String(_v) as RiskType} />,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      width: '120px',
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: false,
      width: '140px',
      render: (_v) => {
        const owner = _v as any;
        if (!owner) return <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>—</span>;
        return (
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
            {owner.name}
          </span>
        );
      },
    },
    {
      key: 'appetiteLevel',
      header: 'Appetite',
      sortable: true,
      width: '90px',
      render: (_v) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', textTransform: 'capitalize' }}>
          {APPETITE_LEVEL_LABELS[String(_v) as keyof typeof APPETITE_LEVEL_LABELS] ?? String(_v)}
        </span>
      ),
    },
    {
      key: 'nextReviewDate',
      header: 'Next Review',
      sortable: true,
      width: '120px',
      render: (_v) => {
        const dateStr = String(_v ?? '');
        if (!dateStr) return <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>—</span>;
        const today = new Date().toISOString().split('T')[0];
        const overdue = dateStr < today;
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: overdue ? 'var(--destructive)' : 'var(--foreground)',
            }}
          >
            {formatDate(dateStr)}
          </span>
        );
      },
    },
    {
      key: '_riskRating',
      header: 'Rating',
      sortable: false,
      width: '100px',
      render: (_v, row) => {
        const assessment = assessmentMap.get(String(row.id));
        if (!assessment) return <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px' }}>—</span>;
        const rStyle = RISK_RATING_STYLES[assessment.riskRating];
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '20px',
              padding: '0 8px',
              borderRadius: '100px',
              background: rStyle.background,
              color: rStyle.color,
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              lineHeight: '16px',
              whiteSpace: 'nowrap',
            }}
          >
            {RISK_RATING_LABELS[assessment.riskRating]}
          </span>
        );
      },
    },
  ], [catMap, assessmentMap, risks]);

  // Grid data
  const gridData = useMemo(
    () => filtered.map(r => ({ ...r } as unknown as Record<string, unknown>)),
    [filtered]
  );

  const hasRisks = risks.length > 0;
  const hasFilters = search || statusFilter || typeFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '22px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '30px',
            }}
          >
            Risk Dashboard
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
              lineHeight: '22px',
            }}
          >
            Monitor and manage enterprise risks across the organization.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCategoryModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 16px',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
              color: 'var(--primary)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(35,34,240,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Settings2 size={14} />
            Categories
          </button>
          <button
            onClick={() => { setEditRisk(null); setFormOpen(true); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} />
            Add Risk
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      {hasRisks && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          <KPITile label="Total Risks" value={kpis.total} icon={ShieldAlert} accent />
          <KPITile label="Active" value={kpis.active} icon={ShieldCheck} iconColor="#1C8A45" subLabel="Currently monitored" />
          <KPITile label="Draft" value={kpis.draft} icon={FileText} iconColor="#E07B00" subLabel="Pending activation" />
          <KPITile
            label="Overdue Reviews"
            value={kpis.overdue}
            icon={Clock}
            iconColor={kpis.overdue > 0 ? '#C0392B' : '#6B7489'}
            subLabel={kpis.overdue > 0 ? 'Require attention' : 'All on schedule'}
          />
        </div>
      )}

      {/* Search + Filters */}
      {hasRisks && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              flex: '1',
              minWidth: '200px',
              maxWidth: '400px',
            }}
          >
            <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search risks..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                width: '100%',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                  display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RiskStatus | '')}
            style={{
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: statusFilter ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            {riskStatusOpts.map(s => (
              <option key={s} value={s}>{RISK_STATUS_LABELS[s as RiskStatus] ?? s}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as RiskType | '')}
            style={{
              height: '36px',
              padding: '0 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: typeFilter ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            <option value="">All Types</option>
            {riskTypeOpts.map(t => (
              <option key={t} value={t}>{RISK_TYPE_LABELS[t as RiskType] ?? t}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                height: '36px',
                padding: '0 12px',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--primary)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Grid or Empty State */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        {!hasRisks ? (
          <EmptyState
            icon={ShieldAlert}
            title="No risks registered"
            description="Add your first risk to begin tracking and monitoring enterprise risks across the organization."
            action={{ label: 'Add Risk', onClick: () => { setEditRisk(null); setFormOpen(true); } }}
          />
        ) : (
          <RecordGrid
            columns={columns}
            data={gridData}
            pageSize={10}
            onRowClick={row => navigate(`/risks/${String(row.id)}`)}
            emptyMessage="No risks match your filters"
            emptySubMessage="Try adjusting your search or filter criteria."
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
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
              Delete Risk
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
              Are you sure you want to delete this risk? This action cannot be undone.
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
                onClick={() => handleDeleteRisk(deleteConfirmId)}
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

      {/* Modals */}
      <RiskFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditRisk(null); }}
        onSave={handleSaveRisk}
        initialData={editRisk}
        categories={categories}
        departments={DEPARTMENTS}
        allRisks={risks}
      />

      <RiskCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onSave={persistCategories}
      />
    </div>
  );
}