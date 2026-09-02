import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, X, Briefcase, CheckCircle, XCircle,
  Link2, ChevronRight, Edit2, Trash2,
} from 'lucide-react';
import { KPITile } from '../components/shared/KPITile';
import { RecordGrid, type GridColumn } from '../components/shared/RecordGrid';
import { EmptyState } from '../components/shared/EmptyState';
import { EmployerFormModal } from '../components/employers/EmployerFormModal';
import type { Employer } from '../data/employerData';
import {
  loadEmployers, saveEmployers,
  loadEmployerRelationships, saveEmployerRelationships,
  getRelationshipsForEmployer,
} from '../data/employerData';
import { formatDate } from '../data/mockData';

// ─── Status badge ─────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px',
      background: isActive ? '#E8F5EE' : '#F0F2F7',
      color:      isActive ? '#1C8A45' : '#6B7489',
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', lineHeight: '16px', whiteSpace: 'nowrap',
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  employer,
  onConfirm,
  onCancel,
}: {
  employer: Employer;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '440px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '18px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
          }}>Delete Employer</h3>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0,
          }}>
            Are you sure you want to delete <strong style={{ color: 'var(--foreground)' }}>{employer.name}</strong>?
            This will also remove all of its relationships. This action cannot be undone.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              height: '36px', padding: '0 16px', border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: '36px', padding: '0 16px', border: 'none',
              borderRadius: 'var(--radius-button)', background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
            }}
          >
            Delete Employer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EmployerList() {
  const navigate = useNavigate();

  const [employers,     setEmployers]     = useState<Employer[]>([]);
  const [relationships, setRelationships] = useState(loadEmployerRelationships());
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'all' | 'active' | 'inactive'>('all');
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [deletingId,    setDeletingId]    = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => { setEmployers(loadEmployers()); }, []);

  const persist = useCallback((updated: Employer[]) => {
    setEmployers(updated);
    saveEmployers(updated);
  }, []);

  // ─── KPI metrics ───────────────────────────────────────────────────────────
  const totalCount    = employers.length;
  const activeCount   = employers.filter(e => e.isActive).length;
  const inactiveCount = employers.filter(e => !e.isActive).length;
  const totalRels     = relationships.length;

  // ─── Filtered data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return employers.filter(e => {
      if (statusFilter === 'active'   && !e.isActive)  return false;
      if (statusFilter === 'inactive' &&  e.isActive)  return false;
      if (q) {
        return (
          e.name.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.createdBy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [employers, search, statusFilter]);

  // ─── CRUD helpers ──────────────────────────────────────────────────────────
  function handleSave(data: Omit<Employer, 'id' | 'createdAt' | 'createdBy' | 'modifiedAt' | 'modifiedBy'>) {
    const now = new Date().toISOString().split('T')[0];
    if (editingId) {
      const existing = employers.find(e => e.id === editingId)!;
      persist(employers.map(e =>
        e.id === editingId
          ? { ...e, ...data, modifiedAt: now, modifiedBy: 'Admin' }
          : e,
      ));
    } else {
      const newId = 'EMP-' + Math.random().toString(36).slice(2, 9).toUpperCase();
      const newEmployer: Employer = {
        ...data,
        id: newId,
        createdAt:  now,
        createdBy:  'Admin',
        modifiedAt: now,
        modifiedBy: 'Admin',
      };
      persist([...employers, newEmployer]);
    }
    setModalOpen(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    persist(employers.filter(e => e.id !== id));
    // Also remove relationships for this employer
    const updatedRels = relationships.filter(r => r.employerId !== id && r.relatedEmployerId !== id);
    setRelationships(updatedRels);
    saveEmployerRelationships(updatedRels);
    setDeletingId(null);
  }

  function openNew() {
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(id: string) {
    setEditingId(id);
    setModalOpen(true);
  }

  // ─── Grid columns ──────────────────────────────────────────────────────────
  const columns: GridColumn<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Employer Name',
      sortable: true,
      width: '220px',
      render: (_val, row) => {
        const e = row as unknown as Employer;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer',
              }}
              onClick={ev => { ev.stopPropagation(); navigate(`/employers/${e.id}`); }}
            >
              {e.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      width: '120px',
      render: (_val, row) => {
        const e = row as unknown as Employer;
        return (
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
          }}>
            {e.code}
          </span>
        );
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      sortable: true,
      width: '90px',
      render: (_val, row) => <ActiveBadge isActive={(row as unknown as Employer).isActive} />,
    },
    {
      key: 'relationships',
      header: 'Relationships',
      sortable: false,
      width: '110px',
      render: (_val, row) => {
        const e = row as unknown as Employer;
        const count = getRelationshipsForEmployer(e.id, relationships).length;
        return (
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: count > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
          }}>
            {count > 0 ? count : '—'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '110px',
      render: (_val, row) => {
        const e = row as unknown as Employer;
        return (
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            {formatDate(e.createdAt)}
          </span>
        );
      },
    },
    {
      key: 'modifiedAt',
      header: 'Last Modified',
      sortable: true,
      width: '120px',
      render: (_val, row) => {
        const e = row as unknown as Employer;
        return (
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            {formatDate(e.modifiedAt)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      width: '80px',
      render: (_val, row) => {
        const e = row as unknown as Employer;
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}
            onClick={ev => ev.stopPropagation()}
          >
            <button
              title="Edit"
              onClick={() => openEdit(e.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', border: 'none', borderRadius: 'var(--radius-input)',
                background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer',
              }}
              onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
            >
              <Edit2 size={14} />
            </button>
            <button
              title="Delete"
              onClick={() => setDeletingId(e.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', border: 'none', borderRadius: 'var(--radius-input)',
                background: 'transparent', color: 'var(--destructive)', cursor: 'pointer',
              }}
              onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(192,57,43,0.08)')}
              onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      },
    },
  ];

  const gridData = filtered.map(e => ({ ...e } as unknown as Record<string, unknown>));
  const editingEmployer = editingId ? employers.find(e => e.id === editingId) ?? null : null;
  const deletingEmployer = deletingId ? employers.find(e => e.id === deletingId) ?? null : null;

  const btnBase: React.CSSProperties = {
    height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '0 14px', border: 'none', borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    height: '32px', padding: '0 12px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-button)',
    background: active ? 'var(--primary)' : 'var(--card)',
    color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '22px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
            margin: 0, lineHeight: '30px',
          }}>
            Employer Register
          </h1>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0,
          }}>
            Manage employers and their inter-organisational relationships.
          </p>
        </div>
        <button
          onClick={openNew}
          style={{ ...btnBase, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} />
          Add Employer
        </button>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        <KPITile label="Total Employers"  value={totalCount}    icon={Briefcase}    accent />
        <KPITile label="Active"           value={activeCount}   icon={CheckCircle}  iconColor="#1C8A45" />
        <KPITile label="Inactive"         value={inactiveCount} icon={XCircle}      iconColor="#6B7489" />
        <KPITile label="Relationships"    value={totalRels}     icon={Link2}        iconColor="#2322F0" />
      </div>

      {/* Filter / search bar */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
        padding: '14px 20px', display: 'flex', alignItems: 'center',
        gap: '12px', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{
          flex: 1, minWidth: '200px', position: 'relative',
          display: 'flex', alignItems: 'center',
        }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search by name, code, or created by…"
            style={{
              width: '100%', height: '36px', paddingLeft: '32px', paddingRight: search ? '32px' : '10px',
              border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-input)', background: 'var(--input-background)',
              color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '8px', background: 'transparent', border: 'none',
                color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                padding: '2px',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', marginRight: '2px',
          }}>Status:</span>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} style={filterBtnStyle(statusFilter === f)} onClick={() => setStatusFilter(f)}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No employers found"
            description={search || statusFilter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Get started by adding your first employer.'}
            action={!search && statusFilter === 'all' ? { label: 'Add Employer', onClick: openNew } : undefined}
          />
        ) : (
          <RecordGrid
            columns={columns}
            data={gridData}
            pageSize={10}
            onRowClick={row => navigate(`/employers/${(row as unknown as Employer).id}`)}
          />
        )}
      </div>

      {/* Modals */}
      <EmployerFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSave={handleSave}
        initialData={editingEmployer}
        allEmployers={employers}
      />

      {deletingEmployer && (
        <DeleteConfirmDialog
          employer={deletingEmployer}
          onConfirm={() => handleDelete(deletingEmployer.id)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}