import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus, Search, X, Building2, ChevronRight, ChevronDown, Edit2,
  GitBranch, List, Move as MoveIcon,
} from 'lucide-react';
import { KPITile } from '../components/shared/KPITile';
import { RecordGrid, type GridColumn } from '../components/shared/RecordGrid';
import { EmptyState } from '../components/shared/EmptyState';
import { UserChip } from '../components/shared/UserPicker';
import { DepartmentFormModal } from '../components/departments/DepartmentFormModal';
import { MoveDeptModal } from '../components/departments/MoveDeptModal';
import { OrgChart } from '../components/departments/OrgChart';
import type { Department, DeptType, DeptStatus } from '../data/departmentData';
import {
  loadDepartments, saveDepartments, getDeptRoots, getDeptChildren, updateDepartment,
} from '../data/departmentData';
import {
  loadDeptHistory, saveDeptHistory,
  recordInitialRelationship, recordMove as recordMoveHistory,
} from '../data/deptHistoryData';
import { MOCK_USERS } from '../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<DeptType, { bg: string; color: string }> = {
  Division:   { bg: '#EEF2FF', color: '#4338CA' },
  Department: { bg: '#E0F2FE', color: '#0369A1' },
  Team:       { bg: '#D1FAE5', color: '#065F46' },
  Unit:       { bg: '#F3F4F6', color: '#374151' },
};

function TypeBadge({ type }: { type: DeptType }) {
  const s = TYPE_COLORS[type];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: s.bg, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: DeptStatus }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px',
      background: status === 'Active' ? '#E8F5EE' : '#F0F2F7',
      color: status === 'Active' ? '#1C8A45' : '#6B7489',
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ─── Tree row ─────────────────────────────────────────────────────────────────

function TreeRow({
  dept, level, allDepts, expanded, onToggle, onNavigate, onEdit, onMove,
}: {
  dept: Department;
  level: number;
  allDepts: Department[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (id: string) => void;
  onEdit: (dept: Department) => void;
  onMove: (dept: Department) => void;
}) {
  const children = getDeptChildren(allDepts, dept.id);
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(dept.id);
  const lead = MOCK_USERS.find(u => u.id === dept.leadId) ?? null;

  return (
    <>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', paddingLeft: `${16 + level * 24}px`,
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
      >
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && onToggle(dept.id)}
          style={{
            width: '20px', height: '20px', flexShrink: 0, border: 'none',
            background: 'transparent', cursor: hasChildren ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: hasChildren ? 'var(--muted-foreground)' : 'transparent', padding: 0,
          }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </button>

        <TypeBadge type={dept.type} />

        {/* Name */}
        <button
          onClick={() => onNavigate(dept.id)}
          style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            textAlign: 'left', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
          }}
        >
          {dept.name}
        </button>

        {/* Code chip */}
        <code style={{
          fontFamily: 'var(--font-family-mono, monospace)', fontSize: '12px',
          color: 'var(--muted-foreground)', background: 'var(--muted)',
          padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.04em',
        }}>
          {dept.code}
        </code>

        {/* Lead */}
        <div style={{ width: '160px', flexShrink: 0 }}>
          {lead ? <UserChip user={lead} /> : (
            <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>—</span>
          )}
        </div>

        {/* Status */}
        <div style={{ width: '80px', flexShrink: 0 }}>
          <StatusBadge status={dept.status} />
        </div>

        {/* Move */}
        <button
          onClick={e => { e.stopPropagation(); onMove(dept); }}
          style={{
            width: '28px', height: '28px', border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted-foreground)', borderRadius: 'var(--radius-button)',
          }}
          title="Move"
          aria-label="Move"
        >
          <MoveIcon size={13} />
        </button>

        {/* Edit */}
        <button
          onClick={e => { e.stopPropagation(); onEdit(dept); }}
          style={{
            width: '28px', height: '28px', border: 'none', background: 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--muted-foreground)', borderRadius: 'var(--radius-button)',
          }}
          aria-label="Edit"
        >
          <Edit2 size={14} />
        </button>
      </div>

      {isExpanded && children.map(child => (
        <TreeRow
          key={child.id}
          dept={child}
          level={level + 1}
          allDepts={allDepts}
          expanded={expanded}
          onToggle={onToggle}
          onNavigate={onNavigate}
          onEdit={onEdit}
          onMove={onMove}
        />
      ))}
    </>
  );
}

// ─── View toggle ──────────────────────────────────────────────────────────────

type ViewMode = 'tree' | 'chart';

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div style={{
      display: 'flex', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-button)', overflow: 'hidden',
    }}>
      {([
        { key: 'tree',  label: 'Tree',  Icon: List      },
        { key: 'chart', label: 'Chart', Icon: GitBranch },
      ] as { key: ViewMode; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              height: '34px', padding: '0 12px', border: 'none', cursor: 'pointer',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)', fontSize: '13px',
              fontWeight: 'var(--font-weight-semibold)', transition: 'background 0.15s',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DepartmentList() {
  const navigate = useNavigate();
  const [depts, setDepts] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | DeptStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | DeptType>('All');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('tree');

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | undefined>();

  // Move modal
  const [moveTarget, setMoveTarget] = useState<Department | null>(null);

  useEffect(() => {
    const loaded = loadDepartments();
    setDepts(loaded);
    setExpanded(new Set(getDeptRoots(loaded).map(d => d.id)));
    // Ensure history is seeded so existing relationships have open spans to close
    loadDeptHistory(loaded);
  }, []);

  const isFiltered = search.trim() !== '' || statusFilter !== 'All' || typeFilter !== 'All';

  const filteredDepts = useMemo(() => {
    let list = depts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') list = list.filter(d => d.status === statusFilter);
    if (typeFilter !== 'All') list = list.filter(d => d.type === typeFilter);
    return list;
  }, [depts, search, statusFilter, typeFilter]);

  const roots = useMemo(() => getDeptRoots(depts), [depts]);

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  function persist(next: Department[]) {
    saveDepartments(next);
    setDepts(next);
  }

  function handleSave(dept: Department) {
    const isNew = !depts.find(d => d.id === dept.id);
    const old = depts.find(d => d.id === dept.id);
    const idx = depts.findIndex(d => d.id === dept.id);
    persist(idx >= 0 ? depts.map(d => d.id === dept.id ? dept : d) : [...depts, dept]);

    // History tracking — load with seedFrom so existing relationships always have an open span
    const allHistory = loadDeptHistory(depts);
    if (isNew && dept.parentId) {
      // Brand new dept with a parent → open the first span
      const parentName = depts.find(d => d.id === dept.parentId)?.name ?? '';
      saveDeptHistory(recordInitialRelationship(allHistory, dept.id, dept.parentId, parentName, dept.leadId, dept.reportingStartDate));
    } else if (!isNew && old && old.parentId !== dept.parentId) {
      // Parent changed via Edit form → close old span, open new one on the same effective date
      const newParentName = depts.find(d => d.id === dept.parentId)?.name ?? '';
      const effectiveDate = dept.reportingStartDate || new Date().toISOString().split('T')[0];
      saveDeptHistory(recordMoveHistory(allHistory, dept.id, dept.parentId, newParentName, dept.leadId, dept.reportingStartDate, effectiveDate));
    }

    setEditOpen(false);
    setEditingDept(undefined);
  }

  function handleMove(updates: { parentId: string; reportingStartDate: string; reportingEndDate: string }) {
    if (!moveTarget) return;
    // Skip if parent unchanged — no span transition needed
    if (updates.parentId === moveTarget.parentId) { setMoveTarget(null); return; }

    const updated = updateDepartment(moveTarget, updates);
    persist(depts.map(d => d.id === updated.id ? updated : d));

    // Close old span on the same date the new one opens (handles backdated moves correctly)
    const newParentName = depts.find(d => d.id === updates.parentId)?.name ?? '';
    const effectiveDate = updates.reportingStartDate || new Date().toISOString().split('T')[0];
    saveDeptHistory(recordMoveHistory(loadDeptHistory(depts), moveTarget.id, updates.parentId, newParentName, moveTarget.leadId, updates.reportingStartDate, effectiveDate));

    setMoveTarget(null);
  }

  function openEdit(dept: Department) {
    setEditingDept(dept);
    setEditOpen(true);
  }

  // KPIs
  const totalActive  = depts.filter(d => d.status === 'Active').length;
  const divisionCount = depts.filter(d => d.type === 'Division').length;
  const deptCount    = depts.filter(d => d.type !== 'Division').length;

  // Grid columns (flat / search mode)
  const columns: GridColumn<Department>[] = [
    {
      key: 'name', header: 'Name',
      render: (_v, d) => (
        <button
          onClick={() => navigate(`/departments/${d.id}`)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
          }}
        >
          {d.name}
        </button>
      ),
    },
    { key: 'code', header: 'Code', render: (_v, d) => <code style={{ fontFamily: 'monospace', fontSize: '12px' }}>{d.code}</code> },
    { key: 'type', header: 'Type', render: (_v, d) => <TypeBadge type={d.type} /> },
    {
      key: 'parentId', header: 'Parent',
      render: (_v, d) => {
        const parent = depts.find(p => p.id === d.parentId);
        return parent ? (
          <button
            onClick={() => navigate(`/departments/${parent.id}`)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--primary)',
            }}
          >
            {parent.name}
          </button>
        ) : <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>Top Level</span>;
      },
    },
    {
      key: 'leadId', header: 'Lead',
      render: (_v, d) => {
        const user = MOCK_USERS.find(u => u.id === d.leadId) ?? null;
        return user ? <UserChip user={user} /> : <span style={{ color: 'var(--muted-foreground)' }}>—</span>;
      },
    },
    { key: 'status', header: 'Status', render: (_v, d) => <StatusBadge status={d.status} /> },
    {
      key: 'actions', header: '',
      render: (_v, d) => (
        <button
          onClick={e => { e.stopPropagation(); setMoveTarget(d); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            height: '28px', padding: '0 10px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)', background: 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
          }}
        >
          <MoveIcon size={11} />
          Move
        </button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0,
          }}>
            Department Register
          </h1>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)', margin: '4px 0 0',
          }}>
            Organizational structure — divisions, departments, teams, and units
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button
            onClick={() => { setEditingDept(undefined); setEditOpen(true); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              height: '36px', padding: '0 16px',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              border: 'none', borderRadius: 'var(--radius-button)', cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={16} />
            New Department
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
        <KPITile label="Total Units"    value={depts.length} />
        <KPITile label="Active"         value={totalActive} />
        <KPITile label="Divisions"      value={divisionCount} />
        <KPITile label="Depts & Teams"  value={deptCount} />
      </div>

      {/* Org Chart view — no filters */}
      {viewMode === 'chart' && !isFiltered && (
        <OrgChart
          allDepts={depts}
          onMove={dept => setMoveTarget(dept)}
        />
      )}

      {/* Search / filter bar — shown in tree mode or when chart is active */}
      {(viewMode === 'tree' || isFiltered) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
            <Search size={14} style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--muted-foreground)', pointerEvents: 'none',
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or code…"
              style={{
                width: '100%', height: '36px', paddingLeft: '32px', paddingRight: search ? '32px' : '10px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                boxSizing: 'border-box', outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--muted-foreground)', padding: 0, display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'All' | DeptStatus)}
            style={{
              height: '36px', padding: '0 10px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)', background: 'var(--input-background)',
              color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', cursor: 'pointer',
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'All' | DeptType)}
            style={{
              height: '36px', padding: '0 10px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)', background: 'var(--input-background)',
              color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', cursor: 'pointer',
            }}
          >
            <option value="All">All Types</option>
            <option value="Division">Division</option>
            <option value="Department">Department</option>
            <option value="Team">Team</option>
            <option value="Unit">Unit</option>
          </select>
        </div>
      )}

      {/* Flat search results (both modes) */}
      {isFiltered && (
        filteredDepts.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No results found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <RecordGrid columns={columns} data={filteredDepts} />
        )
      )}

      {/* Tree view */}
      {viewMode === 'tree' && !isFiltered && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          {/* Tree header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: 'var(--muted)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ width: '20px', flexShrink: 0 }} />
            {[
              { label: 'Name', flex: 1 },
            ].map(col => (
              <span key={col.label} style={{
                flex: col.flex ?? 'none', fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {col.label}
              </span>
            ))}
            <div style={{
              width: '160px', flexShrink: 0, fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Lead</div>
            <div style={{
              width: '80px', flexShrink: 0, fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Status</div>
            <div style={{ width: '64px', flexShrink: 0 }} />
          </div>

          {roots.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <EmptyState
                icon={Building2}
                title="No departments yet"
                description="Click 'New Department' to add your first organizational unit."
              />
            </div>
          ) : (
            roots.map(root => (
              <TreeRow
                key={root.id}
                dept={root}
                level={0}
                allDepts={depts}
                expanded={expanded}
                onToggle={toggle}
                onNavigate={id => navigate(`/departments/${id}`)}
                onEdit={openEdit}
                onMove={dept => setMoveTarget(dept)}
              />
            ))
          )}
        </div>
      )}

      {/* Org chart hint when filters are active */}
      {viewMode === 'chart' && isFiltered && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-card)',
          background: 'var(--muted)', border: '1px solid var(--border)',
          fontFamily: 'var(--font-family-primary)', fontSize: '13px',
          color: 'var(--muted-foreground)',
        }}>
          Org chart shows the full hierarchy — clear search/filters to view it, or switch to Tree view to browse filtered results.
        </div>
      )}

      {/* Modals */}
      <DepartmentFormModal
        isOpen={editOpen}
        onClose={() => { setEditOpen(false); setEditingDept(undefined); }}
        onSave={handleSave}
        editingDept={editingDept}
        allDepartments={depts}
      />

      {moveTarget && (
        <MoveDeptModal
          isOpen={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          onSave={handleMove}
          dept={moveTarget}
          allDepartments={depts}
        />
      )}
    </div>
  );
}
