import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Users, Plus, X, Search,
  Building2, Package, Heart, Briefcase, Tag,
  Check,
} from 'lucide-react';
import { PersonaFormModal } from '../components/personas/PersonaFormModal';
import type { Persona, PersonaStatus, PersonaAttribute } from '../data/personaData';
import {
  loadPersonas, savePersonas, updatePersona,
} from '../data/personaData';
import type { Employer } from '../data/employerData';
import { loadEmployers, saveEmployers } from '../data/employerData';
import type { Product } from '../data/productData';
import { loadProducts } from '../data/productData';
import { formatDate, generateId } from '../data/mockData';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<PersonaStatus, { bg: string; color: string }> = {
  Active:   { bg: '#E8F5EE', color: '#1C8A45' },
  Draft:    { bg: '#FFF3E0', color: '#E07B00' },
  Inactive: { bg: '#F0F0F0', color: '#6B7489' },
};

function StatusBadge({ status }: { status: PersonaStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Inactive;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '22px', padding: '0 10px',
      borderRadius: '100px', background: s.bg, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'Overview' | 'Entities' | 'Products';
const TABS: Tab[] = ['Overview', 'Entities', 'Products'];

function TabBar({ active, onChange, counts }: { active: Tab; onChange: (t: Tab) => void; counts: Partial<Record<Tab, number>> }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
      {TABS.map(tab => {
        const isActive = tab === active;
        const count = counts[tab];
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
            {count !== undefined && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '100px',
                background: isActive ? 'var(--primary)' : 'var(--muted)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
              }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Inline link picker (shared by Entities + Products tabs) ──────────────────

function LinkPicker<T extends { id: string }>({
  items,
  renderItem,
  onSelect,
  onClose,
  placeholder,
  emptyMsg,
}: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  onClose: () => void;
  placeholder: string;
  emptyMsg: string;
}) {
  const [q, setQ] = useState('');
  const filtered = items.filter(i => {
    const label = (i as any).name ?? '';
    return !q || label.toLowerCase().includes(q.toLowerCase());
  });
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--muted)' }}>
        <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}
        />
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
          <X size={13} />
        </button>
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
          {q ? 'No matches.' : emptyMsg}
        </div>
      ) : (
        <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
          {filtered.map(item => (
            <div
              key={item.id}
              style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onSelect(item)}
            >
              {renderItem(item)}
              <Plus size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete confirm dialog ────────────────────────────────────────────────────

function DeleteConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }: {
  title: string; message: React.ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>{title}</h3>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>{message}</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancel} style={{ height: '36px', padding: '0 16px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PersonaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [personas,     setPersonas]     = useState<Persona[]>([]);
  const [allEntities,  setAllEntities]  = useState<Employer[]>([]);
  const [allProducts,  setAllProducts]  = useState<Product[]>([]);
  const [activeTab,    setActiveTab]    = useState<Tab>('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Attribute editing state
  const [editingAttrId, setEditingAttrId] = useState<string | null>(null);
  const [attrLabel, setAttrLabel]         = useState('');
  const [attrValue, setAttrValue]         = useState('');
  const [addingAttr, setAddingAttr]       = useState(false);
  const [newAttrLabel, setNewAttrLabel]   = useState('');
  const [newAttrValue, setNewAttrValue]   = useState('');

  // Link picker state
  const [showEntityPicker, setShowEntityPicker]   = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  useEffect(() => {
    setPersonas(loadPersonas());
    setAllEntities(loadEmployers());
    setAllProducts(loadProducts());
  }, [id]);

  const persona = personas.find(p => p.id === id) ?? null;

  const persist = useCallback((updated: Persona[]) => {
    setPersonas(updated);
    savePersonas(updated);
  }, []);

  const patchPersona = useCallback((changes: Partial<Persona>) => {
    if (!persona) return;
    const updated = updatePersona(persona, changes);
    persist(personas.map(p => (p.id === id ? updated : p)));
  }, [persona, personas, id, persist]);

  if (!persona && personas.length > 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <Users size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>Persona not found</h2>
        <button onClick={() => navigate('/personas')} style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
          Back to Personas
        </button>
      </div>
    );
  }
  if (!persona) return null;

  const linkedEntities  = allEntities.filter(e => persona.entityIds.includes(e.id));
  const linkedProducts  = allProducts.filter(p => persona.productIds.includes(p.id));
  const linkableEntities  = allEntities.filter(e => !persona.entityIds.includes(e.id));
  const linkableProducts  = allProducts.filter(p => !persona.productIds.includes(p.id));

  const tabCounts: Partial<Record<Tab, number>> = {
    Entities: linkedEntities.length,
    Products: linkedProducts.length,
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function handleSaveEdit(saved: Persona) {
    setPersonas(loadPersonas());
  }

  function handleDelete() {
    persist(personas.filter(p => p.id !== id));
    navigate('/personas');
  }

  // Attributes
  function handleAddAttribute() {
    if (!newAttrLabel.trim()) return;
    const attr: PersonaAttribute = { id: 'ATR-' + generateId(), label: newAttrLabel.trim(), value: newAttrValue.trim() };
    patchPersona({ attributes: [...persona.attributes, attr] });
    setNewAttrLabel(''); setNewAttrValue(''); setAddingAttr(false);
  }

  function handleSaveAttribute(attrId: string) {
    const updated = persona.attributes.map(a =>
      a.id === attrId ? { ...a, label: attrLabel, value: attrValue } : a,
    );
    patchPersona({ attributes: updated });
    setEditingAttrId(null);
  }

  function handleDeleteAttribute(attrId: string) {
    patchPersona({ attributes: persona.attributes.filter(a => a.id !== attrId) });
  }

  function openEditAttr(attr: PersonaAttribute) {
    setEditingAttrId(attr.id);
    setAttrLabel(attr.label);
    setAttrValue(attr.value);
  }

  // Entities
  function handleLinkEntity(entity: Employer) {
    patchPersona({ entityIds: [...persona.entityIds, entity.id] });
    setShowEntityPicker(false);
  }

  function handleUnlinkEntity(entityId: string) {
    patchPersona({ entityIds: persona.entityIds.filter(eid => eid !== entityId) });
  }

  // Products
  function handleLinkProduct(product: Product) {
    patchPersona({ productIds: [...persona.productIds, product.id] });
    setShowProductPicker(false);
  }

  function handleUnlinkProduct(productId: string) {
    patchPersona({ productIds: persona.productIds.filter(pid => pid !== productId) });
  }

  const btnBase: React.CSSProperties = {
    height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '0 14px', border: 'none', borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Back nav */}
      <button
        onClick={() => navigate('/personas')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-foreground)')}
      >
        <ArrowLeft size={16} /> Back to Persona Register
      </button>

      {/* Header card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', minWidth: 0 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-card)', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Users size={22} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '22px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0, lineHeight: '30px' }}>
                  {persona.name}
                </h1>
                <StatusBadge status={persona.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 8px', borderRadius: 'var(--radius-input)', letterSpacing: '0.03em' }}>
                  {persona.id}
                </span>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  {persona.category}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditModalOpen(true)}
              style={{ ...btnBase, background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(35,34,240,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{ ...btnBase, background: 'var(--destructive)', color: 'var(--destructive-foreground)' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Entities',    value: String(linkedEntities.length),  icon: Building2 },
            { label: 'Products',    value: String(linkedProducts.length),  icon: Package },
            { label: 'Attributes',  value: String(persona.attributes.length), icon: Tag },
            { label: 'Updated',     value: formatDate(persona.updatedDate), icon: Edit2 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={12} style={{ color: 'var(--muted-foreground)' }} />
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{value || '—'}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {persona.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px' }}>
            {persona.tags.map(tag => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: 'var(--muted)', border: '1px solid var(--border)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs + content */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border)' }}>
          <TabBar active={activeTab} onChange={setActiveTab} counts={tabCounts} />
        </div>

        <div style={{ padding: '24px' }}>

          {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Description */}
              {persona.description && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</div>
                  <p style={{ margin: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', lineHeight: '1.6' }}>
                    {persona.description}
                  </p>
                </div>
              )}

              {/* Attributes / "Things" */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Characteristics
                  </div>
                  <button
                    onClick={() => { setAddingAttr(true); setNewAttrLabel(''); setNewAttrValue(''); }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '28px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>

                {/* Add new attribute inline form */}
                {addingAttr && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', background: 'var(--muted)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
                    <input
                      autoFocus
                      value={newAttrLabel}
                      onChange={e => setNewAttrLabel(e.target.value)}
                      placeholder="Label (e.g. Age Range)"
                      style={{ flex: '0 0 180px', height: '30px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--card)', fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--foreground)', outline: 'none' }}
                    />
                    <input
                      value={newAttrValue}
                      onChange={e => setNewAttrValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddAttribute(); if (e.key === 'Escape') setAddingAttr(false); }}
                      placeholder="Value"
                      style={{ flex: 1, height: '30px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'var(--card)', fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--foreground)', outline: 'none' }}
                    />
                    <button onClick={handleAddAttribute} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 'none', borderRadius: 'var(--radius-input)', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer', flexShrink: 0 }}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => setAddingAttr(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Attribute table */}
                {persona.attributes.length === 0 && !addingAttr ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                    No characteristics yet. Click "Add" to describe this persona's key attributes.
                  </div>
                ) : (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 64px', padding: '8px 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {['Label', 'Value', ''].map(h => (
                        <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                      ))}
                    </div>
                    {persona.attributes.map((attr, idx) => (
                      <div
                        key={attr.id}
                        style={{ display: 'grid', gridTemplateColumns: '200px 1fr 64px', padding: '0', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => { if (editingAttrId !== attr.id) (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                        onMouseLeave={e => { if (editingAttrId !== attr.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                      >
                        {editingAttrId === attr.id ? (
                          <>
                            <input
                              value={attrLabel}
                              onChange={e => setAttrLabel(e.target.value)}
                              style={{ margin: '6px 0 6px 12px', height: '30px', padding: '0 8px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-input)', background: 'var(--card)', fontFamily: 'var(--font-family-primary)', fontSize: '13px', outline: 'none' }}
                            />
                            <input
                              value={attrValue}
                              onChange={e => setAttrValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveAttribute(attr.id); if (e.key === 'Escape') setEditingAttrId(null); }}
                              style={{ margin: '6px 8px', height: '30px', padding: '0 8px', border: '1px solid var(--primary)', borderRadius: 'var(--radius-input)', background: 'var(--card)', fontFamily: 'var(--font-family-primary)', fontSize: '13px', outline: 'none' }}
                            />
                            <div style={{ display: 'flex', gap: '4px', padding: '0 8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => handleSaveAttribute(attr.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
                                <Check size={12} />
                              </button>
                              <button onClick={() => setEditingAttrId(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                                <X size={12} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span style={{ padding: '10px 0 10px 14px', fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{attr.label}</span>
                            <span style={{ padding: '10px 8px', fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: attr.value ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{attr.value || '—'}</span>
                            <div style={{ display: 'flex', gap: '2px', padding: '0 8px', justifyContent: 'flex-end' }}>
                              <button onClick={() => openEditAttr(attr)} title="Edit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--card)')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                              ><Edit2 size={12} /></button>
                              <button onClick={() => handleDeleteAttribute(attr.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}
                                onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(192,57,43,0.08)')}
                                onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                              ><X size={12} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ENTITIES TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'Entities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Entity Associations</div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Entities whose members can have this persona.
                  </div>
                </div>
                <button
                  onClick={() => setShowEntityPicker(p => !p)}
                  style={{ ...btnBase, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus size={14} /> Link Entity
                </button>
              </div>

              {showEntityPicker && (
                <LinkPicker
                  items={linkableEntities}
                  onSelect={handleLinkEntity}
                  onClose={() => setShowEntityPicker(false)}
                  placeholder="Search entities to link…"
                  emptyMsg="All entities are already linked."
                  renderItem={e => (
                    <div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{e.name}</div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{e.code} · {e.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                  )}
                />
              )}

              {linkedEntities.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Building2 size={32} style={{ color: 'var(--muted-foreground)' }} />
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No entities linked</span>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Link entities whose members may be this persona.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 40px', padding: '8px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    {['Entity', 'Code', 'Status', ''].map(h => (
                      <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                    ))}
                  </div>
                  {linkedEntities.map((entity, idx) => (
                    <div
                      key={entity.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 40px', padding: '10px 14px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/entities/${entity.id}`)}
                      >
                        {entity.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--muted-foreground)' }}>{entity.code}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 7px', borderRadius: '100px', background: entity.isActive ? '#E8F5EE' : '#F0F0F0', color: entity.isActive ? '#1C8A45' : '#6B7489', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>
                        {entity.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => handleUnlinkEntity(entity.id)} title="Remove link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(192,57,43,0.08)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      ><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'Products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Associated Products</div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Benefits and services relevant to this persona.
                  </div>
                </div>
                <button
                  onClick={() => setShowProductPicker(p => !p)}
                  style={{ ...btnBase, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  <Plus size={14} /> Link Product
                </button>
              </div>

              {showProductPicker && (
                <LinkPicker
                  items={linkableProducts}
                  onSelect={handleLinkProduct}
                  onClose={() => setShowProductPicker(false)}
                  placeholder="Search products to link…"
                  emptyMsg="All products are already linked."
                  renderItem={p => (
                    <div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{p.category} · {p.type}</div>
                    </div>
                  )}
                />
              )}

              {linkedProducts.length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <Package size={32} style={{ color: 'var(--muted-foreground)' }} />
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No products linked</span>
                  <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Link benefits and services relevant to this persona.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 40px', padding: '8px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                    {['Product', 'Category', 'Type', ''].map(h => (
                      <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                    ))}
                  </div>
                  {linkedProducts.map((product, idx) => (
                    <div
                      key={product.id}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 140px 90px 40px', padding: '10px 14px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        {product.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.category}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', height: '20px', padding: '0 8px', borderRadius: '100px', background: product.type === 'Benefit' ? '#E8F5EE' : '#E0F5F5', color: product.type === 'Benefit' ? '#1C8A45' : '#00A3A3', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>
                        {product.type === 'Benefit' ? <Heart size={9} /> : <Briefcase size={9} />}
                        {product.type}
                      </span>
                      <button onClick={() => handleUnlinkProduct(product.id)} title="Remove link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--destructive)', cursor: 'pointer' }}
                        onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(192,57,43,0.08)')}
                        onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                      ><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <PersonaFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEdit}
        editingPersona={persona}
      />

      {/* Delete confirm */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          title="Delete Persona"
          message={<>Are you sure you want to delete <strong style={{ color: 'var(--foreground)' }}>{persona.name}</strong>? This cannot be undone.</>}
          confirmLabel="Delete Persona"
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
