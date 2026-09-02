import React, { useState, useEffect } from 'react';
import { X, Search, ShieldCheck } from 'lucide-react';
import {
  loadRegulationControlMappings,
  saveRegulationControlMappings,
  createMapping,
  getLinkedControlIds,
  type CoverageLevel,
  type ImplementationStatus,
  COVERAGE_LEVEL_LABELS,
  IMPLEMENTATION_STATUS_LABELS,
} from '../../data/regulationControlData';
import { loadControls, type Control } from '../../data/controlData';

interface LinkControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  regulationId: string;
  onSuccess: () => void;
}

export function LinkControlModal({ isOpen, onClose, regulationId, onSuccess }: LinkControlModalProps) {
  const [controls, setControls] = useState<Control[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [linkedControlIds, setLinkedControlIds] = useState<string[]>([]);

  // Form fields
  const [requirementText, setRequirementText] = useState('');
  const [coverageLevel, setCoverageLevel] = useState<CoverageLevel>('full');
  const [isPrimary, setIsPrimary] = useState(false);
  const [implementationStatus, setImplementationStatus] = useState<ImplementationStatus>('not-started');
  const [evidenceProvided, setEvidenceProvided] = useState(false);
  const [mappingNotes, setMappingNotes] = useState('');
  const [gapDescription, setGapDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      const allControls = loadControls();
      setControls(allControls);

      const mappings = loadRegulationControlMappings();
      const linked = getLinkedControlIds(mappings, regulationId);
      setLinkedControlIds(linked);
    }
  }, [isOpen, regulationId]);

  const filteredControls = controls.filter(c => {
    if (linkedControlIds.includes(c.id)) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.id.toLowerCase().includes(search) ||
      c.title.toLowerCase().includes(search) ||
      c.description.toLowerCase().includes(search)
    );
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedControl) {
      alert('Please select a control');
      return;
    }

    if (!requirementText.trim()) {
      alert('Requirement text is required');
      return;
    }

    const allMappings = loadRegulationControlMappings();
    const newMapping = createMapping(allMappings, {
      regulationId,
      controlId: selectedControl.id,
      requirementText: requirementText.trim(),
      coverageLevel,
      isPrimary,
      implementationStatus,
      evidenceProvided,
      mappingNotes: mappingNotes.trim(),
      gapDescription: gapDescription.trim() || null,
    });

    const updated = [...allMappings, newMapping];
    saveRegulationControlMappings(updated);
    onSuccess();
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        padding: '24px',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: '0px 8px 32px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
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
            Link Control to Regulation
          </h2>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Control Selection */}
              {!selectedControl ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '14px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      margin: 0,
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Select Control
                  </h3>

                  {/* Search */}
                  <div style={{ position: 'relative' }}>
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
                      placeholder="Search controls..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        height: '36px',
                        padding: '0 12px 0 36px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-input)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        color: 'var(--foreground)',
                        background: 'var(--background)',
                      }}
                    />
                  </div>

                  {/* Control List */}
                  <div
                    style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)',
                    }}
                  >
                    {filteredControls.length === 0 ? (
                      <div
                        style={{
                          padding: '48px 24px',
                          textAlign: 'center',
                          color: 'var(--muted-foreground)',
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                        }}
                      >
                        {searchTerm ? 'No controls found matching your search' : 'All controls are already linked'}
                      </div>
                    ) : (
                      filteredControls.map((control, idx) => (
                        <button
                          key={control.id}
                          type="button"
                          onClick={() => setSelectedControl(control)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: idx % 2 === 0 ? 'var(--card)' : 'var(--muted)',
                            borderBottom: '1px solid var(--border)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <ShieldCheck size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: 'var(--text-base)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--foreground)',
                                marginBottom: '2px',
                              }}
                            >
                              {control.title}
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '12px',
                                color: 'var(--muted-foreground)',
                              }}
                            >
                              {control.id} · {control.type}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected Control */}
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                          marginBottom: '2px',
                        }}
                      >
                        {selectedControl.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '12px',
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {selectedControl.id}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedControl(null)}
                      style={{
                        padding: '4px 10px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        cursor: 'pointer',
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* Mapping Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '14px',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--foreground)',
                        margin: 0,
                        paddingBottom: '8px',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      Mapping Details
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '14px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}
                      >
                        Requirement Text <span style={{ color: 'var(--destructive)' }}>*</span>
                      </label>
                      <textarea
                        value={requirementText}
                        onChange={e => setRequirementText(e.target.value)}
                        placeholder="Enter the specific requirement this control addresses"
                        rows={3}
                        required
                        style={{
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--foreground)',
                          }}
                        >
                          Coverage Level
                        </label>
                        <select
                          value={coverageLevel}
                          onChange={e => setCoverageLevel(e.target.value as CoverageLevel)}
                          style={{
                            height: '36px',
                            padding: '0 12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-input)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--foreground)',
                            background: 'var(--background)',
                            cursor: 'pointer',
                          }}
                        >
                          {(['full', 'partial', 'none'] as CoverageLevel[]).map(level => (
                            <option key={level} value={level}>
                              {COVERAGE_LEVEL_LABELS[level]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: '14px',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--foreground)',
                          }}
                        >
                          Implementation Status
                        </label>
                        <select
                          value={implementationStatus}
                          onChange={e => setImplementationStatus(e.target.value as ImplementationStatus)}
                          style={{
                            height: '36px',
                            padding: '0 12px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-input)',
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--foreground)',
                            background: 'var(--background)',
                            cursor: 'pointer',
                          }}
                        >
                          {(
                            ['not-started', 'in-progress', 'implemented', 'tested', 'verified'] as ImplementationStatus[]
                          ).map(status => (
                            <option key={status} value={status}>
                              {IMPLEMENTATION_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={isPrimary}
                          onChange={e => setIsPrimary(e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                          }}
                        />
                        <label
                          htmlFor="isPrimary"
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          Primary Control
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          id="evidenceProvided"
                          checked={evidenceProvided}
                          onChange={e => setEvidenceProvided(e.target.checked)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                          }}
                        />
                        <label
                          htmlFor="evidenceProvided"
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--foreground)',
                            cursor: 'pointer',
                          }}
                        >
                          Evidence Provided
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '14px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}
                      >
                        Mapping Notes
                      </label>
                      <textarea
                        value={mappingNotes}
                        onChange={e => setMappingNotes(e.target.value)}
                        placeholder="Optional notes about this mapping"
                        rows={2}
                        style={{
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: '14px',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--foreground)',
                        }}
                      >
                        Gap Description (if applicable)
                      </label>
                      <textarea
                        value={gapDescription}
                        onChange={e => setGapDescription(e.target.value)}
                        placeholder="Describe any gaps or areas for improvement"
                        rows={2}
                        style={{
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
                  </div>
                </>
              )}
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
                height: '36px',
                padding: '0 16px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-button)',
                background: 'var(--background)',
                color: 'var(--foreground)',
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
              disabled={!selectedControl}
              style={{
                height: '36px',
                padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-button)',
                background: selectedControl ? 'var(--primary)' : 'var(--muted)',
                color: selectedControl ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: selectedControl ? 'pointer' : 'not-allowed',
                opacity: selectedControl ? 1 : 0.6,
              }}
            >
              Link Control
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
