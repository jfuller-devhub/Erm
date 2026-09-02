import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle, AlertCircle, Clock, XCircle, FileText } from 'lucide-react';
import type { Regulation } from '../../data/regulationData';
import {
  loadRegulationRequirements,
  saveRegulationRequirements,
  getRequirementsForRegulation,
  createRequirement,
  deleteRequirement,
  calculateRequirementCoverage,
  type RegulationRequirement,
  type RequirementStatus,
  type RequirementType,
  REQUIREMENT_STATUS_LABELS,
  REQUIREMENT_STATUS_STYLES,
  REQUIREMENT_TYPE_LABELS,
  REQUIREMENT_TYPE_STYLES,
} from '../../data/regulationRequirementData';
import { RequirementFormModal } from './RequirementFormModal';
import { loadControls } from '../../data/controlData';

interface RegulationRequirementsTabProps {
  regulation: Regulation;
}

export function RegulationRequirementsTab({ regulation }: RegulationRequirementsTabProps) {
  const [requirements, setRequirements] = useState<RegulationRequirement[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<RegulationRequirement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequirementStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<RequirementType | 'all'>('all');

  useEffect(() => {
    const allReqs = loadRegulationRequirements();
    const regulationReqs = getRequirementsForRegulation(allReqs, regulation.id);
    setRequirements(regulationReqs);
  }, [regulation.id]);

  function handleCreate(data: Omit<RegulationRequirement, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    const allReqs = loadRegulationRequirements();
    const newReq = createRequirement(allReqs, data);
    const updated = [...allReqs, newReq];
    saveRegulationRequirements(updated);
    setRequirements(getRequirementsForRegulation(updated, regulation.id));
    setAddModalOpen(false);
  }

  function handleUpdate(data: Omit<RegulationRequirement, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    if (!editingRequirement) return;

    const allReqs = loadRegulationRequirements();
    const today = new Date().toISOString().split('T')[0];
    const updated = allReqs.map(r =>
      r.id === editingRequirement.id
        ? { ...r, ...data, updatedAt: today, updatedBy: 'Emily Carter' }
        : r
    );

    saveRegulationRequirements(updated);
    setRequirements(getRequirementsForRegulation(updated, regulation.id));
    setEditingRequirement(null);
  }

  function handleDelete(id: string) {
    const allReqs = loadRegulationRequirements();
    const updated = deleteRequirement(allReqs, id);
    saveRegulationRequirements(updated);
    setRequirements(getRequirementsForRegulation(updated, regulation.id));
    setDeleteConfirmId(null);
  }

  const filteredRequirements = requirements.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    if (typeFilter !== 'all' && req.requirementType !== typeFilter) return false;
    return true;
  });

  const coverage = calculateRequirementCoverage(loadRegulationRequirements(), regulation.id);

  const stats = {
    total: requirements.length,
    implemented: requirements.filter(r => r.status === 'implemented' || r.status === 'verified').length,
    inProgress: requirements.filter(r => r.status === 'in-analysis' || r.status === 'mapped').length,
    notStarted: requirements.filter(r => r.status === 'identified').length,
    critical: requirements.filter(r => r.requirementType === 'must').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Coverage */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Requirements & Gap Analysis
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '4px 0 0 0',
              }}
            >
              Track regulatory requirements and control mapping coverage
            </p>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Add Requirement
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          <StatCard label="Total Requirements" value={stats.total} icon={FileText} color="#1565C0" />
          <StatCard label="Implemented" value={stats.implemented} icon={CheckCircle} color="#1C8A45" />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} color="#F57F17" />
          <StatCard label="Not Started" value={stats.notStarted} icon={AlertCircle} color="#C62828" />
          <StatCard
            label="Control Coverage"
            value={`${coverage.percentage}%`}
            icon={CheckCircle}
            color="#1C8A45"
            subtitle={`${coverage.mapped} of ${coverage.total} mapped`}
          />
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Filter by:
          </span>
          
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RequirementStatus | 'all')}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              background: 'var(--input-background)',
              color: 'var(--foreground)',
            }}
          >
            <option value="all">All Statuses</option>
            {Object.entries(REQUIREMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as RequirementType | 'all')}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              background: 'var(--input-background)',
              color: 'var(--foreground)',
            }}
          >
            <option value="all">All Types</option>
            {Object.entries(REQUIREMENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {(statusFilter !== 'all' || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Requirements Table */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        {filteredRequirements.length === 0 ? (
          <div
            style={{
              padding: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <FileText size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: 0,
              }}
            >
              No requirements found
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={tableHeaderStyle}>Requirement</th>
                  <th style={tableHeaderStyle}>Type</th>
                  <th style={tableHeaderStyle}>Status</th>
                  <th style={tableHeaderStyle}>Controls</th>
                  <th style={tableHeaderStyle}>Priority</th>
                  <th style={tableHeaderStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequirements.map(req => (
                  <RequirementRow
                    key={req.id}
                    requirement={req}
                    onEdit={() => setEditingRequirement(req)}
                    onDelete={() => setDeleteConfirmId(req.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(addModalOpen || editingRequirement) && (
        <RequirementFormModal
          regulationId={regulation.id}
          initialData={editingRequirement || undefined}
          onClose={() => {
            setAddModalOpen(false);
            setEditingRequirement(null);
          }}
          onSubmit={editingRequirement ? handleUpdate : handleCreate}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
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
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              Delete Requirement?
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to delete this requirement? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
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
                  padding: '8px 16px',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
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
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        padding: '16px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-card)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '20px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: 1,
            marginBottom: '4px',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
          }}
        >
          {label}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '10px',
              color: 'var(--muted-foreground)',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Requirement Row ──────────────────────────────────────────────────────────

function RequirementRow({
  requirement,
  onEdit,
  onDelete,
}: {
  requirement: RegulationRequirement;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const statusStyle = REQUIREMENT_STATUS_STYLES[requirement.status];
  const typeStyle = REQUIREMENT_TYPE_STYLES[requirement.requirementType];
  const controls = loadControls();

  return (
    <tr
      style={{
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--muted)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <td style={tableCellStyle}>
        <div style={{ maxWidth: '300px' }}>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              marginBottom: '4px',
            }}
          >
            {requirement.requirementNumber} - {requirement.title}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {requirement.description}
          </div>
        </div>
      </td>
      <td style={tableCellStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '100px',
            fontSize: '11px',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-semibold)',
            background: typeStyle.background,
            color: typeStyle.color,
          }}
        >
          {REQUIREMENT_TYPE_LABELS[requirement.requirementType]}
        </span>
      </td>
      <td style={tableCellStyle}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '100px',
            fontSize: '11px',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-semibold)',
            background: statusStyle.background,
            color: statusStyle.color,
          }}
        >
          {REQUIREMENT_STATUS_LABELS[requirement.status]}
        </span>
      </td>
      <td style={tableCellStyle}>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
          }}
        >
          {requirement.linkedControlIds.length > 0
            ? `${requirement.linkedControlIds.length} control${requirement.linkedControlIds.length === 1 ? '' : 's'}`
            : 'None'}
        </span>
      </td>
      <td style={tableCellStyle}>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            color: 'var(--foreground)',
            textTransform: 'capitalize',
          }}
        >
          {requirement.priority}
        </span>
      </td>
      <td style={tableCellStyle}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--foreground)',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '4px 8px',
              background: 'transparent',
              border: '1px solid var(--destructive)',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--destructive)',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Table Styles ─────────────────────────────────────────────────────────────

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontFamily: 'var(--font-family-primary)',
  fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--foreground)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: 'var(--font-family-primary)',
  fontSize: 'var(--text-base)',
  color: 'var(--foreground)',
};
