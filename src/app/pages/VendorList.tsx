import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/StatusBadge';
import { RecordGrid, GridColumn } from '../components/shared/RecordGrid';
import { VendorFormModal } from '../components/shared/VendorFormModal';
import { formatDate, Vendor, VendorStatus, VendorCategory } from '../data/mockData';

export function VendorList() {
  const { vendors, contracts, addVendor, getActiveOptions } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const ALL_CATEGORIES  = getActiveOptions('Vendor', 'Category');
  const ALL_STATUSES    = getActiveOptions('Vendor', 'Status');
  const ALL_DEPARTMENTS = getActiveOptions('Vendor', 'Department');

  // Enriched vendors with contract counts
  const enriched = vendors.map(v => ({
    ...v,
    contractCount: contracts.filter(c => c.vendorId === v.id).length,
    activeContracts: contracts.filter(c => c.vendorId === v.id && c.status === 'Active').length,
    processCount: (v.processAssociations ?? []).length,
  }));

  const filtered = enriched.filter(v => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || v.name.toLowerCase().includes(q)
      || v.primaryContact.toLowerCase().includes(q)
      || v.email.toLowerCase().includes(q)
      || v.category.toLowerCase().includes(q);
    const matchesStatus     = !filterStatus     || v.status     === filterStatus;
    const matchesCategory   = !filterCategory   || v.category   === filterCategory;
    const matchesDepartment = !filterDepartment || v.department === filterDepartment;
    return matchesSearch && matchesStatus && matchesCategory && matchesDepartment;
  });

  type EnrichedVendor = typeof enriched[0];

  const columns: GridColumn<EnrichedVendor & Record<string, unknown>>[] = [
    {
      key: 'name',
      header: 'Vendor Name',
      sortable: true,
      width: '200px',
      render: (val, row) => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/vendors/${row.id}`); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--primary)',
            textDecoration: 'underline',
            textAlign: 'left',
          }}
        >
          {String(val)}
        </button>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      width: '160px',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '130px',
      render: (val) => <StatusBadge status={val as VendorStatus} />,
    },
    {
      key: 'primaryContact',
      header: 'Primary Contact',
      sortable: true,
      width: '160px',
    },
    {
      key: 'contractCount',
      header: 'Contracts',
      sortable: true,
      width: '100px',
      render: (val, row) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {String(val)} <span style={{ color: 'var(--muted-foreground)' }}>({row.activeContracts as number} active)</span>
        </span>
      ),
    },
    {
      key: 'processCount',
      header: 'Processes',
      sortable: true,
      width: '80px',
      render: (val) => (
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: Number(val) > 0 ? 'var(--foreground)' : 'var(--muted-foreground)',
          }}
        >
          {String(val)}
        </span>
      ),
    },
    {
      key: 'createdDate',
      header: 'Created',
      sortable: true,
      width: '120px',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {formatDate(String(val))}
        </span>
      ),
    },
    {
      key: 'updatedDate',
      header: 'Last Updated',
      sortable: true,
      width: '130px',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
          {formatDate(String(val))}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '22px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Vendors
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0',
            }}
          >
            Manage your vendor relationships and onboarding status.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
            flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={16} />
          Add Vendor
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', count: vendors.length, color: 'var(--foreground)' },
          { label: 'Active', count: vendors.filter(v => v.status === 'Active').length, color: '#1C8A45' },
          { label: 'Inactive', count: vendors.filter(v => v.status === 'Inactive').length, color: 'var(--muted-foreground)' },
          { label: 'Pending Review', count: vendors.filter(v => v.status === 'Pending Review').length, color: '#E07B00' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '18px', fontWeight: 'var(--font-weight-bold)', color: item.color }}>
              {item.count}
            </span>
            <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Grid card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--elevation-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Filter bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search vendors..."
              style={{
                width: '100%',
                height: '32px',
                paddingLeft: '32px',
                paddingRight: '8px',
                border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              height: '32px',
              padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: filterStatus ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{
              height: '32px',
              padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: filterCategory ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Department filter */}
          <select
            value={filterDepartment}
            onChange={e => setFilterDepartment(e.target.value)}
            style={{
              height: '32px',
              padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: filterDepartment ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Departments</option>
            {ALL_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              color: 'var(--muted-foreground)',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {filtered.length} of {vendors.length} vendors
          </span>
        </div>

        <RecordGrid
          columns={columns as unknown as GridColumn<Record<string, unknown>>[]}
          data={filtered as unknown as Record<string, unknown>[]}
          pageSize={10}
          onRowClick={(row) => navigate(`/vendors/${row.id}`)}
          emptyMessage="No vendors found"
          emptySubMessage="Try adjusting your search or filter criteria."
        />
      </div>

      <VendorFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={addVendor}
      />
    </div>
  );
}