import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Search, X, Package, Heart, Briefcase, CheckCircle,
  FileText, Filter, Edit2, Trash2, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { KPITile } from '../components/shared/KPITile';
import { RecordGrid, type GridColumn } from '../components/shared/RecordGrid';
import { EmptyState } from '../components/shared/EmptyState';
import { ProductFormModal } from '../components/products/ProductFormModal';
import type { Product, ProductType, ProductStatus } from '../data/productData';
import { loadProducts, saveProducts } from '../data/productData';
import { formatDate } from '../data/mockData';
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
  const style = TYPE_STYLES[type];
  const Icon = style.icon;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
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
      <Icon size={10} />
      {type}
    </span>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function ProductDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { vendors, updateVendor } = useApp();

  useEffect(() => {
    setProducts(loadProducts());
  }, []);

  const persist = useCallback((updated: Product[]) => {
    setProducts(updated);
    saveProducts(updated);
  }, []);

  function handleSave(product: Product) {
    const existing = products.find(p => p.id === product.id);
    const oldVendorIds = existing?.vendorIds ?? [];
    const newVendorIds = product.vendorIds ?? [];

    if (existing) {
      persist(products.map(p => (p.id === product.id ? product : p)));
    } else {
      persist([product, ...products]);
    }

    // Bidirectional sync: update vendor productIds in AppContext
    syncProductVendorLinks(product.id, newVendorIds, oldVendorIds, vendors, updateVendor);
  }

  function handleDelete(id: string) {
    // Sync: remove this product from all vendors' productIds before deleting
    removeProductFromAllVendors(id, vendors, updateVendor);
    persist(products.filter(p => p.id !== id));
    setDeleteConfirmId(null);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function openNew() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  // ─── KPI calculations ─────────────────────────────────────────────────
  const totalProducts = products.length;
  const totalBenefits = products.filter(p => p.type === 'Benefit').length;
  const totalServices = products.filter(p => p.type === 'Service').length;
  const activeProducts = products.filter(p => p.status === 'Active').length;
  const withAssociations = products.filter(p => p.processAssociations.length > 0).length;

  // ─── Filtering ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = products;
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }
    if (typeFilter !== 'all') {
      result = result.filter(p => p.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [products, statusFilter, typeFilter, searchQuery]);

  const gridData = filtered.map(p => ({ ...p })) as unknown as Record<string, unknown>[];

  // ─── Grid columns ─────────────────────────────────────────────────────
  const columns: GridColumn<Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Benefits or Services Name',
      sortable: true,
      width: '240px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--primary)',
                cursor: 'pointer',
              }}
              onClick={e => {
                e.stopPropagation();
                navigate(`/products/${prod.id}`);
              }}
            >
              {prod.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      width: '100px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        return <ProductTypeBadge type={prod.type} />;
      },
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      width: '180px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
            }}
          >
            {prod.category}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '90px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        return <ProductStatusBadge status={prod.status} />;
      },
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: false,
      width: '130px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        if (!prod.owner) return <span style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)' }}>—</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '9px',
                fontWeight: 'var(--font-weight-semibold)',
                flexShrink: 0,
              }}
            >
              {prod.owner.initials}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--foreground)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {prod.owner.name}
            </span>
          </div>
        );
      },
    },
    {
      key: 'processAssociations',
      header: 'Processes',
      sortable: false,
      width: '80px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        const count = prod.processAssociations.length;
        return (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: count > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
            }}
          >
            {count}
          </span>
        );
      },
    },
    {
      key: '_actions',
      header: '',
      width: '80px',
      render: (_val, row) => {
        const prod = row as unknown as Product;
        return (
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
            <button
              onClick={e => { e.stopPropagation(); openEdit(prod); }}
              title="Edit"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', border: 'none',
                borderRadius: 'var(--radius-input)', background: 'transparent',
                color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--muted)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setDeleteConfirmId(prod.id); }}
              title="Delete"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', border: 'none',
                borderRadius: 'var(--radius-input)', background: 'transparent',
                color: 'var(--muted-foreground)', cursor: 'pointer', padding: 0,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(192,57,43,0.08)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)';
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─── Page Header ───────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
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
            Benefits or Services Register
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: '2px 0 0 0',
            }}
          >
            Track benefits and service offerings across the enterprise.
          </p>
        </div>
        <button
          onClick={openNew}
          style={{
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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'opacity 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={14} />
          New Benefit or Service
        </button>
      </div>

      {/* ─── KPI Tiles (max 5 per guidelines) ───────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '16px',
        }}
      >
        <KPITile label="Total Benefits or Services" value={totalProducts} icon={Package} accent />
        <KPITile label="Benefits" value={totalBenefits} icon={Heart} iconColor="#1C8A45" />
        <KPITile label="Services" value={totalServices} icon={Briefcase} iconColor="#00A3A3" />
        <KPITile label="Active" value={activeProducts} icon={CheckCircle} iconColor="#1C8A45" />
        <KPITile label="With Processes" value={withAssociations} icon={FileText} iconColor="#E07B00" subLabel={`of ${totalProducts}`} />
      </div>

      {/* ─── Search / Filters ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search bar */}
        <div
          style={{
            flex: '1 1 260px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '36px',
            padding: '0 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-input)',
            background: 'var(--input-background)',
          }}
        >
          <Search size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search benefits or services..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              flex: 1,
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--foreground)',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px', display: 'flex', alignItems: 'center',
                color: 'var(--muted-foreground)',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type filter chips */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'Benefit', 'Service'] as const).map(val => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              style={{
                height: '28px',
                padding: '0 10px',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                background: typeFilter === val ? 'var(--primary)' : 'var(--card)',
                color: typeFilter === val ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.1s',
              }}
            >
              {val === 'all' ? 'All Types' : val + 's'}
            </button>
          ))}
        </div>

        {/* Status filter chips */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'Active', 'Draft', 'Sunset', 'Retired'] as const).map(val => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{
                height: '28px',
                padding: '0 10px',
                border: '1px solid var(--border)',
                borderRadius: '100px',
                background: statusFilter === val ? 'var(--primary)' : 'var(--card)',
                color: statusFilter === val ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.1s',
                textTransform: 'capitalize',
              }}
            >
              {val === 'all' ? 'All' : val}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Record Grid ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}
      >
        {filtered.length === 0 && products.length > 0 ? (
          <EmptyState
            icon={Search}
            title="No matching benefits or services"
            description="Try adjusting your search or filter criteria."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No benefits or services yet"
            description="Create your first benefit or service to start building the register."
            action={{ label: 'New Benefit or Service', onClick: openNew }}
          />
        ) : (
          <RecordGrid
            columns={columns}
            data={gridData}
            pageSize={10}
            onRowClick={row => {
              const prod = row as unknown as Product;
              navigate(`/products/${prod.id}`);
            }}
          />
        )}
      </div>

      {/* ─── Modal ───────────────────────────────────────────────────── */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        onSave={handleSave}
        editingProduct={editingProduct}
      />

      {/* ─── Delete Confirmation ─────────────────────────────────────── */}
      {deleteConfirmId && (
        <DeleteConfirmDialog
          productName={products.find(p => p.id === deleteConfirmId)?.name ?? ''}
          onConfirm={() => handleDelete(deleteConfirmId)}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
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
          Delete Benefit or Service
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
          This will also remove all process associations. This action cannot be undone.
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