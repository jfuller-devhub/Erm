import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Filter, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import {
  loadBills,
  saveBills,
  filterBills,
  type Bill,
  type BillStatus,
  type BillPriority,
  BILL_STATUS_LABELS,
  BILL_STATUS_STYLES,
  BILL_PRIORITY_LABELS,
  BILL_PRIORITY_STYLES,
} from '../data/billData';
import { BillFormModal } from '../components/bills/BillFormModal';

export function BillTracker() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<BillPriority[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setBills(loadBills());
  }, []);

  const filteredBills = filterBills(bills, {
    search: searchQuery,
    status: statusFilter,
    priority: priorityFilter,
  });

  function handleCreate(data: Omit<Bill, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    const allBills = loadBills();
    const nextNum = allBills.length + 1;
    const id = `BILL-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newBill: Bill = {
      ...data,
      id,
      createdAt: today,
      createdBy: 'Emily Carter',
      updatedAt: today,
      updatedBy: 'Emily Carter',
    };

    const updated = [...allBills, newBill];
    saveBills(updated);
    setBills(updated);
    setAddModalOpen(false);
  }

  const stats = {
    total: bills.length,
    active: bills.filter(b => !['signed', 'vetoed', 'failed'].includes(b.status)).length,
    critical: bills.filter(b => b.priority === 'critical').length,
    signed: bills.filter(b => b.status === 'signed').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '28px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
              marginBottom: '4px',
            }}
          >
            Bills & Legislation
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            Track proposed and enacted legislation impacting compliance requirements
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Add Bill
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Bills" value={stats.total} icon={FileText} color="#1565C0" />
        <StatCard label="Active Tracking" value={stats.active} icon={AlertCircle} color="#F57F17" />
        <StatCard label="Critical Priority" value={stats.critical} icon={AlertCircle} color="#C62828" />
        <StatCard label="Signed into Law" value={stats.signed} icon={FileText} color="#1C8A45" />
      </div>

      {/* Search & Filters */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
              }}
            />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                background: 'var(--input-background)',
                color: 'var(--foreground)',
              }}
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: filtersOpen ? 'var(--muted)' : 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              cursor: 'pointer',
              color: 'var(--foreground)',
            }}
          >
            <Filter size={16} />
            Filters {(statusFilter.length + priorityFilter.length) > 0 && `(${statusFilter.length + priorityFilter.length})`}
          </button>
        </div>

        {filtersOpen && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FilterSection
              label="Status"
              options={Object.keys(BILL_STATUS_LABELS) as BillStatus[]}
              selected={statusFilter}
              onChange={setStatusFilter}
              getLabel={s => BILL_STATUS_LABELS[s]}
            />
            <FilterSection
              label="Priority"
              options={Object.keys(BILL_PRIORITY_LABELS) as BillPriority[]}
              selected={priorityFilter}
              onChange={setPriorityFilter}
              getLabel={p => BILL_PRIORITY_LABELS[p]}
            />
          </div>
        )}
      </div>

      {/* Bills Table */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th style={tableHeaderStyle}>Bill Number</th>
                <th style={tableHeaderStyle}>Title</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Priority</th>
                <th style={tableHeaderStyle}>Legislature</th>
                <th style={tableHeaderStyle}>Introduced</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <FileText size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />
                      <p
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          color: 'var(--muted-foreground)',
                          margin: 0,
                        }}
                      >
                        {searchQuery || statusFilter.length > 0 || priorityFilter.length > 0
                          ? 'No bills match your filters'
                          : 'No bills tracked yet'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => {
                  const statusStyle = BILL_STATUS_STYLES[bill.status];
                  const priorityStyle = BILL_PRIORITY_STYLES[bill.priority];

                  return (
                    <tr
                      key={bill.id}
                      onClick={() => navigate(`/bills/${bill.id}`)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--muted)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--primary)',
                          }}
                        >
                          {bill.billNumber}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ maxWidth: '400px' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--text-base)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--foreground)',
                              marginBottom: '4px',
                            }}
                          >
                            {bill.title}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: '12px',
                              color: 'var(--muted-foreground)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {bill.summary}
                          </div>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-family-primary)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background: statusStyle.background,
                            color: statusStyle.color,
                          }}
                        >
                          {BILL_STATUS_LABELS[bill.status]}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontFamily: 'var(--font-family-primary)',
                            fontWeight: 'var(--font-weight-semibold)',
                            background: priorityStyle.background,
                            color: priorityStyle.color,
                          }}
                        >
                          {BILL_PRIORITY_LABELS[bill.priority]}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--foreground)',
                          }}
                        >
                          {bill.legislature}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                          <span
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--text-base)',
                              color: 'var(--foreground)',
                            }}
                          >
                            {new Date(bill.introducedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bill Modal */}
      {addModalOpen && (
        <BillFormModal onClose={() => setAddModalOpen(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-card)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--foreground)',
            lineHeight: 1,
            marginBottom: '4px',
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            color: 'var(--muted-foreground)',
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Section ───────────────────────────────────────────────────────────

function FilterSection<T extends string>({
  label,
  options,
  selected,
  onChange,
  getLabel,
}: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (values: T[]) => void;
  getLabel: (value: T) => string;
}) {
  function toggle(value: T) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--foreground)',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map(option => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggle(option)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '100px',
                background: isSelected ? 'var(--primary)' : 'var(--card)',
                color: isSelected ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {getLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Table Styles ─────────────────────────────────────────────────────────────

const tableHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontFamily: 'var(--font-family-primary)',
  fontSize: '12px',
  fontWeight: 'var(--font-weight-semibold)',
  color: 'var(--foreground)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tableCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontFamily: 'var(--font-family-primary)',
  fontSize: 'var(--text-base)',
  color: 'var(--foreground)',
};
