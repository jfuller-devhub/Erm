import React from 'react';
import { useNavigate } from 'react-router';
import {
  Building2, FileText, AlertTriangle, DollarSign, Clock, TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { KPITile } from '../components/shared/KPITile';
import { StatusBadge } from '../components/shared/StatusBadge';
import { RecordGrid, GridColumn } from '../components/shared/RecordGrid';
import { formatDate, formatCurrency, daysUntil, Contract } from '../data/mockData';

export function Dashboard() {
  const { vendors, contracts, activity } = useApp();
  const navigate = useNavigate();

  // ── KPI calculations ─────────────────────────────────────────────────────
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'Active').length;
  const activeContracts = contracts.filter(c => c.status === 'Active').length;
  const totalValue = contracts
    .filter(c => c.status === 'Active' || c.status === 'Renewal Due')
    .reduce((sum, c) => sum + c.value, 0);
  const expiringIn30 = contracts.filter(c => {
    if (c.status !== 'Active' && c.status !== 'Renewal Due') return false;
    const d = daysUntil(c.endDate);
    return d >= 0 && d <= 30;
  }).length;
  const renewalDue = contracts.filter(c => c.status === 'Renewal Due').length;
  const pendingItems = vendors.filter(v => v.status === 'Pending Review').length
    + contracts.filter(c => c.status === 'Pending').length;

  // ── Recent contracts (latest 10) ─────────────────────────────────────────
  const recentContracts = [...contracts]
    .sort((a, b) => b.updatedDate.localeCompare(a.updatedDate))
    .slice(0, 10);

  const contractCols: GridColumn<Contract & Record<string, unknown>>[] = [
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
            color: 'var(--primary)',
            textDecoration: 'underline',
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
      width: '260px',
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
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (val) => <StatusBadge status={val as Contract['status']} />,
    },
    {
      key: 'endDate',
      header: 'Expires',
      sortable: true,
      width: '120px',
      render: (val) => {
        const d = daysUntil(String(val));
        const color = d < 0 ? 'var(--muted-foreground)' : d <= 30 ? 'var(--destructive)' : d <= 90 ? '#E07B00' : 'var(--foreground)';
        return (
          <span style={{ fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color }}>
            {formatDate(String(val))}
          </span>
        );
      },
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
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Page header */}
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
            Dashboard
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
            Overview of your vendor relationships and contract lifecycle status.
          </p>
        </div>
      </div>

      {/* KPI tiles — max 5 per guidelines */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        style={{ gap: '16px' }}
      >
        <KPITile
          label="Total Vendors"
          value={totalVendors}
          icon={Building2}
          subLabel={`${activeVendors} active`}
        />
        <KPITile
          label="Active Contracts"
          value={activeContracts}
          icon={FileText}
          subLabel={`of ${contracts.length} total`}
        />
        <KPITile
          label="Contract Value"
          value={formatCurrency(totalValue)}
          icon={DollarSign}
          subLabel="Active & renewal due"
        />
        <KPITile
          label="Expiring ≤ 30 Days"
          value={expiringIn30}
          icon={AlertTriangle}
          iconColor={expiringIn30 > 0 ? '#E07B00' : undefined}
          subLabel={`${renewalDue} renewal due`}
        />
        <KPITile
          label="Pending Review"
          value={pendingItems}
          icon={Clock}
          subLabel="Vendors & contracts"
        />
      </div>

      {/* Recent Contracts grid */}
      <section>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--elevation-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Recent Contracts
            </h2>
            <button
              onClick={() => navigate('/contracts')}
              style={{
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
              View all →
            </button>
          </div>
          <RecordGrid
            columns={contractCols as GridColumn<Record<string, unknown>>[]}
            data={recentContracts as unknown as Record<string, unknown>[]}
            pageSize={10}
            onRowClick={(row) => navigate(`/contracts/${row.id}`)}
          />
        </div>
      </section>

      {/* Activity Feed + Upcoming Renewals row */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '24px' }}>
        {/* Activity Feed */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--elevation-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Recent Activity
            </h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {activity.slice(0, 8).map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px 16px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '11px',
                    fontWeight: 'var(--font-weight-bold)',
                    flexShrink: 0,
                  }}
                >
                  {item.userInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                      lineHeight: '1.4',
                    }}
                  >
                    {item.action}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      marginTop: '2px',
                    }}
                  >
                    {item.user} · {formatDate(item.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--elevation-sm)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '14px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}
            >
              Upcoming Renewals & Expirations
            </h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {contracts
              .filter(c => {
                if (c.status === 'Expired' || c.status === 'Terminated') return false;
                const d = daysUntil(c.endDate);
                return d >= 0 && d <= 90;
              })
              .sort((a, b) => a.endDate.localeCompare(b.endDate))
              .slice(0, 8)
              .map(contract => {
                const d = daysUntil(contract.endDate);
                const urgency = d <= 14 ? 'var(--destructive)' : d <= 30 ? '#E07B00' : '#1C8A45';
                return (
                  <div
                    key={contract.id}
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <div
                      style={{
                        width: '4px',
                        height: '36px',
                        borderRadius: '2px',
                        background: urgency,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {contract.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {contract.vendorName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: urgency,
                        }}
                      >
                        {d === 0 ? 'Today' : `${d}d left`}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '11px',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {formatDate(contract.endDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
            {contracts.filter(c => {
              if (c.status === 'Expired' || c.status === 'Terminated') return false;
              const d = daysUntil(c.endDate);
              return d >= 0 && d <= 90;
            }).length === 0 && (
              <div
                style={{
                  padding: '32px 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                }}
              >
                No contracts expiring in the next 90 days.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}