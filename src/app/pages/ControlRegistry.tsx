import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ShieldCheck, CheckCircle2,
  AlertTriangle, Clock, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { KPITile } from '../components/shared/KPITile';
import { RecordGrid, type GridColumn } from '../components/shared/RecordGrid';
import { EmptyState } from '../components/shared/EmptyState';
import { ControlFormModal } from '../components/controls/ControlFormModal';
import type { Control, ControlType, ControlStatus, ControlEffectiveness } from '../data/controlData';
import {
  loadControls, saveControls,
  CONTROL_TYPE_LABELS, CONTROL_STATUS_LABELS, CONTROL_EFFECTIVENESS_LABELS,
  CONTROL_STATUS_STYLES, CONTROL_TYPE_STYLES, CONTROL_EFFECTIVENESS_STYLES,
  CONTROL_FREQUENCY_LABELS,
} from '../data/controlData';
import type { RiskControl } from '../data/riskControlData';
import { loadRiskControls, getRiskCountForControl } from '../data/riskControlData';
import { formatDate, generateId } from '../data/mockData';

// ─── Badge helpers ───────────────────────────────────────────────────────────

function ControlStatusBadge({ status }: { status: ControlStatus }) {
  const style = CONTROL_STATUS_STYLES[status] ?? { background: '#F0F0F0', color: '#6B7489' };
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
      {CONTROL_STATUS_LABELS[status]}
    </span>
  );
}

function ControlTypeBadge({ type }: { type: ControlType }) {
  const style = CONTROL_TYPE_STYLES[type] ?? { background: '#F0F0F0', color: '#6B7489' };
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
      {CONTROL_TYPE_LABELS[type]}
    </span>
  );
}

function EffectivenessBadge({ effectiveness }: { effectiveness: ControlEffectiveness }) {
  const style = CONTROL_EFFECTIVENESS_STYLES[effectiveness] ?? { background: '#F0F0F0', color: '#6B7489' };
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
      {CONTROL_EFFECTIVENESS_LABELS[effectiveness]}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ControlRegister() {
  const navigate = useNavigate();
  const { getActiveOptions } = useApp();
  const controlStatusOpts = getActiveOptions('Control', 'Status');
  const controlTypeOpts   = getActiveOptions('Control', 'Type');

  const [controls, setControls]       = useState<Control[]>(() => loadControls());
  const [riskControls, setRiskControls] = useState<RiskControl[]>([]);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]   = useState('');
  const [addOpen, setAddOpen]         = useState(false);

  useEffect(() => {
    setControls(loadControls());
    setRiskControls(loadRiskControls());
  }, []);

  const persistControls = useCallback((updated: Control[]) => {
    setControls(updated);
    saveControls(updated);
  }, []);

  // Filter
  const filtered = useMemo(() => {
    let result = controls;
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          c.id.toLowerCase().includes(term) ||
          c.department.toLowerCase().includes(term) ||
          c.frameworkRef.toLowerCase().includes(term)
      );
    }
    if (statusFilter) result = result.filter(c => c.status === statusFilter);
    if (typeFilter) result = result.filter(c => c.controlType === typeFilter);
    return result;
  }, [controls, search, statusFilter, typeFilter]);

  // KPI metrics
  const totalActive = controls.filter(c => c.status === 'active').length;
  const totalEffective = controls.filter(c => c.effectiveness === 'effective').length;
  const totalAutomated = controls.filter(c => c.isAutomated).length;
  const today = new Date().toISOString().split('T')[0];
  const testOverdue = controls.filter(c => c.status === 'active' && c.nextTestDate && c.nextTestDate < today).length;

  function handleAdd(data: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString().split('T')[0];
    const newCtrl: Control = {
      ...data,
      id: 'CTL-' + generateId(),
      createdAt: now,
      updatedAt: now,
    };
    persistControls([newCtrl, ...controls]);
  }

  // Grid columns
  const gridColumns: GridColumn<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Control Name',
      sortable: true,
      width: '280px',
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
          {String(row.name ?? '')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      render: (_v, row) => <ControlStatusBadge status={row.status as ControlStatus} />,
    },
    {
      key: 'controlType',
      header: 'Type',
      sortable: true,
      width: '120px',
      render: (_v, row) => <ControlTypeBadge type={row.controlType as ControlType} />,
    },
    {
      key: 'effectiveness',
      header: 'Effectiveness',
      sortable: true,
      width: '140px',
      render: (_v, row) => <EffectivenessBadge effectiveness={row.effectiveness as ControlEffectiveness} />,
    },
    {
      key: 'frequency',
      header: 'Frequency',
      sortable: true,
      width: '100px',
      render: (_v, row) => (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
            textTransform: 'capitalize',
          }}
        >
          {CONTROL_FREQUENCY_LABELS[row.frequency as keyof typeof CONTROL_FREQUENCY_LABELS] ?? String(row.frequency)}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      width: '120px',
    },
    {
      key: 'isAutomated',
      header: 'Auto',
      sortable: true,
      width: '60px',
      render: (_v, row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: row.isAutomated ? '#1C8A45' : 'var(--muted-foreground)',
          }}
        >
          {row.isAutomated ? <Zap size={12} /> : null}
          {row.isAutomated ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: '_riskCount',
      header: 'Risks',
      sortable: true,
      width: '60px',
      render: (_v, row) => {
        const count = getRiskCountForControl(riskControls, String(row.id));
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: count > 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: count > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
            }}
          >
            {count}
          </span>
        );
      },
    },
    {
      key: 'frameworkRef',
      header: 'Framework',
      sortable: true,
      width: '150px',
      render: (_v, row) => (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: row.frameworkRef ? 'var(--foreground)' : 'var(--muted-foreground)',
            fontStyle: row.frameworkRef ? 'normal' : 'italic',
          }}
        >
          {String(row.frameworkRef || '—')}
        </span>
      ),
    },
  ];

  // Map controls to grid-compatible records
  const gridData = filtered.map(c => ({
    ...c,
    _riskCount: getRiskCountForControl(riskControls, c.id),
  })) as unknown as Record<string, unknown>[];

  const hasFilters = !!search || !!statusFilter || !!typeFilter;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '22px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '30px',
            }}
          >
            Control Register
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0',
            }}
          >
            Library of controls available to the organization.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
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
          Add Control
        </button>
      </div>

      {/* KPI Tiles — max 5 per guidelines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        <KPITile
          label="Active Controls"
          value={totalActive}
          icon={ShieldCheck}
          accent
          subLabel={`of ${controls.length} total`}
        />
        <KPITile
          label="Effective"
          value={totalEffective}
          icon={CheckCircle2}
          iconColor="#1C8A45"
          subLabel={totalActive > 0 ? `${Math.round((totalEffective / totalActive) * 100)}% of active` : '—'}
        />
        <KPITile
          label="Automated"
          value={totalAutomated}
          icon={Zap}
          iconColor="#00A3A3"
          subLabel={controls.length > 0 ? `${Math.round((totalAutomated / controls.length) * 100)}% of all` : '—'}
        />
        <KPITile
          label="Tests Overdue"
          value={testOverdue}
          icon={AlertTriangle}
          iconColor={testOverdue > 0 ? '#C0392B' : undefined}
          subLabel={testOverdue > 0 ? 'Action required' : 'All on schedule'}
        />
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted-foreground)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search controls..."
            style={{
              height: '36px',
              padding: '0 12px 0 32px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              color: 'var(--foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            height: '36px',
            padding: '0 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-input)',
            background: 'var(--input-background)',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            cursor: 'pointer',
            minWidth: '140px',
          }}
        >
          <option value="">All Statuses</option>
          {controlStatusOpts.map(s => (
            <option key={s} value={s}>{CONTROL_STATUS_LABELS[s as ControlStatus] ?? s}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            height: '36px',
            padding: '0 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-input)',
            background: 'var(--input-background)',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            cursor: 'pointer',
            minWidth: '140px',
          }}
        >
          <option value="">All Types</option>
          {controlTypeOpts.map(t => (
            <option key={t} value={t}>{CONTROL_TYPE_LABELS[t as ControlType] ?? t}</option>
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
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
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

      {/* Grid or Empty State */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        {controls.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No controls yet"
            description="Add your first control to start building your control library."
            action={{ label: 'Add Control', onClick: () => setAddOpen(true) }}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching controls"
            description="Try adjusting your search or filter criteria."
          />
        ) : (
          <RecordGrid
            columns={gridColumns}
            data={gridData}
            pageSize={10}
            onRowClick={row => navigate(`/controls/${String(row.id)}`)}
          />
        )}
      </div>

      {/* Add Modal */}
      <ControlFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
    </div>
  );
}