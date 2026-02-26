import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Edit2, Trash2, Package, Heart, Briefcase, Tag,
  ArrowRight, Activity, GitBranch, Plus, ChevronDown, ChevronRight,
  Building2, X, Search, Map, CheckCircle2,
} from 'lucide-react';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { RichTextEditor } from '../components/shared/RichTextEditor';
import type { Product, ProductType, ProductStatus } from '../data/productData';
import { loadProducts, saveProducts } from '../data/productData';
import type { Process } from '../data/processData';
import { loadProcesses } from '../data/processData';
import { formatDate } from '../data/mockData';
import type { Vendor } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { syncProductVendorLinks, removeProductFromAllVendors } from '../data/syncUtils';

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

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Roadmap', 'Associated Processes', 'Associated Vendors'] as const;
type TabKey = typeof TABS[number];

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors, updateVendor } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('Overview');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setProducts(loadProducts());
    setProcesses(loadProcesses());
  }, []);

  const product = products.find(p => p.id === id) ?? null;

  const persist = useCallback((updated: Product[]) => {
    setProducts(updated);
    saveProducts(updated);
  }, []);

  function handleSave(updated: Product) {
    const existing = products.find(p => p.id === updated.id);
    const oldVendorIds = existing?.vendorIds ?? [];
    const newVendorIds = updated.vendorIds ?? [];
    persist(products.map(p => (p.id === updated.id ? updated : p)));
    // Bidirectional sync: update vendor productIds in AppContext
    syncProductVendorLinks(updated.id, newVendorIds, oldVendorIds, vendors, updateVendor);
  }

  function handleDelete() {
    if (!id) return;
    // Sync: remove this product from all vendors before deleting
    removeProductFromAllVendors(id, vendors, updateVendor);
    persist(products.filter(p => p.id !== id));
    navigate('/products');
  }

  // ─── Not Found ─────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <Package size={48} style={{ color: 'var(--muted-foreground)' }} />
        <h2 style={{ fontFamily: 'var(--font-family-primary)', fontSize: '14px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
          Benefit or Service not found
        </h2>
        <p style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)', margin: 0 }}>
          This benefit or service may have been deleted or the URL is invalid.
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
          Back to Benefits or Services Registry
        </button>
      </div>
    );
  }

  // Resolve associated processes
  const resolvedAssociations = product.processAssociations.map(assoc => {
    const proc = processes.find(p => p.id === assoc.processId);
    const sub = assoc.subProcessId
      ? (proc?.subProcesses ?? []).find(sp => sp.id === assoc.subProcessId)
      : null;
    return { assoc, proc, sub };
  }).filter(a => a.proc);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── Back link ──────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/products')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--primary)',
        }}
      >
        <ArrowLeft size={14} />
        Back to Benefits or Services Registry
      </button>

      {/* ─── Record Summary Header ──────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Left: Name + badges + description */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
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
                {product.name}
              </h2>
              <ProductTypeBadge type={product.type} />
              <ProductStatusBadge status={product.status} />
            </div>
            {product.description && (
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 8px 0',
                  lineHeight: '22px',
                }}
              >
                {product.description}
              </p>
            )}
            {/* Tags */}
            {product.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(35,34,240,0.08)',
                      color: 'var(--primary)',
                      borderRadius: '100px',
                      padding: '2px 8px',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    <Tag size={9} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: Actions (primary right-aligned) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                height: '36px', padding: '0 16px',
                border: '1px solid var(--destructive)',
                borderRadius: 'var(--radius-button)',
                background: 'transparent',
                color: 'var(--destructive)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                height: '36px', padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <Edit2 size={14} />
              Edit Benefit or Service
            </button>
          </div>
        </div>

        {/* Key metadata */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
          <MetadataChip label="Category" value={product.category} />
          {product.owner && <MetadataChip label="Owner" value={product.owner.name} />}
          {product.effectiveStartDate && (
            <MetadataChip
              label="Effective"
              value={`${formatDate(product.effectiveStartDate)}${product.effectiveEndDate ? ' – ' + formatDate(product.effectiveEndDate) : ''}`}
            />
          )}
          <MetadataChip label="Processes" value={String(resolvedAssociations.length)} />
          <MetadataChip label="Vendors" value={String(product.vendorIds.length)} />
          <MetadataChip label="Last Updated" value={formatDate(product.updatedDate)} />
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          borderBottom: '1px solid var(--border)',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              height: '40px',
              padding: '0 16px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: activeTab === tab ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'color 0.1s, border-color 0.1s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab === 'Roadmap' && <Map size={13} />}
            {tab}
            {tab === 'Associated Processes' && resolvedAssociations.length > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                }}
              >
                {resolvedAssociations.length}
              </span>
            )}
            {tab === 'Associated Vendors' && product.vendorIds.length > 0 && (
              <span
                style={{
                  marginLeft: '6px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
                  background: activeTab === tab ? 'rgba(35,34,240,0.08)' : 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 7px',
                }}
              >
                {product.vendorIds.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ───────────────────────────────────────────── */}
      {activeTab === 'Overview' && (
        <OverviewTab product={product} />
      )}

      {activeTab === 'Roadmap' && (
        <RoadmapTab product={product} onUpdateProduct={handleSave} />
      )}

      {activeTab === 'Associated Processes' && (
        <AssociatedProcessesTab
          product={product}
          resolvedAssociations={resolvedAssociations}
          allProcesses={processes}
          navigate={navigate}
          onUpdateProduct={handleSave}
        />
      )}

      {activeTab === 'Associated Vendors' && (
        <AssociatedVendorsTab
          product={product}
          vendors={vendors}
          navigate={navigate}
          onUpdateProduct={handleSave}
        />
      )}

      {/* ─── Edit Modal ─────────────────────────────────────────────── */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingProduct={product}
      />

      {/* ─── Delete Confirmation ─────────────────────────────────────── */}
      {deleteConfirmOpen && (
        <DeleteConfirmDialog
          productName={product.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ product }: { product: Product }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Description card */}
      {product.description && (
        <ReadOnlyCard label="Description" value={product.description} />
      )}

      {/* Key fields */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <ReadOnlyCard label="Benefit or Service ID" value={product.id} />
        <ReadOnlyCard label="Type" value={product.type} />
        <ReadOnlyCard label="Category" value={product.category} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <ReadOnlyCard label="Status" value={product.status} />
        <ReadOnlyCard label="Benefit or Service Owner" value={product.owner ? product.owner.name : '—'} />
        <ReadOnlyCard label="Created" value={formatDate(product.createdDate)} />
      </div>

      {/* Effective dates */}
      {(product.effectiveStartDate || product.effectiveEndDate) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}
        >
          <ReadOnlyCard label="Effective Start Date" value={product.effectiveStartDate ? formatDate(product.effectiveStartDate) : '—'} />
          <ReadOnlyCard label="Effective End Date" value={product.effectiveEndDate ? formatDate(product.effectiveEndDate) : '—'} />
        </div>
      )}
    </div>
  );
}

// ─── Roadmap Tab ─────────────────────────────────────────────────────────────

const ROADMAP_FIELDS: {
  key: keyof Pick<Product,
    'roadmapPurposeAlignment' | 'roadmapPlanning' | 'roadmapProtection' |
    'roadmapPriceCompetitiveness' | 'roadmapPerformanceMeasurement' |
    'roadmapParticipantExperience'>;
  label: string;
  helpText: string;
  placeholder: string;
}[] = [
  {
    key: 'roadmapPurposeAlignment',
    label: 'Purpose Alignment',
    helpText: 'Describe how this benefit or service aligns with organizational mission, strategy, and employee value proposition.',
    placeholder: 'Describe the strategic purpose and alignment for this benefit or service…',
  },
  {
    key: 'roadmapPlanning',
    label: 'Planning (3–5 Year)',
    helpText: 'Outline the 3–5 year roadmap including planned enhancements, transitions, or lifecycle milestones.',
    placeholder: 'Describe the 3–5 year planning horizon, milestones, and initiatives…',
  },
  {
    key: 'roadmapProtection',
    label: 'Protection (Regulatory or Legal Considerations)',
    helpText: 'Document applicable regulatory requirements, legal obligations, compliance mandates, and risk mitigation measures.',
    placeholder: 'Describe regulatory requirements, legal considerations, and compliance obligations…',
  },
  {
    key: 'roadmapPriceCompetitiveness',
    label: 'Price Competitiveness',
    helpText: 'Assess market competitiveness, cost benchmarking, and value relative to peer organizations and industry benchmarks.',
    placeholder: 'Describe pricing strategy, cost benchmarks, and market competitiveness analysis…',
  },
  {
    key: 'roadmapPerformanceMeasurement',
    label: 'Performance Measurement (KPIs)',
    helpText: 'Define key performance indicators, success metrics, and measurement cadence for this benefit or service.',
    placeholder: 'Define KPIs, targets, data sources, and measurement frequency…',
  },
  {
    key: 'roadmapParticipantExperience',
    label: 'Participant Experience',
    helpText: 'Describe the end-to-end participant journey, touchpoints, satisfaction drivers, and initiatives to improve the member or employee experience.',
    placeholder: 'Describe the participant journey, key touchpoints, pain points, and planned experience improvements…',
  },
];

function RoadmapTab({
  product,
  onUpdateProduct,
}: {
  product: Product;
  onUpdateProduct: (updated: Product) => void;
}) {
  type DraftState = Pick<Product,
    'roadmapPurposeAlignment' | 'roadmapPlanning' | 'roadmapProtection' |
    'roadmapPriceCompetitiveness' | 'roadmapPerformanceMeasurement' |
    'roadmapParticipantExperience'>;

  function buildDraft(p: Product): DraftState {
    return {
      roadmapPurposeAlignment:       p.roadmapPurposeAlignment       ?? '',
      roadmapPlanning:               p.roadmapPlanning               ?? '',
      roadmapProtection:             p.roadmapProtection             ?? '',
      roadmapPriceCompetitiveness:   p.roadmapPriceCompetitiveness   ?? '',
      roadmapPerformanceMeasurement: p.roadmapPerformanceMeasurement ?? '',
      roadmapParticipantExperience:  p.roadmapParticipantExperience  ?? '',
    };
  }

  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState<DraftState>(() => buildDraft(product));
  const [saved, setSaved] = useState(false);

  // Keep draft in sync when navigating between records
  useEffect(() => {
    setDraft(buildDraft(product));
    setIsEditMode(false);
    setSaved(false);
  }, [product.id]);

  function handleEdit() {
    setDraft(buildDraft(product));
    setIsEditMode(true);
    setSaved(false);
  }

  function handleCancel() {
    setDraft(buildDraft(product));
    setIsEditMode(false);
  }

  function handleChange(key: keyof DraftState, html: string) {
    setDraft(prev => ({ ...prev, [key]: html }));
  }

  function handleSave() {
    onUpdateProduct({
      ...product,
      ...draft,
      updatedDate: new Date().toISOString(),
    });
    setIsEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  }

  // ── Shared header bar (read-only and edit mode share the same chrome) ──────
  const headerBar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '14px 20px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
        borderBottom: 'none',
        flexWrap: 'wrap',
      }}
    >
      {/* Left: icon + title + subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <Map size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              lineHeight: '20px',
            }}
          >
            Roadmap
          </div>
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              lineHeight: '18px',
            }}
          >
            Strategic planning, regulatory considerations, and performance measurement for this benefit or service.
          </div>
        </div>
      </div>

      {/* Right: saved badge + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {saved && !isEditMode && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              height: '28px',
              padding: '0 10px',
              borderRadius: '100px',
              background: '#E8F5EE',
              color: '#1C8A45',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              lineHeight: '16px',
            }}
          >
            <CheckCircle2 size={12} />
            Saved
          </div>
        )}

        {!isEditMode ? (
          /* ── Read-only: Edit button only ── */
          <button
            type="button"
            onClick={handleEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Edit2 size={13} />
            Edit Roadmap
          </button>
        ) : (
          /* ── Edit mode: Cancel (secondary) + Save (primary) ── */
          <>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <X size={13} />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
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
                transition: 'opacity 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
            >
              <CheckCircle2 size={13} />
              Save Roadmap
            </button>
          </>
        )}
      </div>
    </div>
  );

  // ── READ-ONLY VIEW ─────────────────────────────────────────────────────────
  if (!isEditMode) {
    const hasAnyContent = ROADMAP_FIELDS.some(f => {
      const v = product[f.key] ?? '';
      return v !== '' && v !== '<br>' && v !== '<div><br></div>';
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {headerBar}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
          }}
        >
          {!hasAnyContent ? (
            /* ── Empty state per Appian guidelines (48px icon, SM heading, MD body) ── */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '56px 24px',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <Map size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.35 }} />
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  lineHeight: '20px',
                }}
              >
                No roadmap content yet
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  lineHeight: '22px',
                  maxWidth: '400px',
                }}
              >
                Click{' '}
                <strong style={{ fontWeight: 'var(--font-weight-semibold)' }}>Edit Roadmap</strong>
                {' '}to add strategic planning, regulatory considerations, and performance measurement details.
              </div>
            </div>
          ) : (
            /* ── Populated: one row per field, separated by dividers ── */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ROADMAP_FIELDS.map((field, idx) => {
                const html = product[field.key] ?? '';
                const isEmpty = !html || html === '<br>' || html === '<div><br></div>';
                const isLast = idx === ROADMAP_FIELDS.length - 1;
                return (
                  <div
                    key={field.key}
                    style={{
                      padding: '20px 24px',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    {/* Label / SM — uppercase metadata label */}
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        lineHeight: '16px',
                        marginBottom: '8px',
                      }}
                    >
                      {field.label}
                    </div>

                    {isEmpty ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--muted-foreground)',
                          fontStyle: 'italic',
                          lineHeight: '22px',
                        }}
                      >
                        Not yet defined
                      </span>
                    ) : (
                      <div
                        className="rich-text-output"
                        dangerouslySetInnerHTML={{ __html: html }}
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--foreground)',
                          lineHeight: '22px',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── EDIT MODE VIEW ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {headerBar}

      {/* Edit context banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '9px 20px',
          background: 'rgba(0,102,204,0.05)',
          borderLeft: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid rgba(0,102,204,0.18)',
        }}
      >
        <Edit2 size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--primary)',
            lineHeight: '18px',
          }}
        >
          You are editing the Roadmap. Use the toolbar in each field to format text, then click{' '}
          <strong style={{ fontWeight: 'var(--font-weight-semibold)' }}>Save Roadmap</strong>{' '}
          to apply or{' '}
          <strong style={{ fontWeight: 'var(--font-weight-semibold)' }}>Cancel</strong>{' '}
          to discard.
        </span>
      </div>

      {/* Rich text fields */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-card) var(--radius-card)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        {ROADMAP_FIELDS.map(field => (
          <RichTextEditor
            key={field.key}
            label={field.label}
            helpText={field.helpText}
            placeholder={field.placeholder}
            value={draft[field.key]}
            onChange={html => handleChange(field.key, html)}
            minHeight={160}
          />
        ))}

        {/* Bottom action bar — right-aligned per Appian guidelines */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={handleCancel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={13} />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
              transition: 'opacity 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <CheckCircle2 size={13} />
            Save Roadmap
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Associated Processes Tab ────────────────────────────────────────────────

function AssociatedProcessesTab({
  product,
  resolvedAssociations,
  allProcesses,
  navigate,
  onUpdateProduct,
}: {
  product: Product;
  resolvedAssociations: { assoc: { processId: string; subProcessId?: string }; proc: Process | undefined; sub: any }[];
  allProcesses: Process[];
  navigate: (path: string) => void;
  onUpdateProduct: (updated: Product) => void;
}) {
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [expandedProcessId, setExpandedProcessId] = useState<string | null>(null);
  const [deletingAssoc, setDeletingAssoc] = useState<{ processId: string; subProcessId?: string } | null>(null);

  const associations = product.processAssociations;

  function handleAddAssociation(processId: string, subProcessId?: string) {
    const newAssoc = subProcessId ? { processId, subProcessId } : { processId };
    const exists = associations.some(
      a => a.processId === processId && (a.subProcessId ?? undefined) === (subProcessId ?? undefined)
    );
    if (exists) return;
    onUpdateProduct({
      ...product,
      processAssociations: [...associations, newAssoc],
      updatedDate: new Date().toISOString(),
    });
  }

  function handleRemoveAssociation(processId: string, subProcessId?: string) {
    onUpdateProduct({
      ...product,
      processAssociations: associations.filter(
        a => !(a.processId === processId && (a.subProcessId ?? undefined) === (subProcessId ?? undefined))
      ),
      updatedDate: new Date().toISOString(),
    });
    setDeletingAssoc(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--card)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
          border: '1px solid var(--border)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Linked Processes & Sub-Processes
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '1px 8px',
              lineHeight: '18px',
            }}
          >
            {resolvedAssociations.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddPicker(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '32px',
            padding: '0 12px',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Add Process
        </button>
      </div>

      {/* ─── Add Process Picker ─────────────────────────────── */}
      {showAddPicker && (
        <div
          style={{
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Select a Process or Sub-Process to Associate
          </div>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--card)',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {allProcesses.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                No processes available. Create processes in the Process Registry first.
              </div>
            ) : (
              allProcesses.map(proc => {
                const hasSubs = (proc.subProcesses ?? []).length > 0;
                const isExpanded = expandedProcessId === proc.id;
                const procLevelLinked = associations.some(a => a.processId === proc.id && !a.subProcessId);
                const statusColor = proc.status === 'Active' ? '#1C8A45' : proc.status === 'Draft' ? '#E07B00' : '#6B7489';
                const statusBg = proc.status === 'Active' ? '#E8F5EE' : proc.status === 'Draft' ? '#FFF3E0' : '#F0F0F0';

                return (
                  <div key={proc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => setExpandedProcessId(isExpanded ? null : proc.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color: 'var(--muted-foreground)',
                            flexShrink: 0,
                          }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      ) : (
                        <span style={{ width: '14px', flexShrink: 0 }} />
                      )}

                      <Activity size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {proc.name}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          height: '18px',
                          padding: '0 6px',
                          borderRadius: '100px',
                          background: statusBg,
                          color: statusColor,
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '11px',
                          fontWeight: 'var(--font-weight-semibold)',
                          flexShrink: 0,
                        }}
                      >
                        {proc.status}
                      </span>
                      <button
                        type="button"
                        disabled={procLevelLinked}
                        onClick={() => handleAddAssociation(proc.id)}
                        style={{
                          height: '24px',
                          padding: '0 10px',
                          border: `1px solid ${procLevelLinked ? 'var(--border)' : 'var(--primary)'}`,
                          borderRadius: 'var(--radius-button)',
                          background: procLevelLinked ? 'var(--muted)' : 'transparent',
                          color: procLevelLinked ? 'var(--muted-foreground)' : 'var(--primary)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: procLevelLinked ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {procLevelLinked ? 'Linked' : (<><Plus size={10} /> Add</>)}
                      </button>
                    </div>

                    {/* Sub-process rows */}
                    {isExpanded && hasSubs && (
                      <div style={{ paddingLeft: '36px', borderTop: '1px solid var(--border)', background: 'var(--muted)' }}>
                        {(proc.subProcesses ?? []).map(sp => {
                          const subLinked = associations.some(a => a.processId === proc.id && a.subProcessId === sp.id);
                          return (
                            <div
                              key={sp.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <GitBranch size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
                              <span
                                style={{
                                  flex: 1,
                                  fontFamily: 'var(--font-family-primary)',
                                  fontSize: '12px',
                                  fontWeight: 'var(--font-weight-regular)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                {sp.name}
                              </span>
                              <button
                                type="button"
                                disabled={subLinked}
                                onClick={() => handleAddAssociation(proc.id, sp.id)}
                                style={{
                                  height: '22px',
                                  padding: '0 8px',
                                  border: `1px solid ${subLinked ? 'var(--border)' : 'var(--primary)'}`,
                                  borderRadius: 'var(--radius-button)',
                                  background: subLinked ? 'var(--muted)' : 'transparent',
                                  color: subLinked ? 'var(--muted-foreground)' : 'var(--primary)',
                                  fontFamily: 'var(--font-family-primary)',
                                  fontSize: '11px',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  cursor: subLinked ? 'default' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  flexShrink: 0,
                                }}
                              >
                                {subLinked ? 'Linked' : (<><Plus size={9} /> Add</>)}
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
            <button
              type="button"
              onClick={() => { setShowAddPicker(false); setExpandedProcessId(null); }}
              style={{
                height: '28px',
                padding: '0 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ─── Association Cards ────────────────────────────── */}
      {resolvedAssociations.length === 0 && !showAddPicker ? (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Activity size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: '0 0 4px 0',
            }}
          >
            No process associations
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Associate this product with processes or sub-processes.
          </p>
          <button
            onClick={() => setShowAddPicker(true)}
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> Add Process
          </button>
        </div>
      ) : resolvedAssociations.length > 0 ? (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {resolvedAssociations.map((item, idx) => {
            const proc = item.proc!;
            const statusColor = proc.status === 'Active' ? '#1C8A45' : proc.status === 'Draft' ? '#E07B00' : '#6B7489';
            const statusBg = proc.status === 'Active' ? '#E8F5EE' : proc.status === 'Draft' ? '#FFF3E0' : '#F0F0F0';
            return (
              <div
                key={`${item.assoc.processId}-${item.assoc.subProcessId ?? 'root'}-${idx}`}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'box-shadow 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, cursor: 'pointer' }}
                  onClick={() => navigate(`/processes/${proc.id}`)}
                >
                  <Activity size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--primary)',
                      }}
                    >
                      {proc.name}
                    </span>
                    {item.sub && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <GitBranch size={10} style={{ color: 'var(--muted-foreground)' }} />
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '12px',
                            fontWeight: 'var(--font-weight-regular)',
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          {item.sub.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '20px',
                      padding: '0 8px',
                      borderRadius: '100px',
                      background: statusBg,
                      color: statusColor,
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    {proc.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingAssoc({ processId: item.assoc.processId, subProcessId: item.assoc.subProcessId });
                    }}
                    title="Remove association"
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
                  <ArrowRight
                    size={14}
                    style={{ color: 'var(--muted-foreground)', cursor: 'pointer' }}
                    onClick={() => navigate(`/processes/${proc.id}`)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      {deletingAssoc && (
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
          onClick={e => { if (e.target === e.currentTarget) setDeletingAssoc(null); }}
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
              Remove Process Association
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
              Are you sure you want to remove the association with{' '}
              <strong style={{ color: 'var(--foreground)' }}>
                {(() => {
                  const proc = allProcesses.find(p => p.id === deletingAssoc.processId);
                  const sub = deletingAssoc.subProcessId
                    ? (proc?.subProcesses ?? []).find(sp => sp.id === deletingAssoc.subProcessId)
                    : null;
                  return sub ? `${proc?.name} / ${sub.name}` : proc?.name ?? deletingAssoc.processId;
                })()}
              </strong>
              ?
            </p>
            <div
              style={{
                padding: '12px',
                background: 'rgba(192,57,43,0.06)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 'var(--radius-card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--destructive)',
                lineHeight: '18px',
              }}
            >
              This will unlink the process from this product. The process itself will not be deleted.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setDeletingAssoc(null)}
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
                onClick={() => handleRemoveAssociation(deletingAssoc.processId, deletingAssoc.subProcessId)}
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
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Associated Vendors Tab ────────────────────────────────────────────────

function AssociatedVendorsTab({
  product,
  vendors,
  navigate,
  onUpdateProduct,
}: {
  product: Product;
  vendors: Vendor[];
  navigate: (path: string) => void;
  onUpdateProduct: (updated: Product) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [deletingVendorId, setDeletingVendorId] = useState<string | null>(null);

  const associations = product.vendorIds;

  function handleAddAssociation(vendorId: string) {
    const exists = associations.includes(vendorId);
    if (exists) return;
    onUpdateProduct({
      ...product,
      vendorIds: [...associations, vendorId],
      updatedDate: new Date().toISOString(),
    });
  }

  function handleRemoveAssociation(vendorId: string) {
    onUpdateProduct({
      ...product,
      vendorIds: associations.filter(a => a !== vendorId),
      updatedDate: new Date().toISOString(),
    });
    setDeletingVendorId(null);
  }

  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'var(--card)',
          borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
          border: '1px solid var(--border)',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            Linked Vendors
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '1px 8px',
              lineHeight: '18px',
            }}
          >
            {associations.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddPicker(o => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '32px',
            padding: '0 12px',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} /> Add Vendor
        </button>
      </div>

      {/* ─── Add Vendor Picker ─────────────────────────────── */}
      {showAddPicker && (
        <div
          style={{
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            background: 'var(--muted)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}
          >
            Select a Vendor to Associate
          </div>
          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute', left: '10px', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)', pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search by vendor name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', height: '36px',
                paddingLeft: '32px', paddingRight: '12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
              onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; }}
            />
          </div>
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--card)',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {filteredVendors.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                }}
              >
                No vendors available. Create vendors in the Vendor Registry first.
              </div>
            ) : (
              filteredVendors.map(vendor => {
                const isLinked = associations.includes(vendor.id);
                return (
                  <div key={vendor.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                      }}
                    >
                      <Building2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}
                      >
                        {vendor.name}
                      </span>
                      <button
                        type="button"
                        disabled={isLinked}
                        onClick={() => handleAddAssociation(vendor.id)}
                        style={{
                          height: '24px',
                          padding: '0 10px',
                          border: `1px solid ${isLinked ? 'var(--border)' : 'var(--primary)'}`,
                          borderRadius: 'var(--radius-button)',
                          background: isLinked ? 'var(--muted)' : 'transparent',
                          color: isLinked ? 'var(--muted-foreground)' : 'var(--primary)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: isLinked ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {isLinked ? 'Linked' : (<><Plus size={10} /> Add</>)}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setShowAddPicker(false); setSearchTerm(''); }}
              style={{
                height: '28px',
                padding: '0 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--card)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ─── Association Cards ────────────────────────────── */}
      {associations.length === 0 && !showAddPicker ? (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Building2 size={48} style={{ color: 'var(--muted-foreground)' }} />
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '14px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: '0 0 4px 0',
            }}
          >
            No vendor associations
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Associate this product with vendors.
          </p>
          <button
            onClick={() => setShowAddPicker(true)}
            style={{
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
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
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} /> Add Vendor
          </button>
        </div>
      ) : associations.length > 0 ? (
        <div
          style={{
            background: 'var(--card)',
            borderLeft: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderRadius: '0 0 var(--radius-card) var(--radius-card)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {associations.map((vendorId, idx) => {
            const vendor = vendors.find(v => v.id === vendorId)!;
            return (
              <div
                key={`${vendorId}-${idx}`}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'box-shadow 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--elevation-sm)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
              >
                <Building2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                {/* Vendor name link */}
                <button
                  type="button"
                  onClick={() => navigate(`/vendors/${vendor.id}`)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    textAlign: 'left',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--primary)',
                    flex: '0 0 auto',
                    maxWidth: '240px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {vendor.name}
                </button>
                {/* Status badge */}
                {(() => {
                  const statusStyles: Record<string, { background: string; color: string }> = {
                    Active: { background: '#E8F5EE', color: '#1C8A45' },
                    Inactive: { background: '#F0F0F0', color: '#6B7489' },
                    'Pending Review': { background: '#FFF3E0', color: '#E07B00' },
                    Terminating: { background: 'rgba(192,57,43,0.08)', color: '#C0392B' },
                    'Selected Vendor': { background: 'rgba(35,34,240,0.08)', color: 'var(--primary)' },
                  };
                  const s = statusStyles[vendor.status] ?? statusStyles.Inactive;
                  return (
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        height: '20px', padding: '0 8px',
                        borderRadius: '100px',
                        background: s.background, color: s.color,
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
                        flexShrink: 0,
                      }}
                    >
                      {vendor.status}
                    </span>
                  );
                })()}
                {/* Category metadata */}
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                    flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {vendor.category}
                </span>
                {/* Unlink button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingVendorId(vendorId);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    height: '24px', padding: '0 8px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-button)',
                    background: 'transparent',
                    color: 'var(--muted-foreground)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px', fontWeight: 'var(--font-weight-semibold)',
                    cursor: 'pointer', flexShrink: 0,
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
                  <X size={10} /> Unlink
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ─── Delete Confirmation Dialog ─────────────────── */}
      {deletingVendorId && (
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
          onClick={e => { if (e.target === e.currentTarget) setDeletingVendorId(null); }}
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
              Remove Vendor Association
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
              Are you sure you want to remove the association with{' '}
              <strong style={{ color: 'var(--foreground)' }}>
                {(() => {
                  const vendor = vendors.find(v => v.id === deletingVendorId);
                  return vendor?.name ?? deletingVendorId;
                })()}
              </strong>
              ?
            </p>
            <div
              style={{
                padding: '12px',
                background: 'rgba(192,57,43,0.06)',
                border: '1px solid rgba(192,57,43,0.2)',
                borderRadius: 'var(--radius-card)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--destructive)',
                lineHeight: '18px',
              }}
            >
              This will unlink the vendor from this product. The vendor itself will not be deleted.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              <button
                onClick={() => setDeletingVendorId(null)}
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
                onClick={() => handleRemoveAssociation(deletingVendorId)}
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
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────────

function MetadataChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '10px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ReadOnlyCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '12px 16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
          lineHeight: '20px',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

function DeleteConfirmDialog({
  productName,
  onConfirm,
  onCancel,
}: {
  productName: string;
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
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
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
          Delete Product
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
          Are you sure you want to delete &quot;<strong style={{ color: 'var(--foreground)' }}>{productName}</strong>&quot;?
          This action cannot be undone.
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
              height: '36px', padding: '0 16px',
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
              height: '36px', padding: '0 16px',
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
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}