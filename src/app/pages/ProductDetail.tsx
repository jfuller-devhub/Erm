import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Package, Heart, Briefcase, Tag,
  Plus, ChevronRight, ChevronDown, CalendarDays, User, CheckCircle,
  Activity, GitBranch, X,
} from 'lucide-react';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { PlanFormModal } from '../components/plans/PlanFormModal';
import type { Product, ProductType, ProductStatus } from '../data/productData';
import { loadProducts, saveProducts } from '../data/productData';
import type { Plan, PlanStatus } from '../data/planData';
import { loadPlans } from '../data/planData';
import type { Persona } from '../data/personaData';
import { loadPersonas } from '../data/personaData';
import type { Process, SubProcess } from '../data/processData';
import { loadProcesses } from '../data/processData';
import { formatDate } from '../data/mockData';

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ProductStatus, { background: string; color: string }> = {
  Active:  { background: '#E8F5EE', color: '#1C8A45' },
  Draft:   { background: '#FFF3E0', color: '#E07B00' },
  Retired: { background: '#F0F0F0', color: '#6B7489' },
  Sunset:  { background: '#FDE8E8', color: '#C0392B' },
};

function ProductStatusBadge({ status }: { status: ProductStatus }) {
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

// ─── Type badge ──────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ProductType, { background: string; color: string; icon: React.ElementType }> = {
  Benefit: { background: '#E8F5EE', color: '#1C8A45', icon: Heart },
  Service: { background: '#E0F5F5', color: '#00A3A3', icon: Briefcase },
};

function ProductTypeBadge({ type }: { type: ProductType }) {
  const s = TYPE_STYLES[type];
  const Icon = s.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height: '22px',
        padding: '0 10px',
        borderRadius: '100px',
        background: s.background,
        color: s.color,
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
      }}
    >
      <Icon size={11} />
      {type}
    </span>
  );
}

// ─── Plan status badge ────────────────────────────────────────────────────────

const PLAN_STATUS_STYLES: Record<string, { background: string; color: string }> = {
  Active:   { background: '#E8F5EE', color: '#1C8A45' },
  Draft:    { background: '#FFF3E0', color: '#E07B00' },
  Inactive: { background: '#F0F0F0', color: '#6B7489' },
  Archived: { background: '#FDE8E8', color: '#C0392B' },
};

function PlanStatusBadge({ status }: { status: PlanStatus }) {
  const style = PLAN_STATUS_STYLES[status] ?? PLAN_STATUS_STYLES.Inactive;
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
        fontSize: '11px',
        fontWeight: 'var(--font-weight-semibold)',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [activeTab, setActiveTab] = useState<'Plans' | 'Personas' | 'Processes'>('Plans');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
    setPlans(loadPlans());
    setAllPersonas(loadPersonas());
    setAllProcesses(loadProcesses());
  }, []);

  const product = products.find(p => p.id === id) ?? null;
  const productPlans = plans.filter(pl => pl.productId === id);
  const linkedPersonas = allPersonas.filter(per => per.productIds.includes(id ?? ''));

  const persistProducts = useCallback((updated: Product[]) => {
    setProducts(updated);
    saveProducts(updated);
  }, []);

  function patchProduct(changes: Partial<Product>) {
    if (!product) return;
    const updated = { ...product, ...changes };
    persistProducts(products.map(p => (p.id === updated.id ? updated : p)));
  }

  function handleSaveProduct(updated: Product) {
    persistProducts(products.map(p => (p.id === updated.id ? updated : p)));
    setEditModalOpen(false);
  }

  function handleDelete() {
    if (!id) return;
    persistProducts(products.filter(p => p.id !== id));
    navigate('/products');
  }

  function handlePlanSaved(plan: Plan) {
    setPlans(loadPlans());
    setShowNewPlan(false);
    setEditingPlan(null);
  }

  // ─── Not Found ─────────────────────────────────────────────────────────
  if (products.length > 0 && !product) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <Package size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          Product not found
        </h2>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0 }}>
          This product may have been deleted or the URL is invalid.
        </p>
        <button
          onClick={() => navigate('/products')}
          style={{
            height: '36px', padding: '0 16px', border: 'none',
            borderRadius: 'var(--radius-button)', background: 'var(--primary)',
            color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
          }}
        >
          Back to Products Register
        </button>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ─── Breadcrumb + back ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => navigate('/products')}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', padding: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}
        >
          <ArrowLeft size={14} /> Products Register
        </button>
        <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)', fontWeight: 'var(--font-weight-semibold)' }}>
          {product.name}
        </span>
      </div>

      {/* ─── Header card ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                {product.name}
              </h1>
              <ProductStatusBadge status={product.status} />
              <ProductTypeBadge type={product.type} />
            </div>
            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
              {product.id} &middot; {product.category}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '32px', padding: '0 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                background: 'transparent', color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '32px', padding: '0 12px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-button)',
                background: 'transparent', color: 'var(--muted-foreground)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--destructive)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
              margin: 0,
              lineHeight: '22px',
            }}
          >
            {product.description}
          </p>
        )}

        {/* Metadata row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
          {product.owner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>Owner:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'var(--primary)', color: 'var(--primary-foreground)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-family-primary)', fontSize: '8px',
                  fontWeight: 'var(--font-weight-semibold)',
                }}>
                  {product.owner.initials}
                </div>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {product.owner.name}
                </span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CalendarDays size={13} style={{ color: 'var(--muted-foreground)' }} />
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>Updated:</span>
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)' }}>{formatDate(product.updatedDate)}</span>
          </div>
          {product.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <Tag size={13} style={{ color: 'var(--muted-foreground)' }} />
              {product.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    height: '18px', padding: '0 8px',
                    border: '1px solid var(--border)', borderRadius: '100px',
                    fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                    color: 'var(--muted-foreground)', display: 'inline-flex', alignItems: 'center',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Tab Nav ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {(['Plans', 'Personas', 'Processes'] as const).map(tab => {
          const count = tab === 'Plans' ? productPlans.length : tab === 'Personas' ? linkedPersonas.length : (product.processIds ?? []).length + (product.subProcessIds ?? []).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                height: '40px', padding: '0 16px', border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: activeTab === tab ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                cursor: 'pointer', transition: 'color 0.1s, border-color 0.1s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab}
              {count > 0 && (
                <span style={{
                  marginLeft: '6px', fontFamily: 'var(--font-family-primary)', fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px', padding: '1px 7px',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Tab: Plans ───────────────────────────────────────────────────── */}
      {activeTab === 'Plans' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden' }}>
          {/* Section toolbar */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>Plans</span>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '100px', padding: '1px 8px', lineHeight: '18px' }}>
                {productPlans.length}
              </span>
            </div>
            <button
              onClick={() => { setEditingPlan(null); setShowNewPlan(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <Plus size={14} /> New Plan
            </button>
          </div>

          {productPlans.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Package size={40} style={{ color: 'var(--muted-foreground)' }} />
              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No plans yet</div>
              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Create the first plan for this product.</div>
              <button
                onClick={() => { setEditingPlan(null); setShowNewPlan(true); }}
                style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <Plus size={14} /> New Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {productPlans.map((plan, idx) => (
                <div
                  key={plan.id}
                  style={{ borderBottom: idx < productPlans.length - 1 ? '1px solid var(--border)' : 'none', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', transition: 'background 0.1s' }}
                  onClick={() => navigate(`/plans/${plan.id}`)}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)' }}>{plan.name}</span>
                      <PlanStatusBadge status={plan.status} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                      {plan.id}{plan.effectiveStartDate && ` · From ${formatDate(plan.effectiveStartDate)}`}{plan.effectiveEndDate && ` to ${formatDate(plan.effectiveEndDate)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setEditingPlan(plan); setShowNewPlan(true); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <Edit2 size={13} />
                  </button>
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Personas ────────────────────────────────────────────────── */}
      {activeTab === 'Personas' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '15px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', marginBottom: '2px' }}>Personas</div>
              <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{linkedPersonas.length} {linkedPersonas.length === 1 ? 'persona' : 'personas'} associated with this product</div>
            </div>
            <button
              onClick={() => navigate('/personas')}
              style={{ height: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', cursor: 'pointer', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--card)')}
            >
              Manage in Persona Register
            </button>
          </div>

          {linkedPersonas.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--muted)', borderRadius: 'var(--radius-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <User size={28} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No personas linked</span>
              <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Link this product to personas in the Persona Register.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px', padding: '8px 14px', background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                {['Persona', 'Category', 'Status'].map(h => (
                  <span key={h} style={{ fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                ))}
              </div>
              {linkedPersonas.map((per, idx) => {
                const sc = per.status === 'Active' ? { bg: '#E8F5EE', color: '#1C8A45' } : per.status === 'Draft' ? { bg: '#FFF3E0', color: '#E07B00' } : { bg: '#F0F0F0', color: '#6B7489' };
                return (
                  <div
                    key={per.id}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px', padding: '10px 14px', alignItems: 'center', borderTop: idx > 0 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => navigate(`/personas/${per.id}`)}
                  >
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{per.name}</span>
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{per.category}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 7px', borderRadius: '100px', background: sc.bg, color: sc.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap' }}>{per.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Processes ───────────────────────────────────────────────── */}
      {activeTab === 'Processes' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden' }}>
          <ProductProcessesTab
            product={product}
            allProcesses={allProcesses}
            onPatch={patchProduct}
            navigate={navigate}
          />
        </div>
      )}

      {/* ─── Edit Product Modal ───────────────────────────────────────────── */}
      <ProductFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveProduct}
        editingProduct={product}
      />

      {/* ─── Plan Form Modal ──────────────────────────────────────────────── */}
      <PlanFormModal
        isOpen={showNewPlan}
        onClose={() => { setShowNewPlan(false); setEditingPlan(null); }}
        onSave={handlePlanSaved}
        editingPlan={editingPlan ?? undefined}
        defaultProductId={product.id}
      />

      {/* ─── Delete Confirm ───────────────────────────────────────────────── */}
      {deleteConfirmOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)',
              width: '100%', maxWidth: '420px', padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '16px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
              Delete Product
            </h3>
            <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '22px' }}>
              Are you sure you want to delete <strong style={{ color: 'var(--foreground)' }}>{product.name}</strong>?
              Plans within this product will not be deleted. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                style={{
                  height: '36px', padding: '0 16px', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)', background: 'transparent',
                  color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  height: '36px', padding: '0 16px', border: 'none',
                  borderRadius: 'var(--radius-button)', background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)', fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
                  transition: 'opacity 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
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

// ─── Product Processes Tab ────────────────────────────────────────────────────

type ProcessAssoc =
  | { kind: 'process';    process: Process }
  | { kind: 'subprocess'; subprocess: SubProcess; process: Process };

function procStatusStyle(status: string) {
  if (status === 'Active') return { bg: '#E8F5EE', color: '#1C8A45' };
  if (status === 'Draft')  return { bg: '#FFF3E0', color: '#E07B00' };
  return { bg: '#F0F0F0', color: '#6B7489' };
}

function ProductProcessesTab({
  product, allProcesses, onPatch, navigate,
}: {
  product: Product;
  allProcesses: Process[];
  onPatch: (changes: Partial<Product>) => void;
  navigate: (path: string) => void;
}) {
  const [showAddPicker,  setShowAddPicker]  = useState(false);
  const [expandedProcId, setExpandedProcId] = useState<string | null>(null);
  const [deletingAssoc,  setDeletingAssoc]  = useState<ProcessAssoc | null>(null);

  const processIds    = product.processIds    ?? [];
  const subProcessIds = product.subProcessIds ?? [];

  const resolved: ProcessAssoc[] = [
    ...allProcesses
      .filter(p => processIds.includes(p.id))
      .map(p => ({ kind: 'process' as const, process: p })),
    ...subProcessIds
      .map(sid => {
        for (const proc of allProcesses) {
          const sub = proc.subProcesses.find(s => s.id === sid);
          if (sub) return { kind: 'subprocess' as const, subprocess: sub, process: proc };
        }
        return null;
      })
      .filter((r): r is { kind: 'subprocess'; subprocess: SubProcess; process: Process } => r !== null),
  ];

  function handleLinkProcess(procId: string) {
    if (processIds.includes(procId)) return;
    onPatch({ processIds: [...processIds, procId] });
  }

  function handleLinkSubProcess(subId: string) {
    if (subProcessIds.includes(subId)) return;
    onPatch({ subProcessIds: [...subProcessIds, subId] });
  }

  function handleRemove(assoc: ProcessAssoc) {
    if (assoc.kind === 'process') {
      const procSubIds = assoc.process.subProcesses.map(s => s.id);
      onPatch({
        processIds: processIds.filter(id => id !== assoc.process.id),
        subProcessIds: subProcessIds.filter(id => !procSubIds.includes(id)),
      });
    } else {
      onPatch({ subProcessIds: subProcessIds.filter(id => id !== assoc.subprocess.id) });
    }
    setDeletingAssoc(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Toolbar */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
            Linked Processes
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
          <Plus size={14} /> Add Process
        </button>
      </div>

      {/* Picker panel */}
      {showAddPicker && (
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Select a Process or Sub-Process to Associate
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', maxHeight: '280px', overflowY: 'auto' }}>
            {allProcesses.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>No processes available.</div>
            ) : allProcesses.map(proc => {
              const hasSubs   = proc.subProcesses.length > 0;
              const isExp     = expandedProcId === proc.id;
              const procLinked = processIds.includes(proc.id);
              const ps        = procStatusStyle(proc.status);

              return (
                <div key={proc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                    {hasSubs ? (
                      <button type="button" onClick={() => setExpandedProcId(isExp ? null : proc.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--muted-foreground)', flexShrink: 0 }}>
                        {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : <span style={{ width: '14px', flexShrink: 0 }} />}
                    <Activity size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{proc.name}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 6px', borderRadius: '100px', background: ps.bg, color: ps.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>{proc.status}</span>
                    <button type="button" disabled={procLinked} onClick={() => handleLinkProcess(proc.id)}
                      style={{ height: '24px', padding: '0 10px', border: `1px solid ${procLinked ? 'var(--border)' : 'var(--primary)'}`, borderRadius: 'var(--radius-button)', background: procLinked ? 'var(--muted)' : 'transparent', color: procLinked ? 'var(--muted-foreground)' : 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: procLinked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      {procLinked ? 'Linked' : <><Plus size={10} /> Add</>}
                    </button>
                  </div>
                  {isExp && hasSubs && (
                    <div style={{ paddingLeft: '36px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                      {proc.subProcesses.map(sub => {
                        const subLinked = subProcessIds.includes(sub.id);
                        return (
                          <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                            <GitBranch size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                            <span style={{ flex: 1, fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)' }}>{sub.name}</span>
                            <button type="button" disabled={subLinked} onClick={() => handleLinkSubProcess(sub.id)}
                              style={{ height: '22px', padding: '0 8px', border: `1px solid ${subLinked ? 'var(--border)' : 'var(--primary)'}`, borderRadius: 'var(--radius-button)', background: subLinked ? 'var(--muted)' : 'transparent', color: subLinked ? 'var(--muted-foreground)' : 'var(--primary)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: subLinked ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                              {subLinked ? 'Linked' : <><Plus size={9} /> Add</>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowAddPicker(false); setExpandedProcId(null); }}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'var(--card)', color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Association cards */}
      {resolved.length === 0 && !showAddPicker ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Activity size={40} style={{ color: 'var(--muted-foreground)' }} />
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No processes linked</div>
          <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Associate this product with processes or specific sub-processes.</div>
          <button onClick={() => setShowAddPicker(true)}
            style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}>
            <Plus size={14} /> Add Process
          </button>
        </div>
      ) : resolved.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
          {resolved.map((item, idx) => {
            const isFirst = idx === 0;
            const isLast  = idx === resolved.length - 1;
            const radius  = isFirst && isLast ? 'var(--radius-card)' : isFirst ? 'var(--radius-card) var(--radius-card) 0 0' : isLast ? '0 0 var(--radius-card) var(--radius-card)' : '0';
            const key     = item.kind === 'process' ? `proc-${item.process.id}` : `sub-${item.subprocess.id}`;
            const ps      = procStatusStyle(item.process.status);

            return (
              <div key={key}
                style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderBottom: isLast ? '1px solid var(--border)' : 'none', borderRadius: radius, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--card)'; }}>
                <Activity size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <button type="button" onClick={() => navigate(`/processes/${item.process.id}`)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.process.name}
                </button>
                {item.kind === 'subprocess' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <GitBranch size={11} style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--foreground)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subprocess.name}</span>
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', padding: '0 8px', borderRadius: '100px', background: ps.bg, color: ps.color, fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', flexShrink: 0 }}>{item.process.status}</span>
                <span style={{ flex: 1 }} />
                <button type="button" onClick={() => setDeletingAssoc(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px', padding: '0 8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', background: 'transparent', color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; }}>
                  <X size={10} /> Unlink
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Delete confirm */}
      {deletingAssoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeletingAssoc(null); }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: '0px 8px 32px 0px rgba(0,0,0,0.18)', width: '100%', maxWidth: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>Remove Association</h3>
            <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)', margin: 0, lineHeight: '22px' }}>
              {deletingAssoc.kind === 'process'
                ? <>Remove the link to <strong style={{ color: 'var(--foreground)' }}>{deletingAssoc.process.name}</strong>? Any sub-process links under this process will also be removed.</>
                : <>Remove the sub-process link to <strong style={{ color: 'var(--foreground)' }}>{deletingAssoc.subprocess.name}</strong>?</>}
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
