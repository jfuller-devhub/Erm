import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Briefcase, Link2, Plus, X,
  CheckCircle, XCircle, Calendar, User, Edit3, Package, Heart, Search,
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
import type { Product } from '../data/productData';
import { loadProducts } from '../data/productData';
import { formatDate, generateId } from '../data/mockData';

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabKey = 'details' | 'relationships' | 'products';

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
  const [allProducts,     setAllProducts]     = useState<Product[]>([]);
  const [activeTab,       setActiveTab]       = useState<TabKey>('details');
  const [editModalOpen,   setEditModalOpen]   = useState(false);
  const [deleteConfirm,   setDeleteConfirm]   = useState(false);
  const [relModalOpen,    setRelModalOpen]    = useState(false);
  const [editingRel,      setEditingRel]      = useState<EmployerRelationship | null>(null);
  const [deletingRelId,   setDeletingRelId]   = useState<string | null>(null);
  const [productSearch,   setProductSearch]   = useState('');
  const [showProductLink, setShowProductLink] = useState(false);
  const [linkSearch,      setLinkSearch]      = useState('');

  useEffect(() => {
    setEmployers(loadEmployers());
    setRelationships(loadEmployerRelationships());
    setAllProducts(loadProducts());
  }, [id]);

  const persistEmployers = useCallback((updated: Employer[]) => {
    setEmployers(updated);
    saveEmployers(updated);
  }, []);

  const persistRelationships = useCallback((updated: EmployerRelationship[]) => {
    setRelationships(updated);
    saveEmployerRelationships(updated);
  }, []);

  const employer = employers.find(e => e.id === id) ?? null;

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
          onClick={() => navigate('/employers')}
          style={{
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          Back to Employers
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
    navigate('/employers');
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

  // ─── Product link/unlink handlers ───────────────────────────────────────

  function handleLinkProduct(productId: string) {
    const now = new Date().toISOString().split('T')[0];
    const updated = employers.map(e =>
      e.id === employer.id && !e.productIds.includes(productId)
        ? { ...e, productIds: [...e.productIds, productId], modifiedAt: now, modifiedBy: 'Admin' }
        : e,
    );
    persistEmployers(updated);
    setLinkSearch('');
    setShowProductLink(false);
  }

  function handleUnlinkProduct(productId: string) {
    const now = new Date().toISOString().split('T')[0];
    const updated = employers.map(e =>
      e.id === employer.id
        ? { ...e, productIds: e.productIds.filter(pid => pid !== productId), modifiedAt: now, modifiedBy: 'Admin' }
        : e,
    );
    persistEmployers(updated);
  }

  // ─── Tab bar ────────────────────────────────────────────────────────────

  const linkedProductIds = employer.productIds ?? [];
  const linkedProducts = allProducts.filter(p => linkedProductIds.includes(p.id));

  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'details',       label: 'Details' },
    { key: 'products',      label: 'Products', count: linkedProducts.length },
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
        onClick={() => navigate('/employers')}
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
        Back to Employers
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
                  onNavigate={(targetId) => navigate(`/employers/${targetId}`)}
                />
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'products' && (() => {
            const filteredLinked = linkedProducts.filter(p =>
              !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()),
            );
            const unlinkableIds = new Set(linkedProductIds);
            const linkableProducts = allProducts.filter(
              p => !unlinkableIds.has(p.id) &&
                (!linkSearch || p.name.toLowerCase().includes(linkSearch.toLowerCase())),
            );

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '20px' }}>
                      Offered Products
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: '18px' }}>
                      Benefits and services available to {employer.name} employees.
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowProductLink(p => !p); setLinkSearch(''); }}
                    style={{ ...btnBase, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <Plus size={14} /> Link Product
                  </button>
                </div>

                {/* Inline link picker */}
                {showProductLink && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--muted)' }}>
                      <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                      <input
                        autoFocus
                        value={linkSearch}
                        onChange={e => setLinkSearch(e.target.value)}
                        placeholder="Search products to link..."
                        style={{
                          flex: 1, border: 'none', background: 'transparent', outline: 'none',
                          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                          color: 'var(--foreground)',
                        }}
                      />
                      <button
                        onClick={() => setShowProductLink(false)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    {linkableProducts.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                        {linkSearch ? 'No matching products.' : 'All products are already linked.'}
                      </div>
                    ) : (
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {linkableProducts.map(p => (
                          <div
                            key={p.id}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => handleLinkProduct(p.id)}
                          >
                            <div>
                              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{p.name}</div>
                              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{p.category} · {p.type}</div>
                            </div>
                            <Plus size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Search linked */}
                {linkedProducts.length > 4 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', padding: '6px 10px', background: 'var(--card)' }}>
                    <Search size={13} style={{ color: 'var(--muted-foreground)' }} />
                    <input
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Filter linked products..."
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}
                    />
                  </div>
                )}

                {/* Linked product list */}
                {linkedProducts.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: '12px', background: 'var(--muted)', borderRadius: 'var(--radius-card)' }}>
                    <Package size={32} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No products linked</span>
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', textAlign: 'center', maxWidth: '320px' }}>
                      Click "Link Product" to associate benefits and services with this employer.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                    {/* Column headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 40px', gap: '8px', padding: '8px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {['Product', 'Category', 'Type', ''].map(h => (
                        <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                      ))}
                    </div>
                    {filteredLinked.map((p, idx) => (
                      <div
                        key={p.id}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 40px', gap: '8px', padding: '10px 14px', alignItems: 'center', borderBottom: idx < filteredLinked.length - 1 ? '1px solid var(--border)' : 'none', background: 'transparent' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span
                          style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          onClick={() => navigate(`/products/${p.id}`)}
                        >
                          {p.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.category}</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          height: '20px', padding: '0 8px', borderRadius: '100px',
                          background: p.type === 'Benefit' ? '#E8F5EE' : '#E0F5F5',
                          color: p.type === 'Benefit' ? '#1C8A45' : '#00A3A3',
                          fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
                        }}>
                          {p.type === 'Benefit' ? <Heart size={9} /> : <Package size={9} />}
                          {p.type}
                        </span>
                        <button
                          title="Remove product link"
                          onClick={() => handleUnlinkProduct(p.id)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(192,57,43,0.08)')}
                          onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

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
                          onClick={() => other && navigate(`/employers/${other.id}`)}
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