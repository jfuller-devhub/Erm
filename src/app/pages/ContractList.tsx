import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/shared/StatusBadge';
import { RecordGrid, GridColumn } from '../components/shared/RecordGrid';
import { ContractFormModal } from '../components/shared/ContractFormModal';
import { formatDate, formatCurrency, daysUntil, Contract, ContractStatus, ContractType } from '../data/mockData';

export function ContractList() {
  const { vendors, contracts, addContract, getActiveOptions } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const ALL_STATUSES = getActiveOptions('Contract', 'Status');
  const ALL_TYPES    = getActiveOptions('Contract', 'Type');

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q
      || c.title.toLowerCase().includes(q)
      || c.vendorName.toLowerCase().includes(q)
      || c.id.toLowerCase().includes(q)
      || c.owner.toLowerCase().includes(q)
      || c.department.toLowerCase().includes(q);
    const matchesStatus = !filterStatus || c.status === filterStatus;
    const matchesType = !filterType || c.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  type ContractRow = Contract & Record<string, unknown>;

  const columns: GridColumn<ContractRow>[] = [
    {
      key: 'id',
      header: 'Contract ID',
      sortable: true,
      width: '110px',
      render: (val, row) => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/contracts/${row.id}`); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--primary)', textDecoration: 'underline',
          }}
        >
          {String(val)}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Contract Title',
      sortable: true,
      width: '240px',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {String(val)}
        </span>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      sortable: true,
      width: '160px',
      render: (val, row) => (
        <button
          onClick={e => { e.stopPropagation(); navigate(`/vendors/${row.vendorId}`); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--primary)', textDecoration: 'underline',
          }}
        >
          {String(val)}
        </button>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      width: '180px',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: '12px', color: 'var(--muted-foreground)' }}>
          {String(val)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (val) => <StatusBadge status={val as ContractStatus} />,
    },
    {
      key: 'value',
      header: 'Value',
      sortable: true,
      width: '120px',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {Number(val) === 0 ? '—' : formatCurrency(Number(val))}
        </span>
      ),
    },
    {
      key: 'startDate',
      header: 'Start Date',
      sortable: true,
      width: '110px',
      render: (val) => (
        <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--foreground)' }}>
          {formatDate(String(val))}
        </span>
      ),
    },
    {
      key: 'endDate',
      header: 'End Date',
      sortable: true,
      width: '110px',
      render: (val, row) => {
        const d = daysUntil(String(val));
        const isActive = row.status === 'Active' || row.status === 'Renewal Due';
        const color = !isActive
          ? 'var(--muted-foreground)'
          : d < 0 ? 'var(--muted-foreground)' : d <= 30 ? 'var(--destructive)' : d <= 90 ? '#E07B00' : 'var(--foreground)';
        return (
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color }}>
            {formatDate(String(val))}
            {isActive && d >= 0 && d <= 90 && (
              <span style={{ display: 'block', fontSize: '11px', color }}>
                {d === 0 ? 'Today' : `${d}d`}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true,
      width: '140px',
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
            Contracts
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
            Track all vendor contracts and their lifecycle status.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            height: '36px', padding: '0 16px',
            border: 'none', borderRadius: 'var(--radius-button)',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
        >
          <Plus size={16} />
          Add Contract
        </button>
      </div>

      {/* Status summary */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total', count: contracts.length, color: 'var(--foreground)' },
          { label: 'Active', count: contracts.filter(c => c.status === 'Active').length, color: '#1C8A45' },
          { label: 'Renewal Due', count: contracts.filter(c => c.status === 'Renewal Due').length, color: '#00A3A3' },
          { label: 'Pending', count: contracts.filter(c => c.status === 'Pending').length, color: '#E07B00' },
          { label: 'Expired', count: contracts.filter(c => c.status === 'Expired').length, color: 'var(--muted-foreground)' },
          { label: 'Terminated', count: contracts.filter(c => c.status === 'Terminated').length, color: 'var(--destructive)' },
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
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)', pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search contracts..."
              style={{
                width: '100%', height: '32px', paddingLeft: '32px', paddingRight: '8px',
                border: `1px solid ${searchFocused ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              height: '32px', padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: filterStatus ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              height: '32px', padding: '0 8px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-input)',
              background: 'var(--input-background)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: filterType ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">All Types</option>
            {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', color: 'var(--muted-foreground)',
              marginLeft: 'auto', whiteSpace: 'nowrap',
            }}
          >
            {filtered.length} of {contracts.length} contracts
          </span>
        </div>

        <RecordGrid
          columns={columns as unknown as GridColumn<Record<string, unknown>>[]}
          data={filtered as unknown as Record<string, unknown>[]}
          pageSize={10}
          onRowClick={(row) => navigate(`/contracts/${row.id}`)}
          emptyMessage="No contracts found"
          emptySubMessage="Try adjusting your search or filter criteria."
        />
      </div>

      <ContractFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={addContract}
        vendors={vendors.map(v => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}