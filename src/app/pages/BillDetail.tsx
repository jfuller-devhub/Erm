import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, ExternalLink, FileText } from 'lucide-react';
import type { Bill } from '../data/billData';
import {
  loadBills,
  saveBills,
  getBillById,
  deleteBill,
  BILL_STATUS_LABELS,
  BILL_STATUS_STYLES,
  BILL_PRIORITY_LABELS,
  BILL_PRIORITY_STYLES,
} from '../data/billData';
import { BillFormModal } from '../components/bills/BillFormModal';
import { BillOverviewTab } from '../components/bills/BillOverviewTab';
import { BillAmendmentsTab } from '../components/bills/BillAmendmentsTab';
import { BillVotesTab } from '../components/bills/BillVotesTab';
import { BillActivityTab } from '../components/bills/BillActivityTab';

type TabKey = 'overview' | 'amendments' | 'votes' | 'activity';

export function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const bills = loadBills();
      const found = getBillById(bills, id);
      if (found) {
        setBill(found);
      } else {
        navigate('/bills');
      }
    }
  }, [id, navigate]);

  function handleUpdate(data: Omit<Bill, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) {
    if (!bill) return;

    const bills = loadBills();
    const today = new Date().toISOString().split('T')[0];
    const updated = bills.map(b =>
      b.id === bill.id
        ? { ...b, ...data, updatedAt: today, updatedBy: 'Emily Carter' }
        : b
    );

    saveBills(updated);
    const updatedBill = updated.find(b => b.id === bill.id);
    if (updatedBill) setBill(updatedBill);
    setEditModalOpen(false);
  }

  function handleDelete() {
    if (!bill) return;

    const bills = loadBills();
    const updated = deleteBill(bills, bill.id);
    saveBills(updated);
    navigate('/bills');
  }

  if (!bill) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          color: 'var(--muted-foreground)',
        }}
      >
        Loading...
      </div>
    );
  }

  const statusStyle = BILL_STATUS_STYLES[bill.status];
  const priorityStyle = BILL_PRIORITY_STYLES[bill.priority];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/bills')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'transparent',
          border: 'none',
          color: 'var(--muted-foreground)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          cursor: 'pointer',
          padding: '4px 8px',
          marginLeft: '-8px',
          borderRadius: 'var(--radius-button)',
          width: 'fit-content',
        }}
      >
        <ArrowLeft size={16} />
        Back to Bills
      </button>

      {/* Header Card */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FileText size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <h1
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '28px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  margin: 0,
                }}
              >
                {bill.billNumber}
              </h1>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--muted-foreground)',
                margin: '0 0 16px 0',
              }}
            >
              {bill.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
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
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
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
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            {bill.officialUrl && (
              <a
                href={bill.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                <ExternalLink size={16} />
                View Official
              </a>
            )}
            <button
              onClick={() => setEditModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--destructive)',
                color: 'var(--destructive-foreground)',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        {/* Tab Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'amendments', label: 'Amendments' },
            { key: 'votes', label: 'Voting History' },
            { key: 'activity', label: 'Activity & Comments' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              style={{
                flex: '0 0 auto',
                height: '40px',
                padding: '0 24px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight:
                  activeTab === tab.key ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && <BillOverviewTab bill={bill} />}
          {activeTab === 'amendments' && (
            <BillAmendmentsTab
              bill={bill}
              onUpdate={updatedBill => setBill(updatedBill)}
            />
          )}
          {activeTab === 'votes' && (
            <BillVotesTab
              bill={bill}
              onUpdate={updatedBill => setBill(updatedBill)}
            />
          )}
          {activeTab === 'activity' && <BillActivityTab bill={bill} />}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <BillFormModal
          initialData={bill}
          onClose={() => setEditModalOpen(false)}
          onSubmit={handleUpdate}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 'var(--radius-card)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '18px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 12px 0',
              }}
            >
              Delete Bill?
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}
            >
              Are you sure you want to delete this bill? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: '8px 16px',
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  border: 'none',
                  borderRadius: 'var(--radius-button)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                }}
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
