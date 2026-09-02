import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Package, Heart, Briefcase, Tag,
  Plus, ChevronRight, CalendarDays, User, CheckCircle, Search, X,
} from 'lucide-react';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { PlanFormModal } from '../components/plans/PlanFormModal';
import type { Product, ProductType, ProductStatus } from '../data/productData';
import { loadProducts, saveProducts } from '../data/productData';
import type { Plan, PlanStatus } from '../data/planData';
import { loadPlans } from '../data/planData';
import type { Employer } from '../data/employerData';
import { loadEmployers, saveEmployers } from '../data/employerData';
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
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employerSearch, setEmployerSearch] = useState('');
  const [showEmpLink, setShowEmpLink] = useState(false);
  const [empLinkSearch, setEmpLinkSearch] = useState('');

  useEffect(() => {
    setProducts(loadProducts());
    setPlans(loadPlans());
    setEmployers(loadEmployers());
  }, []);

  const product = products.find(p => p.id === id) ?? null;
  const productPlans = plans.filter(pl => pl.productId === id);

  const persistProducts = useCallback((updated: Product[]) => {
    setProducts(updated);
    saveProducts(updated);
  }, []);

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

  function handleLinkEmployer(employerId: string) {
    if (!id) return;
    const updated = employers.map(e =>
      e.id === employerId && !e.productIds.includes(id)
        ? { ...e, productIds: [...e.productIds, id], modifiedAt: new Date().toISOString().split('T')[0], modifiedBy: 'Admin' }
        : e,
    );
    setEmployers(updated);
    saveEmployers(updated);
    setEmpLinkSearch('');
    setShowEmpLink(false);
  }

  function handleUnlinkEmployer(employerId: string) {
    if (!id) return;
    const updated = employers.map(e =>
      e.id === employerId
        ? { ...e, productIds: e.productIds.filter(pid => pid !== id), modifiedAt: new Date().toISOString().split('T')[0], modifiedBy: 'Admin' }
        : e,
    );
    setEmployers(updated);
    saveEmployers(updated);
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

      {/* ─── Plans Section ────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Section toolbar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
              Plans
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                background: 'var(--muted)', border: '1px solid var(--border)',
                borderRadius: '100px', padding: '1px 8px', lineHeight: '18px',
              }}
            >
              {productPlans.length}
            </span>
          </div>
          <button
            onClick={() => { setEditingPlan(null); setShowNewPlan(true); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              height: '32px', padding: '0 12px', border: 'none',
              borderRadius: 'var(--radius-button)', background: 'var(--primary)',
              color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> New Plan
          </button>
        </div>

        {/* Plan rows */}
        {productPlans.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}
          >
            <Package size={40} style={{ color: 'var(--muted-foreground)' }} />
            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
              No plans yet
            </div>
            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
              Create the first plan for this product.
            </div>
            <button
              onClick={() => { setEditingPlan(null); setShowNewPlan(true); }}
              style={{
                marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 16px', border: 'none',
                borderRadius: 'var(--radius-button)', background: 'var(--primary)',
                color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer',
              }}
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
                style={{
                  borderBottom: idx < productPlans.length - 1 ? '1px solid var(--border)' : 'none',
                  padding: '12px 20px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer', transition: 'background 0.1s',
                }}
                onClick={() => navigate(`/plans/${plan.id}`)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)',
                      }}
                    >
                      {plan.name}
                    </span>
                    <PlanStatusBadge status={plan.status} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                    {plan.id}
                    {plan.effectiveStartDate && ` · From ${formatDate(plan.effectiveStartDate)}`}
                    {plan.effectiveEndDate && ` to ${formatDate(plan.effectiveEndDate)}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setEditingPlan(plan); setShowNewPlan(true); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '28px', height: '28px', border: 'none',
                    borderRadius: 'var(--radius-input)', background: 'transparent',
                    color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0,
                    flexShrink: 0,
                  }}
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

      {/* ─── Employers Section ───────────────────────────────────────────── */}
      {(() => {
        const linkedEmployers = employers.filter(e => (e.productIds ?? []).includes(id ?? ''));
        const linkedIds = new Set(linkedEmployers.map(e => e.id));
        const filteredLinked = linkedEmployers.filter(e =>
          !employerSearch || e.name.toLowerCase().includes(employerSearch.toLowerCase()),
        );
        const linkableEmployers = employers.filter(e =>
          !linkedIds.has(e.id) &&
          (!empLinkSearch || e.name.toLowerCase().includes(empLinkSearch.toLowerCase())),
        );

        return (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--elevation-sm)', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>
                  Employers
                </span>
                <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '100px', padding: '1px 8px', lineHeight: '18px' }}>
                  {linkedEmployers.length}
                </span>
              </div>
              <button
                onClick={() => { setShowEmpLink(p => !p); setEmpLinkSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 12px', border: 'none', borderRadius: 'var(--radius-button)', background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <Plus size={14} /> Link Employer
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Inline link picker */}
              {showEmpLink && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', background: 'var(--card)', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--muted)' }}>
                    <Search size={13} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                    <input
                      autoFocus
                      value={empLinkSearch}
                      onChange={e => setEmpLinkSearch(e.target.value)}
                      placeholder="Search employers to link..."
                      style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}
                    />
                    <button
                      onClick={() => setShowEmpLink(false)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', border: 'none', borderRadius: '4px', background: 'transparent', cursor: 'pointer', color: 'var(--muted-foreground)' }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                  {linkableEmployers.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
                      {empLinkSearch ? 'No matching employers.' : 'All employers are already linked.'}
                    </div>
                  ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {linkableEmployers.map(e => (
                        <div
                          key={e.id}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                          onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--muted)')}
                          onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                          onClick={() => handleLinkEmployer(e.id)}
                        >
                          <div>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>{e.name}</div>
                            <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>{e.code} · {e.isActive ? 'Active' : 'Inactive'}</div>
                          </div>
                          <Plus size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Filter for long lists */}
              {linkedEmployers.length > 5 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', borderRadius: 'var(--radius-input)', padding: '5px 10px', background: 'var(--card)' }}>
                  <Search size={13} style={{ color: 'var(--muted-foreground)' }} />
                  <input
                    value={employerSearch}
                    onChange={e => setEmployerSearch(e.target.value)}
                    placeholder="Filter employers..."
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}
                  />
                </div>
              )}

              {/* Employer list */}
              {linkedEmployers.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={36} style={{ color: 'var(--muted-foreground)' }} />
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)' }}>No employers linked</div>
                  <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>Click "Link Employer" to associate employers with this product.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredLinked.map((e, idx) => (
                    <div
                      key={e.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: idx < filteredLinked.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onClick={() => navigate(`/employers/${e.id}`)}
                          >
                            {e.name}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', height: '18px', padding: '0 7px', borderRadius: '100px', background: e.isActive ? '#E8F5EE' : '#F0F2F7', color: e.isActive ? '#1C8A45' : '#6B7489', fontFamily: 'var(--font-family-primary)', fontSize: '11px', fontWeight: 'var(--font-weight-semibold)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {e.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '1px' }}>{e.code}</div>
                      </div>
                      <button
                        title="Remove employer link"
                        onClick={() => handleUnlinkEmployer(e.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: 'none', borderRadius: 'var(--radius-input)', background: 'transparent', color: 'var(--muted-foreground)', cursor: 'pointer', flexShrink: 0 }}
                        onMouseEnter={ev => { ev.currentTarget.style.background = 'rgba(192,57,43,0.08)'; ev.currentTarget.style.color = 'var(--destructive)'; }}
                        onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = 'var(--muted-foreground)'; }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
