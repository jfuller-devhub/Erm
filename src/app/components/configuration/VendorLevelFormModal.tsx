import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { VendorLevel } from '../../data/vendorLevelData';
import { validateScoreRanges } from '../../data/vendorLevelData';

interface VendorLevelFormModalProps {
  initialData?: VendorLevel;
  existingLevels: VendorLevel[];
  onClose: () => void;
  onSubmit: (data: Omit<VendorLevel, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => void;
}

const COLOR_OPTIONS = [
  { value: 'var(--destructive)', label: 'Red (Critical)', preview: '#dc2626' },
  { value: 'var(--warning)', label: 'Orange (Warning)', preview: '#ea580c' },
  { value: 'var(--chart-3)', label: 'Yellow (Moderate)', preview: '#eab308' },
  { value: 'var(--chart-2)', label: 'Blue (Low)', preview: '#3b82f6' },
  { value: 'var(--chart-1)', label: 'Green (Minimal)', preview: '#22c55e' },
  { value: 'var(--primary)', label: 'Primary', preview: '#0066CC' },
  { value: 'var(--accent)', label: 'Accent', preview: '#8b5cf6' },
];

export function VendorLevelFormModal({
  initialData,
  existingLevels,
  onClose,
  onSubmit,
}: VendorLevelFormModalProps) {
  const [levelNumber, setLevelNumber] = useState(initialData?.levelNumber || 1);
  const [levelName, setLevelName] = useState(initialData?.levelName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [minScore, setMinScore] = useState(initialData?.minScore ?? 0);
  const [maxScore, setMaxScore] = useState(initialData?.maxScore ?? 0);
  const [color, setColor] = useState(initialData?.color || 'var(--primary)');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate score range
    if (minScore > maxScore) {
      setValidationError('Minimum score cannot be greater than maximum score');
      return;
    }

    // Create a temporary level to test for overlaps
    const tempLevel: VendorLevel = {
      id: initialData?.id || 'temp',
      levelNumber,
      levelName: levelName.trim(),
      description: description.trim(),
      minScore,
      maxScore,
      color,
      sortOrder: initialData?.sortOrder ?? existingLevels.length + 1,
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
    };

    // Check for overlapping ranges with other levels
    const testLevels = initialData
      ? existingLevels.map(l => (l.id === initialData.id ? tempLevel : l))
      : [...existingLevels, tempLevel];

    const validation = validateScoreRanges(testLevels, initialData?.id);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid score range');
      return;
    }

    setValidationError(null);
    onSubmit({
      levelNumber,
      levelName: levelName.trim(),
      description: description.trim(),
      minScore,
      maxScore,
      color,
      sortOrder: initialData?.sortOrder ?? existingLevels.length + 1,
    });
  }

  const isValid =
    levelName.trim().length >= 3 &&
    description.trim().length >= 10 &&
    minScore >= 0 &&
    maxScore <= 100 &&
    minScore <= maxScore;

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
            {initialData ? 'Edit Vendor Level' : 'Add Vendor Level'}
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
            {/* Validation Error */}
            {validationError && (
              <div
                style={{
                  background: 'var(--destructive)',
                  color: 'var(--destructive-foreground)',
                  padding: '12px',
                  borderRadius: 'var(--radius-card)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                  }}
                >
                  {validationError}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Level Number & Name - Two columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
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
                    Level # <span style={{ color: 'var(--destructive)' }}>*</span>
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
                </div>

                {/* Level Name */}
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
                    Level Name <span style={{ color: 'var(--destructive)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={levelName}
                    onChange={e => setLevelName(e.target.value)}
                    placeholder="e.g., Critical Vendor"
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
                </div>
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
                  placeholder="Describe what this vendor level represents..."
                  rows={3}
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
              </div>

              {/* Score Range - Two columns */}
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
                  Score Range <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minScore}
                      onChange={e => setMinScore(parseInt(e.target.value, 10))}
                      placeholder="Min"
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
                      Minimum (0-100)
                    </p>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={maxScore}
                      onChange={e => setMaxScore(parseInt(e.target.value, 10))}
                      placeholder="Max"
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
                      Maximum (0-100)
                    </p>
                  </div>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '6px 0 0 0',
                  }}
                >
                  Calculated vendor scores within this range will be assigned to this level
                </p>
              </div>

              {/* Color */}
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
                  Display Color <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <select
                  value={color}
                  onChange={e => setColor(e.target.value)}
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
                >
                  {COLOR_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    margin: '4px 0 0 0',
                  }}
                >
                  Color used for badges and visual indicators
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