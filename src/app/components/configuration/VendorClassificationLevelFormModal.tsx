import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { VendorClassificationLevel } from '../../data/vendorClassificationData';

interface VendorClassificationLevelFormModalProps {
  classificationId: string;
  initialData?: VendorClassificationLevel;
  existingLevels: VendorClassificationLevel[];
  onClose: () => void;
  onSubmit: (data: Omit<VendorClassificationLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
}

export function VendorClassificationLevelFormModal({
  classificationId,
  initialData,
  existingLevels,
  onClose,
  onSubmit,
}: VendorClassificationLevelFormModalProps) {
  const [levelNumber, setLevelNumber] = useState(initialData?.levelNumber || 1);
  const [levelLabel, setLevelLabel] = useState(initialData?.levelLabel || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [score, setScore] = useState(initialData?.score ?? 50);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const maxSortOrder = Math.max(0, ...existingLevels.map(l => l.sortOrder));

    onSubmit({
      classificationId,
      levelNumber,
      levelLabel: levelLabel.trim(),
      description: description.trim(),
      score,
      sortOrder: initialData?.sortOrder ?? maxSortOrder + 1,
    });
  }

  const isValid = levelLabel.trim().length >= 3 && description.trim().length >= 10 && score >= 0 && score <= 100;

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
          maxWidth: '700px',
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
            {initialData ? 'Edit Level' : 'Add Level'}
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
              {/* Level Number */}
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
                  Level Number <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={levelNumber}
                  onChange={e => setLevelNumber(parseInt(e.target.value, 10))}
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
                  Numeric identifier for this level (1-10)
                </p>
              </div>

              {/* Level Label */}
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
                  Level Label <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={levelLabel}
                  onChange={e => setLevelLabel(e.target.value)}
                  placeholder="e.g., Level 5 - High Exposure"
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
                  Display text for this classification level
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
                  placeholder={`Example:
Any one of the following applies:
• Annual vendor spend > $2M
• Sole source provider with estimated replacement > 12 months
• Vendor failure creates direct financial liability`}
                  rows={8}
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
                  Detailed criteria for this classification level (supports bullet points)
                </p>
              </div>

              {/* Score */}
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
                  Score (0-100) <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={score}
                  onChange={e => setScore(parseInt(e.target.value, 10))}
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
                  Numeric score assigned to this level for weighted vendor calculations
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
              {initialData ? 'Update' : 'Add Level'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}