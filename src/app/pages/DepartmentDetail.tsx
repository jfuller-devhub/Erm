import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Building2, Edit2, Trash2, ChevronRight, Move as MoveIcon,
  Clock, Plus, X, Package, GitBranch, Search,
} from 'lucide-react';
import type { Product } from '../data/productData';
import { loadProducts, saveProducts } from '../data/productData';
import type { Process } from '../data/processData';
import { loadProcesses, saveProcesses } from '../data/processData';
import { UserChip } from '../components/shared/UserPicker';
import { EmptyState } from '../components/shared/EmptyState';
import { DepartmentFormModal } from '../components/departments/DepartmentFormModal';
import { MoveDeptModal } from '../components/departments/MoveDeptModal';
import type { Department, DeptType } from '../data/departmentData';
import {
  loadDepartments, saveDepartments, getDeptChildren, getDeptDescendants, updateDepartment,
} from '../data/departmentData';
import type { DeptHistoryEntry } from '../data/deptHistoryData';
import {
  loadDeptHistory, saveDeptHistory, getDeptHistory,
  recordInitialRelationship, recordMove as recordMoveHistory,
  addReportingEntry, updateReportingEntry, deleteReportingEntry,
  formatPeriodDuration,
} from '../data/deptHistoryData';
import { MOCK_USERS, formatDate } from '../data/mockData';

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
      display: 'inline-flex', alignItems: 'center', height: '22px', padding: '0 10px',
      borderRadius: '100px', background: s.bg, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: 'Active' | 'Inactive' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '22px', padding: '0 10px',
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

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'Overview' | 'Structure' | 'History' | 'Products' | 'Processes';

function TabBar({
  active, onChange, structureCount, historyCount, productsCount, processesCount,
}: {
  active: Tab; onChange: (t: Tab) => void; structureCount: number; historyCount: number;
  productsCount: number; processesCount: number;
}) {
  const counts: Record<Tab, number | undefined> = {
    Overview: undefined,
    Structure: structureCount,
    History: historyCount,
    Products: productsCount,
    Processes: processesCount,
  };
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      {(['Overview', 'Structure', 'History', 'Products', 'Processes'] as Tab[]).map(tab => {
        const isActive = tab === active;
        const badge = counts[tab];
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              height: '40px', padding: '0 16px', border: 'none',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              marginBottom: '-1px',
            }}
          >
            {tab}
            {badge !== undefined && badge > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '100px',
                background: isActive ? 'var(--primary)' : 'var(--muted)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
              }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteDialog({
  dept, onConfirm, onCancel,
}: {
  dept: Department; onConfirm: () => void; onCancel: () => void;
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
          }}>Delete Department</h3>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)', margin: 0,
          }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: 'var(--foreground)' }}>{dept.name}</strong>?
            {' '}Any sub-units will become top-level. This action cannot be undone.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              height: '36px', padding: '0 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)', background: 'transparent',
              color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: '36px', padding: '0 16px', border: 'none',
              borderRadius: 'var(--radius-button)', background: 'var(--destructive)',
              color: '#fff', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reporting Relationship Modal ─────────────────────────────────────────────

function ReportingRelationshipModal({
  deptId,
  allDepts,
  entry,
  isChangingParent,
  onSave,
  onClose,
}: {
  deptId: string;
  allDepts: Department[];
  entry: DeptHistoryEntry | null;
  isChangingParent?: boolean;
  onSave: (data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) => void;
  onClose: () => void;
}) {
  const isEdit = entry !== null;
  const title = isEdit ? 'Edit Reporting Relationship' : isChangingParent ? 'Change Parent' : 'Add Reporting Relationship';
  const saveLabel = isEdit ? 'Save Changes' : isChangingParent ? 'Change Parent' : 'Add Relationship';
  const [parentId, setParentId] = useState(entry?.parentId ?? '');
  const [periodStart, setPeriodStart] = useState(entry?.periodStart ?? '');
  const [periodEnd, setPeriodEnd] = useState(entry?.periodEnd ?? '');

  const excluded = new Set([deptId, ...getDeptDescendants(allDepts, deptId)]);
  const options = allDepts.filter(d => !excluded.has(d.id));

  const canSave = parentId !== '' && periodStart !== '';

  function handleSave() {
    if (!canSave) return;
    const parentName = allDepts.find(d => d.id === parentId)?.name ?? '';
    onSave({ parentId, parentName, periodStart, periodEnd });
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: '36px', padding: '0 10px',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
    background: 'var(--input-background)', color: 'var(--foreground)',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'rgba(0,0,0,0.4)',
    }}>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
        width: '100%', maxWidth: '480px',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '16px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', border: 'none', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted-foreground)', borderRadius: 'var(--radius-button)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isChangingParent && (
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--radius)',
              background: '#FFF7ED', border: '1px solid #FED7AA',
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: '#92400E', lineHeight: '1.5',
            }}>
              The current active relationship will be closed on the Start Date you enter below.
            </div>
          )}
          {/* Reports To */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Reports To (Parent) *</label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select a parent unit…</option>
              {options.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.type})
                </option>
              ))}
            </select>
          </div>

          {/* Dates row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Start Date *</label>
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                style={inputStyle}
              />
              {!periodEnd && (
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  color: '#1C8A45', fontWeight: 'var(--font-weight-semibold)',
                }}>
                  Ongoing (blank = no end date)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '8px',
          padding: '16px 24px', borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            style={{
              height: '36px', padding: '0 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)', background: 'transparent',
              color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              height: '36px', padding: '0 16px', border: 'none',
              borderRadius: 'var(--radius-button)',
              background: canSave ? 'var(--primary)' : 'var(--muted)',
              color: canSave ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
              cursor: canSave ? 'pointer' : 'default',
            }}
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reporting Relationships Table ────────────────────────────────────────────

function ReportingRelationshipsTable({
  dept, allDepts, history, onAdd, onUpdate, onDelete,
}: {
  dept: Department;
  allDepts: Department[];
  history: DeptHistoryEntry[];
  onAdd: (data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) => void;
  onUpdate: (id: string, data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<DeptHistoryEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sorted = [...history].sort((a, b) => {
    if (!a.periodEnd && b.periodEnd) return -1;
    if (a.periodEnd && !b.periodEnd) return 1;
    return b.periodStart.localeCompare(a.periodStart);
  });

  const hasActiveEntry = sorted.some(e => !e.periodEnd);

  function openAdd() { setEditEntry(null); setModalOpen(true); }
  function openEdit(e: DeptHistoryEntry) { setEditEntry(e); setModalOpen(true); }
  function openTerminate(e: DeptHistoryEntry) {
    const today = new Date().toISOString().split('T')[0];
    setEditEntry({ ...e, periodEnd: e.periodEnd || today });
    setModalOpen(true);
  }

  const thStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-primary)', fontSize: '11px',
    fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
    textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 12px',
    background: 'var(--muted)', whiteSpace: 'nowrap',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px', fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)', color: 'var(--foreground)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', padding: '20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
    }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '14px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
          textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
        }}>
          Reporting Relationships
        </h3>
        <button
          onClick={openAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            height: '30px', padding: '0 12px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
            background: 'transparent', cursor: 'pointer',
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
          }}
        >
          <Plus size={12} />
          {hasActiveEntry ? 'Change Parent' : 'Add Relationship'}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div style={{
          padding: '20px', textAlign: 'center', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius)', background: 'var(--muted)',
        }}>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)', margin: 0, fontStyle: 'italic',
          }}>
            No reporting relationships recorded. Click "Add Relationship" to add one.
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '38%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>Reports To (Parent)</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Start Date</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>End Date</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry, i) => {
                const parent = allDepts.find(d => d.id === entry.parentId);
                const isActive = !entry.periodEnd;
                const isDeleteConfirm = deleteConfirmId === entry.id;

                return (
                  <tr
                    key={entry.id}
                    style={{
                      borderTop: i > 0 ? '1px solid var(--border)' : undefined,
                      background: isActive
                        ? 'color-mix(in srgb, var(--primary) 3%, var(--card))'
                        : 'var(--card)',
                    }}
                  >
                    {/* Reports To */}
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Building2 size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                        <span style={{ fontWeight: 'var(--font-weight-semibold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {entry.parentName || 'Top Level'}
                        </span>
                        {parent && <TypeBadge type={parent.type} />}
                      </div>
                    </td>

                    {/* Start Date */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: '13px' }}>{formatDate(entry.periodStart)}</span>
                    </td>

                    {/* End Date */}
                    <td style={tdStyle}>
                      {entry.periodEnd ? (
                        <span style={{ fontSize: '13px' }}>{formatDate(entry.periodEnd)}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#1C8A45', fontWeight: 'var(--font-weight-semibold)' }}>
                          Ongoing
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={tdStyle}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
                        borderRadius: '100px', fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
                        background: isActive ? '#E8F5EE' : '#F0F2F7',
                        color: isActive ? '#1C8A45' : '#6B7489',
                        fontFamily: 'var(--font-family-primary)',
                      }}>
                        {isActive ? 'Active' : 'Ended'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ ...tdStyle, padding: '10px 8px' }}>
                      {isDeleteConfirm ? (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => { onDelete(entry.id); setDeleteConfirmId(null); }}
                            style={{
                              height: '26px', padding: '0 8px', border: 'none',
                              borderRadius: 'var(--radius-button)', cursor: 'pointer',
                              background: 'var(--destructive)', color: '#fff',
                              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                              fontWeight: 'var(--font-weight-semibold)',
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                              height: '26px', padding: '0 8px',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-button)', cursor: 'pointer',
                              background: 'transparent', color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                              fontWeight: 'var(--font-weight-semibold)',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEdit(entry)}
                            style={{
                              height: '26px', padding: '0 8px',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-button)', cursor: 'pointer',
                              background: 'transparent', color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                              fontWeight: 'var(--font-weight-semibold)',
                            }}
                          >
                            Edit
                          </button>
                          {isActive && (
                            <button
                              onClick={() => openTerminate(entry)}
                              style={{
                                height: '26px', padding: '0 8px',
                                border: '1px solid #FCA5A5',
                                borderRadius: 'var(--radius-button)', cursor: 'pointer',
                                background: '#FEF2F2', color: '#DC2626',
                                fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                                fontWeight: 'var(--font-weight-semibold)',
                              }}
                            >
                              Terminate
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmId(entry.id)}
                            style={{
                              width: '26px', height: '26px', padding: 0,
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-button)', cursor: 'pointer',
                              background: 'transparent', color: 'var(--muted-foreground)',
                              fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ReportingRelationshipModal
          deptId={dept.id}
          allDepts={allDepts}
          entry={editEntry}
          isChangingParent={!editEntry && hasActiveEntry}
          onSave={data => {
            if (editEntry) {
              onUpdate(editEntry.id, data);
            } else {
              onAdd(data);
            }
            setModalOpen(false);
            setEditEntry(null);
          }}
          onClose={() => { setModalOpen(false); setEditEntry(null); }}
        />
      )}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  dept, allDepts, history, onAddRelationship, onUpdateRelationship, onDeleteRelationship,
}: {
  dept: Department;
  allDepts: Department[];
  history: DeptHistoryEntry[];
  onAddRelationship: (data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) => void;
  onUpdateRelationship: (id: string, data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) => void;
  onDeleteRelationship: (id: string) => void;
}) {
  const lead = MOCK_USERS.find(u => u.id === dept.leadId) ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Description */}
      {dept.description ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: '20px',
        }}>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--foreground)', margin: 0, lineHeight: '1.6',
          }}>
            {dept.description}
          </p>
        </div>
      ) : (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: '20px',
        }}>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            color: 'var(--muted-foreground)', margin: 0, fontStyle: 'italic',
          }}>
            No description provided.
          </p>
        </div>
      )}

      {/* Metadata grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
      }}>
        {[
          { label: 'Type', value: <TypeBadge type={dept.type} /> },
          { label: 'Code', value: <code style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--muted)', padding: '2px 8px', borderRadius: '4px' }}>{dept.code}</code> },
          { label: 'Status', value: <StatusBadge status={dept.status} /> },
          { label: 'Lead', value: lead ? <UserChip user={lead} /> : <span style={{ color: 'var(--muted-foreground)' }}>Unassigned</span> },
          { label: 'Created', value: <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--foreground)' }}>{formatDate(dept.createdDate)}</span> },
          { label: 'Last Updated', value: <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--foreground)' }}>{formatDate(dept.updatedDate)}</span> },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {label}
            </span>
            {value}
          </div>
        ))}
      </div>

      {/* Reporting Relationships table */}
      <ReportingRelationshipsTable
        dept={dept}
        allDepts={allDepts}
        history={history}
        onAdd={onAddRelationship}
        onUpdate={onUpdateRelationship}
        onDelete={onDeleteRelationship}
      />
    </div>
  );
}

// ─── Structure tab ────────────────────────────────────────────────────────────

function StructureTab({
  dept, allDepts, onNavigate, onNewChild,
}: {
  dept: Department;
  allDepts: Department[];
  onNavigate: (id: string) => void;
  onNewChild: () => void;
}) {
  const parent = allDepts.find(d => d.id === dept.parentId);
  const children = getDeptChildren(allDepts, dept.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Parent section */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '14px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
          textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
        }}>
          Reports To
        </h3>
        {parent ? (
          <DeptCard dept={parent} onNavigate={onNavigate} />
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px', borderRadius: 'var(--radius-input)',
            background: 'var(--muted)',
          }}>
            <Building2 size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)', fontStyle: 'italic',
            }}>
              Organization root — no parent unit
            </span>
          </div>
        )}
      </div>

      {/* Direct reports section */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '14px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
          }}>
            Direct Reports ({children.length})
          </h3>
        </div>

        {children.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No direct reports"
            description="Sub-units that report to this department will appear here. Use 'New Department' and set this as the parent."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {children.map(child => (
              <DeptCard key={child.id} dept={child} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeptCard({ dept, onNavigate }: { dept: Department; onNavigate: (id: string) => void }) {
  const lead = MOCK_USERS.find(u => u.id === dept.leadId) ?? null;
  return (
    <button
      onClick={() => onNavigate(dept.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)', background: 'var(--background)',
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--background)';
      }}
    >
      <Building2 size={16} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
        }}>
          {dept.name}
        </span>
        <span style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '12px',
          color: 'var(--muted-foreground)',
        }}>
          {dept.id}
        </span>
      </div>
      <TypeBadge type={dept.type} />
      {lead && <UserChip user={lead} />}
      <StatusBadge status={dept.status} />
      <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
    </button>
  );
}

// ─── History tab ─────────────────────────────────────────────────────────────

function HistoryTab({ history, allDepts }: { history: DeptHistoryEntry[]; allDepts: Department[] }) {
  if (history.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No history recorded"
        description="Reporting relationship history will appear here when this department is moved or reparented."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {history.map((entry, i) => {
        const isCurrent = entry.periodEnd === '';
        const lead = MOCK_USERS.find(u => u.id === entry.leadId) ?? null;
        const parent = allDepts.find(d => d.id === entry.parentId);
        const duration = formatPeriodDuration(entry.periodStart, entry.periodEnd);
        const isLast = i === history.length - 1;

        return (
          <div key={entry.id} style={{ display: 'flex', gap: '0', position: 'relative' }}>
            {/* Timeline spine */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              width: '32px', flexShrink: 0, paddingTop: '4px',
            }}>
              <div style={{
                width: isCurrent ? '12px' : '10px',
                height: isCurrent ? '12px' : '10px',
                borderRadius: '50%',
                background: isCurrent ? 'var(--primary)' : 'var(--border)',
                border: isCurrent ? '2px solid var(--primary)' : '2px solid var(--border)',
                flexShrink: 0, zIndex: 1,
                boxShadow: isCurrent ? '0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent)' : 'none',
              }} />
              {!isLast && (
                <div style={{
                  width: '2px', flex: 1, minHeight: '16px',
                  background: 'var(--border)', marginTop: '4px',
                }} />
              )}
            </div>

            {/* Entry card */}
            <div style={{
              flex: 1, marginBottom: isLast ? 0 : '12px',
              background: isCurrent ? 'color-mix(in srgb, var(--primary) 4%, var(--card))' : 'var(--card)',
              border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-card)', padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {isCurrent && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 7px',
                    borderRadius: '100px', background: 'var(--primary)',
                    color: 'var(--primary-foreground)', fontSize: '10px',
                    fontWeight: 'var(--font-weight-semibold)', letterSpacing: '0.04em',
                    fontFamily: 'var(--font-family-primary)', textTransform: 'uppercase',
                  }}>
                    Current
                  </span>
                )}
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: isCurrent ? 'var(--primary)' : 'var(--muted-foreground)',
                }}>
                  {formatDate(entry.periodStart)}
                  {entry.periodEnd && ` → ${formatDate(entry.periodEnd)}`}
                  {!entry.periodEnd && ' → Present'}
                </span>
                {duration && (
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    background: 'var(--muted)', padding: '1px 8px', borderRadius: '100px',
                  }}>
                    {duration}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                  color: 'var(--muted-foreground)',
                }}>
                  Reported to
                </span>
                {parent ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                  }}>
                    <Building2 size={13} style={{ color: 'var(--muted-foreground)' }} />
                    {entry.parentName}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', height: '17px', padding: '0 6px',
                      borderRadius: '100px', background: '#EEF2FF', color: '#4338CA',
                      fontSize: '10px', fontWeight: 'var(--font-weight-semibold)',
                    }}>
                      {parent.type}
                    </span>
                  </span>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                  }}>
                    <Building2 size={13} style={{ color: 'var(--muted-foreground)' }} />
                    {entry.parentName || 'Top Level'}
                    {!entry.parentId && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', height: '17px', padding: '0 6px',
                        borderRadius: '100px', background: 'var(--muted)', color: 'var(--muted-foreground)',
                        fontSize: '10px', fontWeight: 'var(--font-weight-semibold)',
                      }}>
                        Root
                      </span>
                    )}
                  </span>
                )}
              </div>

              {lead && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    Lead
                  </span>
                  <UserChip user={lead} size="sm" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Products tab ────────────────────────────────────────────────────────────

const PRODUCT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active:  { bg: '#E8F5EE', color: '#1C8A45' },
  Draft:   { bg: '#EEF2FF', color: '#4338CA' },
  Retired: { bg: '#F0F2F7', color: '#6B7489' },
  Sunset:  { bg: '#FFF7ED', color: '#92400E' },
};

function DeptProductsTab({
  deptId, products, onProductsChange, navigate,
}: {
  deptId: string;
  products: Product[];
  onProductsChange: (updated: Product[]) => void;
  navigate: (path: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);

  const linked = products.filter(p => (p.departmentIds ?? []).includes(deptId));
  const available = products.filter(p => !(p.departmentIds ?? []).includes(deptId) && p.name.toLowerCase().includes(search.toLowerCase()));

  function handleLink(productId: string) {
    const updated = products.map(p =>
      p.id === productId ? { ...p, departmentIds: [...(p.departmentIds ?? []), deptId] } : p
    );
    saveProducts(updated);
    onProductsChange(updated);
  }

  function handleUnlink(productId: string) {
    const updated = products.map(p =>
      p.id === productId ? { ...p, departmentIds: (p.departmentIds ?? []).filter(id => id !== deptId) } : p
    );
    saveProducts(updated);
    onProductsChange(updated);
    setUnlinkConfirm(null);
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    height: '32px', padding: '0 12px', border: 'none',
    borderRadius: 'var(--radius-button)', background: 'var(--primary)',
    color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Products & Plans</span>
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '100px', padding: '1px 8px', lineHeight: '18px' }}>
            {linked.length}
          </span>
        </div>
        <button style={btnPrimary} onClick={() => { setShowPicker(o => !o); setSearch(''); }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
          <Plus size={14} /> Link Product
        </button>
      </div>

      {/* Picker */}
      {showPicker && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select a Product or Plan
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{ width: '100%', height: '34px', padding: '0 10px 0 30px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', maxHeight: '220px', overflowY: 'auto' }}>
            {available.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                {search ? 'No matches found.' : 'All products are already linked.'}
              </div>
            ) : available.map((product, i) => {
              const ss = PRODUCT_STATUS_STYLES[product.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
              return (
                <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: i < available.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <Package size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{product.name}</span>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', flexShrink: 0 }}>{product.type}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px', borderRadius: '100px', background: ss.bg, color: ss.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>{product.status}</span>
                  <button type="button" onClick={() => handleLink(product.id)}
                    style={{ height: '26px', padding: '0 10px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <Plus size={10} /> Add
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowPicker(false)}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Linked list */}
      {linked.length === 0 && !showPicker ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Package size={40} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No products linked</div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Associate this department with a product or plan.</div>
          <button style={{ ...btnPrimary, marginTop: '8px' }} onClick={() => setShowPicker(true)}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
            <Plus size={14} /> Link Product
          </button>
        </div>
      ) : linked.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {linked.map((product, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === linked.length - 1;
            const radius = isFirst && isLast ? 'var(--radius-card)' : isFirst ? 'var(--radius-card) var(--radius-card) 0 0' : isLast ? '0 0 var(--radius-card) var(--radius-card)' : '0';
            const ss = PRODUCT_STATUS_STYLES[product.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
            const isUnlinkConfirm = unlinkConfirm === product.id;
            return (
              <div key={product.id}
                style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: isLast ? '1px solid var(--border)' : 'none', borderRadius: radius, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <Package size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <button type="button" onClick={() => navigate(`/products/${product.id}`)}
                  style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)' }}>
                  {product.name}
                </button>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', flexShrink: 0 }}>{product.type}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: ss.bg, color: ss.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>{product.status}</span>
                {isUnlinkConfirm ? (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => handleUnlink(product.id)}
                      style={{ height: '26px', padding: '0 10px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: '#fff', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
                      Confirm
                    </button>
                    <button type="button" onClick={() => setUnlinkConfirm(null)}
                      style={{ height: '26px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setUnlinkConfirm(product.id)}
                    style={{ height: '26px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0 }}>
                    Unlink
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ─── Processes tab ────────────────────────────────────────────────────────────

const PROCESS_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Active:  { bg: '#E8F5EE', color: '#1C8A45' },
  Draft:   { bg: '#EEF2FF', color: '#4338CA' },
  Retired: { bg: '#F0F2F7', color: '#6B7489' },
};

function DeptProcessesTab({
  deptId, processes, onProcessesChange, navigate,
}: {
  deptId: string;
  processes: Process[];
  onProcessesChange: (updated: Process[]) => void;
  navigate: (path: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);

  const linked = processes.filter(p => (p.departmentIds ?? []).includes(deptId));
  const available = processes.filter(p => !(p.departmentIds ?? []).includes(deptId) && p.name.toLowerCase().includes(search.toLowerCase()));

  function handleLink(processId: string) {
    const updated = processes.map(p =>
      p.id === processId ? { ...p, departmentIds: [...(p.departmentIds ?? []), deptId] } : p
    );
    saveProcesses(updated);
    onProcessesChange(updated);
  }

  function handleUnlink(processId: string) {
    const updated = processes.map(p =>
      p.id === processId ? { ...p, departmentIds: (p.departmentIds ?? []).filter(id => id !== deptId) } : p
    );
    saveProcesses(updated);
    onProcessesChange(updated);
    setUnlinkConfirm(null);
  }

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    height: '32px', padding: '0 12px', border: 'none',
    borderRadius: 'var(--radius-button)', background: 'var(--primary)',
    color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Processes</span>
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '100px', padding: '1px 8px', lineHeight: '18px' }}>
            {linked.length}
          </span>
        </div>
        <button style={btnPrimary} onClick={() => { setShowPicker(o => !o); setSearch(''); }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
          <Plus size={14} /> Link Process
        </button>
      </div>

      {/* Picker */}
      {showPicker && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select a Process
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search processes…"
              style={{ width: '100%', height: '34px', padding: '0 10px 0 30px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', maxHeight: '220px', overflowY: 'auto' }}>
            {available.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                {search ? 'No matches found.' : 'All processes are already linked.'}
              </div>
            ) : available.map((process, i) => {
              const ss = PROCESS_STATUS_STYLES[process.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
              return (
                <div key={process.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderBottom: i < available.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <GitBranch size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{process.name}</span>
                  {process.businessDomain && <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', flexShrink: 0 }}>{process.businessDomain}</span>}
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px', borderRadius: '100px', background: ss.bg, color: ss.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>{process.status}</span>
                  <button type="button" onClick={() => handleLink(process.id)}
                    style={{ height: '26px', padding: '0 10px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <Plus size={10} /> Add
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowPicker(false)}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Linked list */}
      {linked.length === 0 && !showPicker ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={40} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No processes linked</div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Associate this department with a process.</div>
          <button style={{ ...btnPrimary, marginTop: '8px' }} onClick={() => setShowPicker(true)}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
            <Plus size={14} /> Link Process
          </button>
        </div>
      ) : linked.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {linked.map((process, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === linked.length - 1;
            const radius = isFirst && isLast ? 'var(--radius-card)' : isFirst ? 'var(--radius-card) var(--radius-card) 0 0' : isLast ? '0 0 var(--radius-card) var(--radius-card)' : '0';
            const ss = PROCESS_STATUS_STYLES[process.status] ?? { bg: '#F0F2F7', color: '#6B7489' };
            const isUnlinkConfirm = unlinkConfirm === process.id;
            return (
              <div key={process.id}
                style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: isLast ? '1px solid var(--border)' : 'none', borderRadius: radius, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <GitBranch size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <button type="button" onClick={() => navigate(`/processes/${process.id}`)}
                  style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)' }}>
                  {process.name}
                </button>
                {process.businessDomain && <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', flexShrink: 0 }}>{process.businessDomain}</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: ss.bg, color: ss.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>{process.status}</span>
                {isUnlinkConfirm ? (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button type="button" onClick={() => handleUnlink(process.id)}
                      style={{ height: '26px', padding: '0 10px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: '#fff', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
                      Confirm
                    </button>
                    <button type="button" onClick={() => setUnlinkConfirm(null)}
                      style={{ height: '26px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setUnlinkConfirm(process.id)}
                    style={{ height: '26px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0 }}>
                    Unlink
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function DepartmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [allDepts, setAllDepts] = useState<Department[]>([]);
  const [dept, setDept] = useState<Department | null>(null);
  const [history, setHistory] = useState<DeptHistoryEntry[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    const loaded = loadDepartments();
    setAllDepts(loaded);
    const found = loaded.find(d => d.id === id);
    setDept(found ?? null);
    const allHistory = loadDeptHistory(loaded);
    setHistory(id ? getDeptHistory(allHistory, id) : []);
    setAllProducts(loadProducts());
    setAllProcesses(loadProcesses());
  }, [id]);

  function persistHistory(next: DeptHistoryEntry[]) {
    saveDeptHistory(next);
    setHistory(id ? getDeptHistory(next, id) : []);
  }

  // Sync dept.parentId to the most recently started active history entry for this dept
  function syncDeptParentFromHistory(allHistory: DeptHistoryEntry[], currentDept: Department) {
    const deptEntries = allHistory.filter(e => e.deptId === currentDept.id);
    const activeEntries = deptEntries
      .filter(e => !e.periodEnd)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    const primary = activeEntries[0] ?? null;
    const newParentId = primary?.parentId ?? '';
    const newStartDate = primary?.periodStart ?? '';

    const updated = updateDepartment(currentDept, {
      parentId: newParentId,
      reportingStartDate: newStartDate,
      reportingEndDate: '',
    });
    setAllDepts(prev => {
      const next = prev.map(d => d.id === updated.id ? updated : d);
      saveDepartments(next);
      return next;
    });
    setDept(updated);
    return updated;
  }

  function handleAddRelationship(data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) {
    if (!dept) return;
    const allHistory = loadDeptHistory(allDepts);
    // Close any currently open entry — only one active relationship at a time
    const closeDate = data.periodStart || new Date().toISOString().split('T')[0];
    const closed = allHistory.map(e =>
      e.deptId === dept.id && e.periodEnd === '' ? { ...e, periodEnd: closeDate } : e
    );
    const next = addReportingEntry(closed, {
      deptId: dept.id,
      parentId: data.parentId,
      parentName: data.parentName,
      leadId: dept.leadId,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    });
    saveDeptHistory(next);
    persistHistory(next);
    syncDeptParentFromHistory(next, dept);
  }

  function handleUpdateRelationship(entryId: string, data: { parentId: string; parentName: string; periodStart: string; periodEnd: string }) {
    if (!dept) return;
    const allHistory = loadDeptHistory(allDepts);
    const next = updateReportingEntry(allHistory, entryId, {
      parentId: data.parentId,
      parentName: data.parentName,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    });
    saveDeptHistory(next);
    persistHistory(next);
    syncDeptParentFromHistory(next, dept);
  }

  function handleDeleteRelationship(entryId: string) {
    if (!dept) return;
    const allHistory = loadDeptHistory(allDepts);
    const next = deleteReportingEntry(allHistory, entryId);
    saveDeptHistory(next);
    persistHistory(next);
    syncDeptParentFromHistory(next, dept);
  }

  function handleSave(updated: Department) {
    const isNew = !allDepts.find(d => d.id === updated.id);
    const old = allDepts.find(d => d.id === updated.id);

    setAllDepts(prev => {
      const idx = prev.findIndex(d => d.id === updated.id);
      const next = idx >= 0
        ? prev.map(d => d.id === updated.id ? updated : d)
        : [...prev, updated];
      saveDepartments(next);
      return next;
    });
    setDept(updated);

    const all = loadDeptHistory(allDepts);
    if (isNew && updated.parentId) {
      const parentName = allDepts.find(d => d.id === updated.parentId)?.name ?? '';
      persistHistory(recordInitialRelationship(all, updated.id, updated.parentId, parentName, updated.leadId, updated.reportingStartDate));
    } else if (!isNew && old && old.parentId !== updated.parentId) {
      const newParentName = allDepts.find(d => d.id === updated.parentId)?.name ?? '';
      const effectiveDate = updated.reportingStartDate || new Date().toISOString().split('T')[0];
      persistHistory(recordMoveHistory(all, updated.id, updated.parentId, newParentName, updated.leadId, updated.reportingStartDate, effectiveDate));
    }

    setEditOpen(false);
  }

  function handleMove(updates: { parentId: string; reportingStartDate: string; reportingEndDate: string }) {
    if (!dept) return;
    if (updates.parentId === dept.parentId) { setMoveOpen(false); return; }

    const updated = updateDepartment(dept, updates);
    setAllDepts(prev => {
      const next = prev.map(d => d.id === updated.id ? updated : d);
      saveDepartments(next);
      return next;
    });
    setDept(updated);

    const newParentName = allDepts.find(d => d.id === updates.parentId)?.name ?? '';
    const effectiveDate = updates.reportingStartDate || new Date().toISOString().split('T')[0];
    persistHistory(recordMoveHistory(loadDeptHistory(allDepts), dept.id, updates.parentId, newParentName, dept.leadId, updates.reportingStartDate, effectiveDate));

    setMoveOpen(false);
  }

  function handleDelete() {
    if (!dept) return;
    setAllDepts(prev => {
      const next = prev.filter(d => d.id !== dept.id);
      saveDepartments(next);
      return next;
    });
    navigate('/departments');
  }

  if (!dept) {
    return (
      <div style={{ padding: '24px' }}>
        <EmptyState icon={Building2} title="Department not found" description="This record may have been deleted." />
      </div>
    );
  }

  const lead = MOCK_USERS.find(u => u.id === dept.leadId) ?? null;
  const parent = allDepts.find(d => d.id === dept.parentId);
  const children = getDeptChildren(allDepts, dept.id);
  const structureCount = children.length + (parent ? 1 : 0);
  const linkedProducts = allProducts.filter(p => (p.departmentIds ?? []).includes(dept.id));
  const linkedProcesses = allProcesses.filter(p => (p.departmentIds ?? []).includes(dept.id));

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/departments')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          color: 'var(--muted-foreground)',
        }}
      >
        <ArrowLeft size={15} />
        Department Register
      </button>

      {/* Header card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
      }}>
        <div style={{
          padding: '24px', display: 'flex', alignItems: 'flex-start',
          gap: '20px', flexWrap: 'wrap',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--radius-card)',
            background: 'var(--primary)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <Building2 size={28} style={{ color: 'var(--primary-foreground)' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '200px' }}>
            <h1 style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '22px',
              fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', margin: 0,
            }}>
              {dept.name}
            </h1>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <TypeBadge type={dept.type} />
              <StatusBadge status={dept.status} />
              <code style={{
                fontFamily: 'var(--font-family-mono, monospace)', fontSize: '12px',
                background: 'var(--muted)', padding: '2px 8px', borderRadius: '4px',
                color: 'var(--muted-foreground)', letterSpacing: '0.06em',
              }}>
                {dept.code}
              </code>
              <span style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                color: 'var(--muted-foreground)',
              }}>
                {dept.id}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setMoveOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '34px', padding: '0 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              }}
            >
              <MoveIcon size={14} />
              Move
            </button>
            <button
              onClick={() => setEditOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '34px', padding: '0 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              }}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '34px', padding: '0 14px',
                border: '1px solid transparent', borderRadius: 'var(--radius-button)',
                background: 'var(--destructive)', cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                fontWeight: 'var(--font-weight-semibold)', color: '#fff',
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        {/* Metadata strip */}
        <div style={{
          borderTop: '1px solid var(--border)', padding: '14px 24px',
          display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Lead
            </span>
            {lead ? <UserChip user={lead} /> : (
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                Unassigned
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Parent
            </span>
            {parent ? (
              <button
                onClick={() => navigate(`/departments/${parent.id}`)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
              >
                {parent.name}
                <ChevronRight size={12} />
              </button>
            ) : (
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--muted-foreground)' }}>
                Top Level
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--muted-foreground)', fontWeight: 'var(--font-weight-semibold)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Updated
            </span>
            <span style={{
              fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--foreground)',
            }}>
              {formatDate(dept.updatedDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', overflow: 'hidden',
      }}>
        <div style={{ padding: '0 16px' }}>
          <TabBar active={activeTab} onChange={setActiveTab} structureCount={structureCount} historyCount={history.length} productsCount={linkedProducts.length} processesCount={linkedProcesses.length} />
        </div>
        <div style={{ padding: '24px' }}>
          {activeTab === 'Overview' && (
            <OverviewTab
              dept={dept}
              allDepts={allDepts}
              history={history}
              onAddRelationship={handleAddRelationship}
              onUpdateRelationship={handleUpdateRelationship}
              onDeleteRelationship={handleDeleteRelationship}
            />
          )}
          {activeTab === 'Structure' && (
            <StructureTab
              dept={dept}
              allDepts={allDepts}
              onNavigate={id => navigate(`/departments/${id}`)}
              onNewChild={() => {}}
            />
          )}
          {activeTab === 'History' && <HistoryTab history={history} allDepts={allDepts} />}
          {activeTab === 'Products' && (
            <DeptProductsTab
              deptId={dept.id}
              products={allProducts}
              onProductsChange={setAllProducts}
              navigate={navigate}
            />
          )}
          {activeTab === 'Processes' && (
            <DeptProcessesTab
              deptId={dept.id}
              processes={allProcesses}
              onProcessesChange={setAllProcesses}
              navigate={navigate}
            />
          )}
        </div>
      </div>

      {editOpen && (
        <DepartmentFormModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
          editingDept={dept}
          allDepartments={allDepts}
        />
      )}

      {moveOpen && (
        <MoveDeptModal
          isOpen={moveOpen}
          onClose={() => setMoveOpen(false)}
          onSave={handleMove}
          dept={dept}
          allDepartments={allDepts}
        />
      )}

      {deleteOpen && (
        <DeleteDialog
          dept={dept}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
