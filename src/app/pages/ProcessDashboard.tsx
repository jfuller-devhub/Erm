import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, Search, X, Activity, CheckCircle, XCircle,
  Layers, Edit2, Trash2, ChevronRight, Filter,
  GitBranch, ListOrdered, FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { KPITile } from '../components/shared/KPITile';
import { RecordGrid, type GridColumn } from '../components/shared/RecordGrid';
import { EmptyState } from '../components/shared/EmptyState';
import { ProcessFormModal } from '../components/processes/ProcessFormModal';
import type { Process, ProcessStatus } from '../data/processData';
import { loadProcesses, saveProcesses } from '../data/processData';
import { formatDate } from '../data/mockData';
import { useApp } from '../context/AppContext';

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ProcessStatus, { background: string; color: string }> = {
  Active:  { background: '#E8F5EE', color: '#1C8A45' },
  Draft:   { background: '#FFF3E0', color: '#E07B00' },
  Retired: { background: '#F0F0F0', color: '#6B7489' },
};

function ProcessStatusBadge({ status }: { status: ProcessStatus }) {
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
      {status}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ProcessDashboard() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProcessStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { vendors, updateVendor } = useApp();

  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const persist = useCallback((updated: Process[]) => {
    setProcesses(updated);
    saveProcesses(updated);
  }, []);

  // ─── KPI metrics ─────────────────────────────────────────────────────────
  const totalProcesses = processes.length;
  const draftCount = processes.filter(p => p.status === 'Draft').length;
  const activeCount = processes.filter(p => p.status === 'Active').length;
  const retiredCount = processes.filter(p => p.status === 'Retired').length;
  const totalSubProcesses = processes.reduce((n, p) => n + (p.subProcesses ?? []).length, 0);
  const totalSteps = processes.reduce(
    (n, p) => n + (p.subProcesses ?? []).reduce((m, sp) => m + (sp.steps ?? []).length, 0),
    0
  );

  // ─── Filtered data ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...processes];
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          (p.owner?.name ?? '').toLowerCase().includes(q) ||
          p.businessDomain.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [processes, searchQuery, statusFilter]);

  // ─── CRUD helpers ────────────────────────────────────────────────────────
  function handleSave(process: Process) {
    const exists = processes.find(p => p.id === process.id);
    if (exists) {
      persist(processes.map(p => (p.id === process.id ? process : p)));
    } else {
      persist([...processes, process]);
    }
    setEditingProcess(null);
  }

  function handleDelete(id: string) {
    persist(processes.filter(p => p.id !== id));
    setDeleteConfirmId(null);
  }

  function openEdit(process: Process) {
    setEditingProcess(process);
    setModalOpen(true);
  }

  function openNew() {
    setEditingProcess(null);
    setModalOpen(true);
  }

  // ─── Grid columns ───────────────────────────────────────────────────────
  const columns: GridColumn<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Process Name',
      sortable: true,
      width: '240px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronRight
              size={12}
              style={{ color: 'var(--muted-foreground)', flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--primary)',
                cursor: 'pointer',
              }}
              onClick={e => {
                e.stopPropagation();
                navigate(`/processes/${proc.id}`);
              }}
            >
              {proc.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '90px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        return <ProcessStatusBadge status={proc.status} />;
      },
    },
    {
      key: 'businessDomain',
      header: 'Domain',
      sortable: true,
      width: '130px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: proc.businessDomain ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            {proc.businessDomain || '--'}
          </span>
        );
      },
    },
    {
      key: 'ownerName',
      header: 'Owner',
      sortable: true,
      width: '150px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        if (!proc.owner) return <span style={{ color: 'var(--muted-foreground)' }}>--</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '10px',
                fontWeight: 'var(--font-weight-semibold)',
                flexShrink: 0,
              }}
            >
              {proc.owner.initials}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            >
              {proc.owner.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'subCount',
      header: 'Sub-Proc',
      sortable: true,
      width: '80px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <GitBranch size={12} style={{ color: 'var(--muted-foreground)' }} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            >
              {(proc.subProcesses ?? []).length}
            </span>
          </div>
        );
      },
    },
    {
      key: 'stepCount',
      header: 'Steps',
      sortable: true,
      width: '70px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        const count = (proc.subProcesses ?? []).reduce(
          (n, sp) => n + (sp.steps ?? []).length,
          0
        );
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ListOrdered size={12} style={{ color: 'var(--muted-foreground)' }} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
              }}
            >
              {count}
            </span>
          </div>
        );
      },
    },
    {
      key: 'updatedDate',
      header: 'Last Updated',
      sortable: true,
      width: '120px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
            }}
          >
            {formatDate(proc.updatedDate)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (_val, row) => {
        const proc = row as unknown as Process;
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => openEdit(proc)}
              title="Edit"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--muted-foreground)',
                borderRadius: 'var(--radius-input)',
                transition: 'color 0.1s, background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => setDeleteConfirmId(proc.id)}
              title="Delete"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--muted-foreground)',
                borderRadius: 'var(--radius-input)',
                transition: 'color 0.1s, background 0.1s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ];

  const gridData: Record<string, unknown>[] = filtered.map(p => ({
    ...p,
    id: p.id,
    ownerName: p.owner?.name ?? '',
    subCount: (p.subProcesses ?? []).length,
    stepCount: (p.subProcesses ?? []).reduce((n, sp) => n + (sp.steps ?? []).length, 0),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
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
            Process Registry
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
            Capture and manage enterprise process structure: processes, sub-processes, and steps.
          </p>
        </div>
        <button
          onClick={openNew}
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'opacity 0.1s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          <Plus size={14} />
          New Process
        </button>
      </div>

      {/* ─── KPI Tiles (max 5 per Appian guideline) ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
        }}
      >
        <KPITile label="Total Processes" value={totalProcesses} icon={Layers} accent />
        <KPITile
          label="Active"
          value={activeCount}
          icon={CheckCircle}
          iconColor="#1C8A45"
          subLabel={`${totalProcesses > 0 ? Math.round((activeCount / totalProcesses) * 100) : 0}% of total`}
        />
        <KPITile label="Draft" value={draftCount} icon={FileText} iconColor="#E07B00" />
        <KPITile label="Sub-Processes" value={totalSubProcesses} icon={GitBranch} iconColor="#00A3A3" />
        <KPITile
          label="Steps / Activities"
          value={totalSteps}
          icon={ListOrdered}
          iconColor="#0084AA"
          subLabel={`Across ${totalSubProcesses} sub-processes`}
        />
      </div>

      {/* ─── Search & Filter Bar ───────────────────────────────────────────── */}
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
            flex: 1,
            minWidth: '200px',
            maxWidth: '400px',
            position: 'relative',
          }}
        >
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
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, domain, owner, tags..."
            style={{
              width: '100%',
              height: '36px',
              padding: '0 32px 0 32px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
              boxSizing: 'border-box',
              outline: 'none',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.outline = '2px solid rgba(35,34,240,0.2)';
              e.currentTarget.style.outlineOffset = '1px';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.outline = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--muted-foreground)',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          {(['all', 'Active', 'Draft', 'Retired'] as const).map(val => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{
                height: '28px',
                padding: '0 10px',
                border: '1px solid',
                borderColor: statusFilter === val ? 'var(--primary)' : 'var(--border)',
                borderRadius: 'var(--radius-input)',
                background: statusFilter === val ? 'var(--primary)' : 'var(--card)',
                color: statusFilter === val ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.1s',
                textTransform: 'capitalize',
              }}
            >
              {val === 'all' ? 'All' : val}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Record Grid ───────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 && processes.length > 0 ? (
          <EmptyState
            icon={Search}
            title="No matching processes"
            description="Try adjusting your search or filter criteria."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No processes yet"
            description="Create your first process to start building the enterprise process registry."
            action={{ label: 'New Process', onClick: openNew }}
          />
        ) : (
          <RecordGrid
            columns={columns}
            data={gridData}
            pageSize={10}
            onRowClick={row => {
              const proc = row as unknown as Process;
              navigate(`/processes/${proc.id}`);
            }}
          />
        )}
      </div>

      {/* ─── Modal ─────────────────────────────────────────────────────────── */}
      <ProcessFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProcess(null);
        }}
        onSave={handleSave}
        editingProcess={editingProcess}
        existingProcesses={processes}
        vendors={vendors}
        associatedVendorIds={
          editingProcess
            ? vendors
                .filter(v => (v.processAssociations ?? []).some(a => a.processId === editingProcess.id))
                .map(v => v.id)
            : []
        }
        onVendorAssociationsChange={(newVendorIds) => {
          const processId = editingProcess?.id;
          if (!processId) return;
          const oldVendorIds = vendors
            .filter(v => (v.processAssociations ?? []).some(a => a.processId === processId))
            .map(v => v.id);
          const oldSet = new Set(oldVendorIds);
          const newSet = new Set(newVendorIds);
          oldVendorIds.forEach(vid => {
            if (!newSet.has(vid)) {
              const vendor = vendors.find(v => v.id === vid);
              if (vendor) {
                updateVendor(vid, {
                  processAssociations: (vendor.processAssociations ?? []).filter(a => a.processId !== processId),
                });
              }
            }
          });
          newVendorIds.forEach(vid => {
            if (!oldSet.has(vid)) {
              const vendor = vendors.find(v => v.id === vid);
              if (vendor) {
                updateVendor(vid, {
                  processAssociations: [...(vendor.processAssociations ?? []), { processId }],
                });
              }
            }
          });
        }}
      />

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          processName={processes.find(p => p.id === deleteConfirmId)?.name ?? ''}
          subProcessCount={
            (processes.find(p => p.id === deleteConfirmId)?.subProcesses ?? []).length
          }
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

function DeleteConfirmDialog({
  processName,
  subProcessCount,
  onConfirm,
  onCancel,
}: {
  processName: string;
  subProcessCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.4)',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: '420px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: 0,
          }}
        >
          Delete Process
        </h3>
        <p
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--muted-foreground)',
            margin: 0,
            lineHeight: '22px',
          }}
        >
          Are you sure you want to delete &quot;<strong style={{ color: 'var(--foreground)' }}>{processName}</strong>&quot;
          {subProcessCount > 0 && (
            <> and its {subProcessCount} sub-process{subProcessCount !== 1 ? 'es' : ''} (including all steps)</>
          )}
          ? This action cannot be undone.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              height: '36px',
              padding: '0 16px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
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
            onClick={onConfirm}
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
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.opacity = '1';
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}