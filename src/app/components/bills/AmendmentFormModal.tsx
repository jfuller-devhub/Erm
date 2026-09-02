import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { BillAmendment } from '../../data/billData';

interface AmendmentFormModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<BillAmendment, 'id'>) => void;
  initialData?: BillAmendment;
}

export function AmendmentFormModal({ onClose, onSubmit, initialData }: AmendmentFormModalProps) {
  const [amendmentNumber, setAmendmentNumber] = useState(initialData?.amendmentNumber || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [proposedDate, setProposedDate] = useState(initialData?.proposedDate || '');
  const [status, setStatus] = useState<'proposed' | 'adopted' | 'rejected'>(
    initialData?.status || 'proposed'
  );
  const [impact, setImpact] = useState(initialData?.impact || '');

  const isEdit = !!initialData;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!amendmentNumber.trim() || !description.trim() || !proposedDate || !impact.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    onSubmit({
      amendmentNumber: amendmentNumber.trim(),
      description: description.trim(),
      proposedDate,
      status,
      impact: impact.trim(),
    });
  }

  return (
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
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-card)',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '18px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
              margin: 0,
            }}
          >
            {isEdit ? 'Edit Amendment' : 'Add Amendment'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted-foreground)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Amendment Number */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Amendment Number <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <input
              type="text"
              value={amendmentNumber}
              onChange={e => setAmendmentNumber(e.target.value)}
              placeholder="e.g., H.R. 1234-A1"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Description <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the amendment..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Proposed Date */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Proposed Date <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <input
              type="date"
              value={proposedDate}
              onChange={e => setProposedDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
              }}
            />
          </div>

          {/* Status */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Status <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'proposed' | 'adopted' | 'rejected')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
              }}
            >
              <option value="proposed">Proposed</option>
              <option value="adopted">Adopted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Impact */}
          <div>
            <label
              style={{
                display: 'block',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            >
              Impact Assessment <span style={{ color: 'var(--destructive)' }}>*</span>
            </label>
            <textarea
              value={impact}
              onChange={e => setImpact(e.target.value)}
              placeholder="Describe the potential impact of this amendment..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--foreground)',
                background: 'var(--background)',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              style={{
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
              {isEdit ? 'Save Changes' : 'Add Amendment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
