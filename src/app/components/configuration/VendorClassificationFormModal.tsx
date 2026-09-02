import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { VendorClassification } from '../../data/vendorClassificationData';

interface VendorClassificationFormModalProps {
  initialData?: VendorClassification;
  onClose: () => void;
  onSubmit: (data: Omit<VendorClassification, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
}

export function VendorClassificationFormModal({
  initialData,
  onClose,
  onSubmit,
}: VendorClassificationFormModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [weight, setWeight] = useState(initialData?.weight ?? 50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      weight,
    });
  }

  const isValid = title.trim().length >= 3 && description.trim().length >= 10 && weight >= 0 && weight <= 100;

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
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--elevation-sm)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
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
            {initialData ? 'Edit Classification' : 'Add Classification'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Title <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Vendor Risk Classification"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  A clear name for this classification system
                </p>
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
                    marginBottom: '6px',
                  }}
                >
                  Description <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the purpose and criteria of this classification system..."
                  rows={4}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  Explain what this classification system measures and how it should be used
                </p>
              </div>

              {/* Weight */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--foreground)',
                    marginBottom: '6px',
                  }}
                >
                  Weight (0-100) <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={e => setWeight(parseInt(e.target.value, 10))}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                  }}
                />
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  Importance of this classification in overall vendor scoring (higher = more important)
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
            }}
          >
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
              disabled={!isValid}
              style={{
                padding: '8px 16px',
                background: isValid ? 'var(--primary)' : 'var(--muted)',
                color: isValid ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: isValid ? 'pointer' : 'not-allowed',
              }}
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}