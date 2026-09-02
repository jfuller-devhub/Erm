import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Bill, BillAmendment } from '../../data/billData';
import { AmendmentFormModal } from './AmendmentFormModal';
import { loadBills, saveBills } from '../../data/billData';

interface BillAmendmentsTabProps {
  bill: Bill;
  onUpdate: (updated: Bill) => void;
}

export function BillAmendmentsTab({ bill, onUpdate }: BillAmendmentsTabProps) {
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);

  function handleAddAmendment(data: Omit<BillAmendment, 'id'>) {
    const bills = loadBills();
    const today = new Date().toISOString().split('T')[0];
    const newAmendment: BillAmendment = {
      id: `AMD-${Date.now()}`,
      ...data,
    };
    const updated = bills.map(b =>
      b.id === bill.id
        ? { ...b, amendments: [...b.amendments, newAmendment], updatedAt: today, updatedBy: 'Emily Carter' }
        : b
    );

    saveBills(updated);
    const updatedBill = updated.find(b => b.id === bill.id);
    if (updatedBill) onUpdate(updatedBill);
    setAmendmentModalOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            Amendments ({bill.amendments.length})
          </h3>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: '4px 0 0 0',
            }}
          >
            Proposed changes and modifications to the bill
          </p>
        </div>
        <button
          onClick={() => setAmendmentModalOpen(true)}
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
          Add Amendment
        </button>
      </div>

      {/* Amendments List */}
      {bill.amendments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bill.amendments.map(amendment => (
            <div
              key={amendment.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                  marginBottom: '8px',
                }}
              >
                {amendment.amendmentNumber}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--foreground)',
                  marginBottom: '12px',
                  lineHeight: 1.6,
                }}
              >
                {amendment.description}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  color: 'var(--muted-foreground)',
                }}
              >
                <span>
                  <strong style={{ fontWeight: 'var(--font-weight-semibold)' }}>Status:</strong> {amendment.status}
                </span>
                <span>
                  <strong style={{ fontWeight: 'var(--font-weight-semibold)' }}>Proposed:</strong>{' '}
                  {new Date(amendment.proposedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {amendment.adoptedDate && (
                  <span>
                    <strong style={{ fontWeight: 'var(--font-weight-semibold)' }}>Adopted:</strong>{' '}
                    {new Date(amendment.adoptedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              color: 'var(--muted-foreground)',
              margin: 0,
            }}
          >
            No amendments yet. Click "Add Amendment" to create one.
          </p>
        </div>
      )}

      {/* Amendment Modal */}
      {amendmentModalOpen && (
        <AmendmentFormModal
          onClose={() => setAmendmentModalOpen(false)}
          onSubmit={handleAddAmendment}
        />
      )}
    </div>
  );
}
