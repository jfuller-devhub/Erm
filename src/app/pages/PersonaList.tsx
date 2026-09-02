import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, X, Users, CheckCircle, Building2, FileEdit, ChevronRight } from 'lucide-react';
import { KPITile } from '../components/shared/KPITile';
import { PersonaFormModal } from '../components/personas/PersonaFormModal';
import type { Persona, PersonaStatus } from '../data/personaData';
import { loadPersonas, savePersonas } from '../data/personaData';

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
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: s.bg, color: s.color,
      fontFamily: 'var(--font-family-primary)', fontSize: '12px',
      fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

// ─── Category chip ────────────────────────────────────────────────────────────

function CategoryChip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px',
      borderRadius: '100px', background: 'var(--muted)', border: '1px solid var(--border)',
      fontFamily: 'var(--font-family-primary)', fontSize: '11px', color: 'var(--muted-foreground)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PersonaList() {
  const navigate = useNavigate();
  const [personas, setPersonas]           = useState<Persona[]>([]);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState<'all' | PersonaStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [modalOpen, setModalOpen]         = useState(false);

  useEffect(() => { setPersonas(loadPersonas()); }, []);

  function handleSave(saved: Persona) {
    setPersonas(loadPersonas());
  }

  // ─── KPIs ────────────────────────────────────────────────────────────────
  const total      = personas.length;
  const active     = personas.filter(p => p.status === 'Active').length;
  const withEntity = personas.filter(p => p.entityIds.length > 0).length;
  const draft      = personas.filter(p => p.status === 'Draft').length;

  const allCategories = useMemo(
    () => ['all', ...Array.from(new Set(personas.map(p => p.category))).sort()],
    [personas],
  );

  // ─── Filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return personas.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (q) return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
      return true;
    });
  }, [personas, search, statusFilter, categoryFilter]);

  const btnBase: React.CSSProperties = {
    height: '36px', display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '0 14px', border: 'none', borderRadius: 'var(--radius-button)',
    fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    height: '28px', padding: '0 10px', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-button)',
    background: active ? 'var(--primary)' : 'var(--card)',
    color: active ? 'var(--primary-foreground)' : 'var(--foreground)',
    fontFamily: 'var(--font-family-primary)', fontSize: '12px',
    fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '22px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0, lineHeight: '30px' }}>
            Persona Register
          </h1>
          <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
            Define and manage the customer personas your benefit programs serve.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{ ...btnBase, background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} /> New Persona
        </button>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        <KPITile label="Total Personas"    value={total}      icon={Users}       accent />
        <KPITile label="Active"            value={active}     icon={CheckCircle} iconColor="#1C8A45" />
        <KPITile label="Linked to Entities" value={withEntity} icon={Building2}   iconColor="#2322F0" />
        <KPITile label="Draft"             value={draft}      icon={FileEdit}    iconColor="#E07B00" />
      </div>

      {/* Filter / search bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search personas…"
            style={{
              width: '100%', height: '36px', paddingLeft: '32px', paddingRight: search ? '32px' : '10px',
              border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-input)', background: 'var(--input-background)',
              color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)' }}>Status:</span>
          {(['all', 'Active', 'Draft', 'Inactive'] as const).map(f => (
            <button key={f} style={filterBtnStyle(statusFilter === f)} onClick={() => setStatusFilter(f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Category filter — show only if 2+ categories */}
        {allCategories.length > 2 && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)' }}>Category:</span>
            {allCategories.map(cat => (
              <button key={cat} style={filterBtnStyle(categoryFilter === cat)} onClick={() => setCategoryFilter(cat)}>
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Persona card grid */}
      {filtered.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Users size={40} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            {search || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No personas match your filters' : 'No personas yet'}
          </div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
            {search || statusFilter !== 'all' || categoryFilter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Click "New Persona" to define your first persona.'}
          </div>
          {!search && statusFilter === 'all' && categoryFilter === 'all' && (
            <button onClick={() => setModalOpen(true)} style={{ ...btnBase, marginTop: '4px', background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              <Plus size={14} /> New Persona
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {filtered.map(persona => (
            <PersonaCard key={persona.id} persona={persona} onClick={() => navigate(`/personas/${persona.id}`)} />
          ))}
        </div>
      )}

      <PersonaFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Persona card ─────────────────────────────────────────────────────────────

function PersonaCard({ persona, onClick }: { persona: Persona; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)',
        padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--primary)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-md, 0 4px 12px rgba(0,0,0,0.10))';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '15px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', lineHeight: '20px' }}>
            {persona.name}
          </div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            {persona.id} · {persona.category}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <StatusBadge status={persona.status} />
          <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
        </div>
      </div>

      {/* Description */}
      {persona.description && (
        <p style={{ margin: 0, fontFamily: 'var(--font-family-primary)', fontSize: '13px', color: 'var(--muted-foreground)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
          {persona.description}
        </p>
      )}

      {/* Footer: entity count + product count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Building2 size={12} style={{ color: 'var(--muted-foreground)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            {persona.entityIds.length} {persona.entityIds.length === 1 ? 'entity' : 'entities'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Users size={12} style={{ color: 'var(--muted-foreground)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            {persona.productIds.length} {persona.productIds.length === 1 ? 'product' : 'products'}
          </span>
        </div>
        {persona.tags.length > 0 && (
          <div style={{ flex: 1, display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {persona.tags.slice(0, 2).map(tag => (
              <CategoryChip key={tag} label={tag} />
            ))}
            {persona.tags.length > 2 && (
              <CategoryChip label={`+${persona.tags.length - 2}`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

