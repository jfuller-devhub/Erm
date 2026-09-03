import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Briefcase, Link2, Plus, X,
  CheckCircle, XCircle, Calendar, User, Edit3, Package,
  ChevronRight, ChevronDown, GitBranch,
} from 'lucide-react';
import { EmployerFormModal } from '../components/employers/EmployerFormModal';
import { EmployerRelationshipModal } from '../components/employers/EmployerRelationshipModal';
import { EmployerNetworkGraph } from '../components/employers/EmployerNetworkGraph';
import type { Employer, EmployerRelationship, EmployerRelationshipType } from '../data/employerData';
import {
  loadEmployers, saveEmployers,
  loadEmployerRelationships, saveEmployerRelationships,
  getRelationshipsForEmployer,
  RELATIONSHIP_TYPE_LABELS, RELATIONSHIP_TYPE_STYLES,
} from '../data/employerData';
import type { Plan } from '../data/planData';
import { loadPlans, savePlans } from '../data/planData';
import type { Benefit } from '../data/benefitData';
import { loadBenefits } from '../data/benefitData';
import { formatDate, generateId } from '../data/mockData';

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabKey = 'details' | 'relationships' | 'plans';

// ─── Status badge ─────────────────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '22px', padding: '0 10px',
      borderRadius: '100px',
      background: isActive ? '#E8F5EE' : '#F0F2F7',
      color:      isActive ? '#1C8A45' : '#6B7489',
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Relationship type badge ──────────────────────────────────────────────────

function RelTypeBadge({ type }: { type: EmployerRelationshipType }) {
  const s = RELATIONSHIP_TYPE_STYLES[type] ?? { bg: '#F0F2F7', color: '#6B7489' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: s.bg, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {RELATIONSHIP_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ROField({ label, value }: { label: string; value?: string | React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{
        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
        lineHeight: '16px',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-weight-regular)', color: value ? 'var(--foreground)' : 'var(--muted-foreground)',
        lineHeight: '22px',
      }}>
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({
  title, message, confirmLabel = 'Delete', onConfirm, onCancel,
}: {
  title: string; message: React.ReactNode;
  confirmLabel?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
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
          }}>{title}</h3>
          <p style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0,
          }}>{message}</p>
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
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmployerDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employers,       setEmployers]       = useState<Employer[]>([]);
  const [relationships,   setRelationships]   = useState<EmployerRelationship[]>([]);
  const [allPlans,        setAllPlans]        = useState<Plan[]>([]);
  const [allBenefits,     setAllBenefits]     = useState<Benefit[]>([]);
  const [activeTab,       setActiveTab]       = useState<TabKey>('details');
  const [editModalOpen,   setEditModalOpen]   = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState(false);
  const [relModalOpen,    setRelModalOpen]    = useState(false);
  const [editingRel,      setEditingRel]      = useState<EmployerRelationship | null>(null);
  const [deletingRelId,   setDeletingRelId]   = useState<string | null>(null);

  useEffect(() => {
    setEmployers(loadEmployers());
    setRelationships(loadEmployerRelationships());
    setAllPlans(loadPlans());
    setAllBenefits(loadBenefits());
  }, [id]);

  const persistEmployers = useCallback((updated: Employer[]) => {
    setEmployers(updated);
    saveEmployers(updated);
  }, []);

  const persistRelationships = useCallback((updated: EmployerRelationship[]) => {
    setRelationships(updated);
    saveEmployerRelationships(updated);
  }, []);

  const persistPlans = useCallback((updated: Plan[]) => {
    setAllPlans(updated);
    savePlans(updated);
  }, []);

  const employer = employers.find(e => e.id === id) ?? null;

  function patchEmployer(changes: Partial<Employer>) {
    if (!employer) return;
    const updated = employers.map(e => e.id === employer.id ? { ...e, ...changes } : e);
    persistEmployers(updated);
  }

  if (!employer) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '80px 24px', gap: '16px',
      }}>
        <Briefcase size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{
          fontFamily: 'var(--font-family-primary)', fontSize: '14px',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0,
        }}>Employer not found</h2>
        <p style={{
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0,
        }}>
          This employer may have been deleted or the URL is invalid.
        </p>
        <button
          onClick={() => navigate('/entities')}
          style={{
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          Back to Entities
        </button>
      </div>
    );
  }

  const myRelationships = getRelationshipsForEmployer(employer.id, relationships);

  // ─── CRUD ────────────────────────────────────────────────────────────────

  function handleSave(data: Omit<Employer, 'id' | 'createdAt' | 'createdBy' | 'modifiedAt' | 'modifiedBy'>) {
    const now = new Date().toISOString().split('T')[0];
    persistEmployers(
      employers.map(e =>
        e.id === employer.id
          ? { ...e, ...data, modifiedAt: now, modifiedBy: 'Admin' }
          : e,
      ),
    );
    setEditModalOpen(false);
  }

  function handleDeleteEmployer() {
    persistEmployers(employers.filter(e => e.id !== employer.id));
    persistRelationships(
      relationships.filter(r => r.employerId !== employer.id && r.relatedEmployerId !== employer.id),
    );
    navigate('/entities');
  }

  function handleSaveRelationship(relatedEmployerId: string, relationshipType: EmployerRelationshipType) {
    const now = new Date().toISOString().split('T')[0];
    if (editingRel) {
      persistRelationships(
        relationships.map(r =>
          r.id === editingRel.id
            ? { ...r, relatedEmployerId, relationshipType }
            : r,
        ),
      );
    } else {
      const newRel: EmployerRelationship = {
        id: 'ERL-' + generateId(),
        employerId: employer.id,
        relatedEmployerId,
        relationshipType,
      };
      persistRelationships([...relationships, newRel]);
    }
    setRelModalOpen(false);
    setEditingRel(null);
  }

  function handleDeleteRelationship(relId: string) {
    persistRelationships(relationships.filter(r => r.id !== relId));
    setDeletingRelId(null);
  }


  // ─── Tab bar ────────────────────────────────────────────────────────────

  const linkedPlans   = allPlans.filter(p => p.entityIds.includes(employer.id));
  const linkedBenefitsCount = (employer.benefitIds ?? []).length;

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'details',       label: 'Details' },
    { key: 'plans',         label: 'Plans & Benefits', count: linkedPlans.length + linkedBenefitsCount },
    { key: 'relationships', label: 'Relationships', count: myRelationships.length },
  ];

  function TabBar() {
    return (
      <div style={{
        display: 'flex', borderBottom: '2px solid var(--border)',
        gap: '0',
      }}>
        {TABS.map(t => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                height: '40px', padding: '0 16px',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                marginBottom: '-2px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '20px', height: '18px', padding: '0 5px',
                  borderRadius: '100px',
                  background: isActive ? 'var(--primary)' : 'var(--muted)',
                  color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const btnBase: React.CSSProperties = {
    height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '0 14px', border: 'none', borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  };

  const deletingRel = deletingRelId ? relationships.find(r => r.id === deletingRelId) ?? null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Back navigation */}
      <button
        onClick={() => navigate('/entities')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
      >
        <ArrowLeft size={16} />
        Back to Entities
      </button>

      {/* Record Summary Header */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left: name + meta */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', minWidth: 0 }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: 'var(--radius-card)',
              background: 'var(--primary)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <Briefcase size={22} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '22px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                  margin: 0, lineHeight: '30px',
                }}>
                  {employer.name}
                </h1>
                <ActiveBadge isActive={employer.isActive} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  background: 'var(--muted)', padding: '2px 8px', borderRadius: 'var(--radius-input)',
                  letterSpacing: '0.03em',
                }}>
                  {employer.code}
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                }}>
                  {myRelationships.length} relationship{myRelationships.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
            <button
              onClick={() => setEditModalOpen(true)}
              style={{ ...btnBase, background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(35,34,240,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{ ...btnBase, background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px', marginTop: '20px', paddingTop: '16px',
          borderTop: '1px solid var(--border)',
        }}>
          {[
            { label: 'Status',       value: employer.isActive ? 'Active' : 'Inactive', icon: employer.isActive ? CheckCircle : XCircle, color: employer.isActive ? '#1C8A45' : '#6B7489' },
            { label: 'Relationships', value: String(myRelationships.length), icon: Link2,     color: '#2322F0' },
            { label: 'Created',      value: formatDate(employer.createdAt),   icon: Calendar,  color: 'var(--muted-foreground)' },
            { label: 'Modified',     value: formatDate(employer.modifiedAt),  icon: Edit3,     color: 'var(--muted-foreground)' },
            { label: 'Created By',   value: employer.createdBy,              icon: User,      color: 'var(--muted-foreground)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={12} style={{ color, flexShrink: 0 }} />
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {label}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              }}>
                {value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + content card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden',
      }}>
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          <TabBar />
        </div>

        <div style={{ padding: '24px' }}>

          {/* ── DETAILS TAB ──────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
              gap: '24px',
              alignItems: 'start',
            }}>
              {/* Left column — field data */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '20px',
                }}>
                  <ROField label="Employer Name" value={employer.name} />
                  <ROField label="Code"          value={employer.code} />
                  <ROField label="Status"        value={employer.isActive ? 'Active' : 'Inactive'} />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                    marginBottom: '16px',
                  }}>
                    Audit Information
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '20px',
                  }}>
                    <ROField label="Created"       value={formatDate(employer.createdAt)} />
                    <ROField label="Created By"    value={employer.createdBy} />
                    <ROField label="Last Modified" value={formatDate(employer.modifiedAt)} />
                    <ROField label="Modified By"   value={employer.modifiedBy} />
                  </div>
                </div>
              </div>

              {/* Right column — relationship network */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                  lineHeight: '20px',
                }}>
                  Relationship Network
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                  lineHeight: '18px', marginTop: '-4px',
                }}>
                  Hover a node for details · click to navigate
                </div>
                <EmployerNetworkGraph
                  employer={employer}
                  relationships={myRelationships}
                  allEmployers={employers}
                  onNavigate={(targetId) => navigate(`/entities/${targetId}`)}
                />
              </div>
            </div>
          )}

          {/* ── PLANS & BENEFITS TAB ────────────────────────────────────── */}
          {activeTab === 'plans' && (
            <EntityPlansTab
              employer={employer}
              allPlans={allPlans}
              allBenefits={allBenefits}
              onSavePlans={persistPlans}
              onPatchEmployer={patchEmployer}
              navigate={navigate}
            />
          )}

          {/* ── RELATIONSHIPS TAB ────────────────────────────────────────── */}
          {activeTab === 'relationships' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Section header with Add button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                    lineHeight: '20px',
                  }}>
                    Employer Relationships
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                    lineHeight: '18px',
                  }}>
                    Other employers related to {employer.name} and the nature of each relationship.
                  </div>
                </div>
                <button
                  onClick={() => { setEditingRel(null); setRelModalOpen(true); }}
                  style={{ ...btnBase, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus size={14} />
                  Add Relationship
                </button>
              </div>

              {/* Relationship list */}
              {myRelationships.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '40px 24px', gap: '12px',
                  background: 'var(--muted)', borderRadius: 'var(--radius-card)',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-card)',
                    background: 'var(--card)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--muted-foreground)',
                  }}>
                    <Link2 size={24} />
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: '14px',
                    fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                  }}>
                    No relationships yet
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
                    textAlign: 'center', maxWidth: '360px',
                  }}>
                    Link this employer to other employers by adding a relationship above.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {/* Column headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 160px 160px 160px 80px',
                    gap: '8px',
                    padding: '8px 12px',
                    background: 'var(--muted)',
                    borderRadius: 'var(--radius-card)',
                    marginBottom: '4px',
                  }}>
                    {['Related Employer', 'Code', 'Status', 'Relationship Type', ''].map(h => (
                      <span key={h} style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                        lineHeight: '16px', textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {myRelationships.map((rel, idx) => {
                    const otherId = rel.employerId === employer.id
                      ? rel.relatedEmployerId
                      : rel.employerId;
                    const other = employers.find(e => e.id === otherId);
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={rel.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 160px 160px 160px 80px',
                          gap: '8px',
                          padding: '10px 12px',
                          background: isEven ? 'transparent' : 'var(--muted)',
                          borderRadius: 'var(--radius-card)',
                          alignItems: 'center',
                        }}
                      >
                        {/* Name — link */}
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
                            cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                          onClick={() => other && navigate(`/entities/${other.id}`)}
                        >
                          {other?.name ?? 'Unknown Employer'}
                        </span>

                        {/* Code */}
                        <span style={{
                          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
                        }}>
                          {other?.code ?? '—'}
                        </span>

                        {/* Status */}
                        {other ? (
                          <ActiveBadge isActive={other.isActive} />
                        ) : (
                          <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>—</span>
                        )}

                        {/* Relationship type */}
                        <RelTypeBadge type={rel.relationshipType} />

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <button
                            title="Edit relationship"
                            onClick={() => { setEditingRel(rel); setRelModalOpen(true); }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', border: 'none',
                              borderRadius: 'var(--radius-input)', background: 'transparent',
                              color: 'var(--muted-foreground)', cursor: 'pointer',
                            }}
                            onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--card)')}
                            onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            title="Remove relationship"
                            onClick={() => setDeletingRelId(rel.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', border: 'none',
                              borderRadius: 'var(--radius-input)', background: 'transparent',
                              color: 'var(--destructive)', cursor: 'pointer',
                            }}
                            onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(192,57,43,0.08)')}
                            onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit employer modal */}
      <EmployerFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSave}
        initialData={employer}
        allEmployers={employers}
      />

      {/* Delete employer confirmation */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          title="Delete Employer"
          message={<>Are you sure you want to delete <strong style={{ color: 'var(--foreground)' }}>{employer.name}</strong>? All relationships will also be removed. This action cannot be undone.</>}
          confirmLabel="Delete Employer"
          onConfirm={handleDeleteEmployer}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {/* Add / Edit relationship modal */}
      <EmployerRelationshipModal
        isOpen={relModalOpen}
        onClose={() => { setRelModalOpen(false); setEditingRel(null); }}
        onSave={handleSaveRelationship}
        currentEmployer={employer}
        allEmployers={employers}
        existingRelationships={myRelationships}
        editingRelationship={editingRel}
      />

      {/* Remove relationship confirmation */}
      {deletingRelId && (() => {
        const rel = relationships.find(r => r.id === deletingRelId);
        const otherId = rel
          ? (rel.employerId === employer.id ? rel.relatedEmployerId : rel.employerId)
          : null;
        const other = otherId ? employers.find(e => e.id === otherId) : null;
        return rel ? (
          <DeleteConfirmDialog
            title="Remove Relationship"
            message={<>Remove the <strong style={{ color: 'var(--foreground)' }}>{RELATIONSHIP_TYPE_LABELS[rel.relationshipType]}</strong> relationship with <strong style={{ color: 'var(--foreground)' }}>{other?.name ?? 'this employer'}</strong>? This cannot be undone.</>}
            confirmLabel="Remove Relationship"
            onConfirm={() => handleDeleteRelationship(deletingRelId)}
            onCancel={() => setDeletingRelId(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

// ─── Plans & Benefits Tab ─────────────────────────────────────────────────────

type EntityAssoc =
  | { kind: 'plan';    plan: Plan }
  | { kind: 'benefit'; benefit: Benefit; plan: Plan | null };

function planStatusStyle(status: string) {
  if (status === 'Active')   return { bg: '#E8F5EE', color: '#1C8A45' };
  if (status === 'Draft')    return { bg: '#FFF3E0', color: '#E07B00' };
  if (status === 'Archived') return { bg: '#FDE8E8', color: '#C0392B' };
  return { bg: '#F0F0F0', color: '#6B7489' };
}

function benefitStatusStyle(status: string) {
  if (status === 'Active')   return { bg: '#E8F5EE', color: '#1C8A45' };
  if (status === 'Draft')    return { bg: '#FFF3E0', color: '#E07B00' };
  if (status === 'Archived') return { bg: '#FDE8E8', color: '#C0392B' };
  return { bg: '#F0F0F0', color: '#6B7489' };
}

function EntityPlansTab({
  employer, allPlans, allBenefits, onSavePlans, onPatchEmployer, navigate,
}: {
  employer: Employer;
  allPlans: Plan[];
  allBenefits: Benefit[];
  onSavePlans: (plans: Plan[]) => void;
  onPatchEmployer: (changes: Partial<Employer>) => void;
  navigate: (path: string) => void;
}) {
  const [showAddPicker,    setShowAddPicker]    = useState(false);
  const [expandedPlanId,   setExpandedPlanId]   = useState<string | null>(null);
  const [deletingAssoc,    setDeletingAssoc]    = useState<EntityAssoc | null>(null);

  const benefitIds = employer.benefitIds ?? [];

  // Flat resolved list: plan-level links first, then benefit-level links
  const resolved: EntityAssoc[] = [
    ...allPlans
      .filter(p => p.entityIds.includes(employer.id))
      .map(p => ({ kind: 'plan' as const, plan: p })),
    ...benefitIds
      .map(bid => {
        const benefit = allBenefits.find(b => b.id === bid);
        if (!benefit) return null;
        const plan = allPlans.find(p => p.id === benefit.planId) ?? null;
        return { kind: 'benefit' as const, benefit, plan };
      })
      .filter((r): r is { kind: 'benefit'; benefit: Benefit; plan: Plan | null } => r !== null),
  ];

  function handleLinkPlan(planId: string) {
    const updated = allPlans.map(p =>
      p.id === planId && !p.entityIds.includes(employer.id)
        ? { ...p, entityIds: [...p.entityIds, employer.id] }
        : p,
    );
    onSavePlans(updated);
  }

  function handleLinkBenefit(benefitId: string) {
    if (benefitIds.includes(benefitId)) return;
    onPatchEmployer({ benefitIds: [...benefitIds, benefitId] });
  }

  function handleRemove(assoc: EntityAssoc) {
    if (assoc.kind === 'plan') {
      // Remove entity from plan's entityIds; also clean up any benefits of this plan from employer
      const planBenefitIds = allBenefits.filter(b => b.planId === assoc.plan.id).map(b => b.id);
      onSavePlans(allPlans.map(p =>
        p.id === assoc.plan.id
          ? { ...p, entityIds: p.entityIds.filter(eid => eid !== employer.id) }
          : p,
      ));
      onPatchEmployer({ benefitIds: benefitIds.filter(bid => !planBenefitIds.includes(bid)) });
    } else {
      onPatchEmployer({ benefitIds: benefitIds.filter(id => id !== assoc.benefit.id) });
    }
    setDeletingAssoc(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            Linked Plans & Benefits
          </span>
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '100px', padding: '1px 8px', lineHeight: '18px' }}>
            {resolved.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddPicker(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Add Plan or Benefit
        </button>
      </div>

      {/* ── Picker panel ────────────────────────────────────────────── */}
      {showAddPicker && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Select a Plan or Benefit to Associate
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', maxHeight: '280px', overflowY: 'auto' }}>
            {allPlans.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                No plans available.
              </div>
            ) : (
              allPlans.map(plan => {
                const planBenefits   = allBenefits.filter(b => b.planId === plan.id);
                const hasBenefits    = planBenefits.length > 0;
                const isExpanded     = expandedPlanId === plan.id;
                const planLinked     = plan.entityIds.includes(employer.id);
                const ps             = planStatusStyle(plan.status);

                return (
                  <div key={plan.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    {/* Plan row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                      {hasBenefits ? (
                        <button type="button"
                          onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)', flexShrink: 0 }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      ) : (
                        <span style={{ width: '14px', flexShrink: 0 }} />
                      )}
                      <Package size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                        {plan.name}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px', borderRadius: '100px', background: ps.bg, color: ps.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>
                        {plan.status}
                      </span>
                      <button type="button"
                        disabled={planLinked}
                        onClick={() => handleLinkPlan(plan.id)}
                        style={{ height: '24px', padding: '0 10px', border: `1px solid ${planLinked ? 'var(--border)' : 'var(--primary)'}`, borderRadius: 'var(--radius-button)', background: planLinked ? 'var(--muted)' : 'transparent', color: planLinked ? 'var(--muted-foreground)' : 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: planLinked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                      >
                        {planLinked ? 'Linked' : <><Plus size={10} /> Add</>}
                      </button>
                    </div>

                    {/* Benefit sub-rows */}
                    {isExpanded && hasBenefits && (
                      <div style={{ paddingLeft: '36px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                        {planBenefits.map(benefit => {
                          const benefitLinked = benefitIds.includes(benefit.id);
                          const bs = benefitStatusStyle(benefit.status);
                          return (
                            <div key={benefit.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                              <GitBranch size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                              <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)' }}>
                                {benefit.name}
                              </span>
                              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)', flexShrink: 0 }}>
                                {benefit.category}
                              </span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px', borderRadius: '100px', background: bs.bg, color: bs.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>
                                {benefit.status}
                              </span>
                              <button type="button"
                                disabled={benefitLinked}
                                onClick={() => handleLinkBenefit(benefit.id)}
                                style={{ height: '22px', padding: '0 8px', border: `1px solid ${benefitLinked ? 'var(--border)' : 'var(--primary)'}`, borderRadius: 'var(--radius-button)', background: benefitLinked ? 'var(--muted)' : 'transparent', color: benefitLinked ? 'var(--muted-foreground)' : 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: benefitLinked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}
                              >
                                {benefitLinked ? 'Linked' : <><Plus size={9} /> Add</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button"
              onClick={() => { setShowAddPicker(false); setExpandedPlanId(null); }}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Association cards ────────────────────────────────────────── */}
      {resolved.length === 0 && !showAddPicker ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Package size={48} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No plans or benefits linked</div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Associate this entity with benefit plans or specific benefits.</div>
          <button
            onClick={() => setShowAddPicker(true)}
            style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> Add Plan or Benefit
          </button>
        </div>
      ) : resolved.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {resolved.map((item, idx) => {
            const isFirst  = idx === 0;
            const isLast   = idx === resolved.length - 1;
            const radius   = isFirst && isLast ? 'var(--radius-card)' : isFirst ? 'var(--radius-card) var(--radius-card) 0 0' : isLast ? '0 0 var(--radius-card) var(--radius-card)' : '0';
            const key      = item.kind === 'plan' ? `plan-${item.plan.id}` : `bnf-${item.benefit.id}`;

            if (item.kind === 'plan') {
              const ps = planStatusStyle(item.plan.status);
              return (
                <div key={key}
                  style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: isLast ? '1px solid var(--border)' : 'none', borderRadius: radius, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
                >
                  <Package size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <button type="button"
                    onClick={() => navigate(`/plans/${item.plan.id}`)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', textAlign: 'left', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {item.plan.name}
                  </button>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: ps.bg, color: ps.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>
                    {item.plan.status}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button type="button"
                    onClick={() => setDeletingAssoc(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                  >
                    <X size={10} /> Unlink
                  </button>
                </div>
              );
            } else {
              const bs  = benefitStatusStyle(item.benefit.status);
              const ps2 = item.plan ? planStatusStyle(item.plan.status) : null;
              return (
                <div key={key}
                  style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: isLast ? '1px solid var(--border)' : 'none', borderRadius: radius, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}
                >
                  <Package size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  {/* Parent plan */}
                  {item.plan && (
                    <button type="button"
                      onClick={() => navigate(`/plans/${item.plan!.id}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.plan.name}
                    </button>
                  )}
                  {/* Benefit sub-label */}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <GitBranch size={11} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.benefit.name}
                    </span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: bs.bg, color: bs.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>
                    {item.benefit.status}
                  </span>
                  <span style={{ flex: 1 }} />
                  <button type="button"
                    onClick={() => setDeletingAssoc(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
                  >
                    <X size={10} /> Unlink
                  </button>
                </div>
              );
            }
          })}
        </div>
      ) : null}

      {/* ── Delete confirm ───────────────────────────────────────────── */}
      {deletingAssoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeletingAssoc(null); }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)', width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
              Remove Association
            </h3>
            <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '22px' }}>
              {deletingAssoc.kind === 'plan' ? (
                <>Remove the plan-level link to <strong style={{ color: 'var(--foreground)' }}>{deletingAssoc.plan.name}</strong>? Any benefit-level links under this plan will also be removed.</>
              ) : (
                <>Remove the benefit-level link to <strong style={{ color: 'var(--foreground)' }}>{deletingAssoc.benefit.name}</strong>?</>
              )}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button onClick={() => setDeletingAssoc(null)} style={{ height: '36px', padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleRemove(deletingAssoc)} style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}