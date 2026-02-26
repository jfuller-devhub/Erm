import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldAlert, ShieldCheck, Link2 } from 'lucide-react';
import { FormModal, Field, SelectInput, TextareaInput } from '../shared/FormModal';
import type { Risk } from '../../data/riskData';
import type { Control } from '../../data/controlData';
import type { RiskControl, CoverageLevel } from '../../data/riskControlData';
import {
  COVERAGE_LEVELS, COVERAGE_LEVEL_LABELS,
} from '../../data/riskControlData';

// ─── Link a Control to a Risk ────────────────────────────────────────────────

interface LinkControlToRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: Omit<RiskControl, 'createdAt' | 'createdBy'>) => void;
  riskId: string;
  controls: Control[];
  existingMappings: RiskControl[];
}

export function LinkControlToRiskModal({
  isOpen,
  onClose,
  onSave,
  riskId,
  controls,
  existingMappings,
}: LinkControlToRiskModalProps) {
  const [selectedControlId, setSelectedControlId] = useState('');
  const [coverageLevel, setCoverageLevel] = useState<CoverageLevel>('partial');
  const [isPrimary, setIsPrimary] = useState(false);
  const [mappingNotes, setMappingNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existingControlIds = useMemo(
    () => new Set(existingMappings.filter(m => m.riskId === riskId).map(m => m.controlId)),
    [existingMappings, riskId]
  );

  const availableControls = useMemo(() => {
    return controls
      .filter(c => !existingControlIds.has(c.id))
      .filter(c => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(term) ||
               c.frameworkRef.toLowerCase().includes(term) ||
               c.department.toLowerCase().includes(term);
      });
  }, [controls, existingControlIds, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSelectedControlId('');
      setCoverageLevel('partial');
      setIsPrimary(false);
      setMappingNotes('');
      setSearchTerm('');
      setErrors({});
    }
  }, [isOpen]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!selectedControlId) e.controlId = 'Please select a control.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      riskId,
      controlId: selectedControlId,
      coverageLevel,
      isPrimary,
      mappingNotes,
    });
    onClose();
  }

  const selectedControl = controls.find(c => c.id === selectedControlId);

  return (
    <FormModal
      title="Link Control to Risk"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Link Control"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search & select a control */}
        <Field label="Select Control" required error={errors.controlId}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search controls by name, framework, or department..."
              style={{
                height: '36px',
                padding: '0 12px 0 32px',
                border: `1px solid ${errors.controlId ? 'var(--destructive)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </Field>

        {/* Controls list */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'var(--card)',
          }}
        >
          {availableControls.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
              }}
            >
              {controls.length === existingControlIds.size
                ? 'All controls are already linked to this risk.'
                : 'No controls match your search.'}
            </div>
          ) : (
            availableControls.map(ctrl => {
              const isSelected = selectedControlId === ctrl.id;
              return (
                <div
                  key={ctrl.id}
                  onClick={() => setSelectedControlId(ctrl.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(35,34,240,0.06)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <ShieldCheck
                    size={16}
                    style={{
                      color: isSelected ? 'var(--primary)' : 'var(--muted-foreground)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ctrl.name}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        display: 'flex',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <span>{ctrl.id}</span>
                      <span>{ctrl.department}</span>
                      {ctrl.frameworkRef && <span>{ctrl.frameworkRef}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected control summary */}
        {selectedControl && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(35,34,240,0.04)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid rgba(35,34,240,0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--primary)',
                marginBottom: '4px',
              }}
            >
              <Link2 size={12} />
              Selected: {selectedControl.name}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                lineHeight: '18px',
              }}
            >
              {selectedControl.description
                ? (selectedControl.description.length > 150
                  ? selectedControl.description.slice(0, 150) + '...'
                  : selectedControl.description)
                : 'No description available.'}
            </div>
          </div>
        )}

        {/* Coverage Level & Primary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Coverage Level" required>
            <SelectInput
              value={coverageLevel}
              onChange={e => setCoverageLevel(e.target.value as CoverageLevel)}
            >
              {COVERAGE_LEVELS.map(cl => (
                <option key={cl} value={cl}>{COVERAGE_LEVEL_LABELS[cl]}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Primary Control?">
            <div style={{ display: 'flex', gap: '16px', paddingTop: '4px' }}>
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map(opt => (
                <label
                  key={String(opt.value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="isPrimary"
                    checked={isPrimary === opt.value}
                    onChange={() => setIsPrimary(opt.value)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Mapping Notes */}
        <Field label="Mapping Notes" helpText="Explain how this control relates to the risk.">
          <TextareaInput
            value={mappingNotes}
            onChange={e => setMappingNotes(e.target.value)}
            placeholder="Optional explanation of how this control addresses the risk..."
            rows={2}
          />
        </Field>
      </div>
    </FormModal>
  );
}

// ─── Link a Risk to a Control ────────────────────────────────────────────────

interface LinkRiskToControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: Omit<RiskControl, 'createdAt' | 'createdBy'>) => void;
  controlId: string;
  risks: Risk[];
  existingMappings: RiskControl[];
}

export function LinkRiskToControlModal({
  isOpen,
  onClose,
  onSave,
  controlId,
  risks,
  existingMappings,
}: LinkRiskToControlModalProps) {
  const [selectedRiskId, setSelectedRiskId] = useState('');
  const [coverageLevel, setCoverageLevel] = useState<CoverageLevel>('partial');
  const [isPrimary, setIsPrimary] = useState(false);
  const [mappingNotes, setMappingNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existingRiskIds = useMemo(
    () => new Set(existingMappings.filter(m => m.controlId === controlId).map(m => m.riskId)),
    [existingMappings, controlId]
  );

  const availableRisks = useMemo(() => {
    return risks
      .filter(r => !existingRiskIds.has(r.id))
      .filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return r.title.toLowerCase().includes(term) ||
               r.id.toLowerCase().includes(term) ||
               r.department.toLowerCase().includes(term);
      });
  }, [risks, existingRiskIds, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSelectedRiskId('');
      setCoverageLevel('partial');
      setIsPrimary(false);
      setMappingNotes('');
      setSearchTerm('');
      setErrors({});
    }
  }, [isOpen]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!selectedRiskId) e.riskId = 'Please select a risk.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      riskId: selectedRiskId,
      controlId,
      coverageLevel,
      isPrimary,
      mappingNotes,
    });
    onClose();
  }

  const selectedRisk = risks.find(r => r.id === selectedRiskId);

  return (
    <FormModal
      title="Link Risk to Control"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Link Risk"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search */}
        <Field label="Select Risk" required error={errors.riskId}>
          <div style={{ position: 'relative' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted-foreground)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search risks by title, ID, or department..."
              style={{
                height: '36px',
                padding: '0 12px 0 32px',
                border: `1px solid ${errors.riskId ? 'var(--destructive)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: 'var(--input-background)',
                color: 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-regular)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </Field>

        {/* Risk list */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'var(--card)',
          }}
        >
          {availableRisks.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
              }}
            >
              {risks.length === existingRiskIds.size
                ? 'All risks are already linked to this control.'
                : 'No risks match your search.'}
            </div>
          ) : (
            availableRisks.map(risk => {
              const isSelected = selectedRiskId === risk.id;
              return (
                <div
                  key={risk.id}
                  onClick={() => setSelectedRiskId(risk.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(35,34,240,0.06)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--muted)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }}
                >
                  <ShieldAlert
                    size={16}
                    style={{
                      color: isSelected ? 'var(--primary)' : 'var(--muted-foreground)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {risk.title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        display: 'flex',
                        gap: '8px',
                        marginTop: '2px',
                      }}
                    >
                      <span>{risk.id}</span>
                      <span>{risk.department}</span>
                      <span style={{ textTransform: 'capitalize' }}>{risk.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected risk summary */}
        {selectedRisk && (
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(35,34,240,0.04)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid rgba(35,34,240,0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--primary)',
                marginBottom: '4px',
              }}
            >
              <Link2 size={12} />
              Selected: {selectedRisk.title}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                lineHeight: '18px',
              }}
            >
              {selectedRisk.description
                ? (selectedRisk.description.length > 150
                  ? selectedRisk.description.slice(0, 150) + '...'
                  : selectedRisk.description)
                : 'No description available.'}
            </div>
          </div>
        )}

        {/* Coverage Level & Primary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Coverage Level" required>
            <SelectInput
              value={coverageLevel}
              onChange={e => setCoverageLevel(e.target.value as CoverageLevel)}
            >
              {COVERAGE_LEVELS.map(cl => (
                <option key={cl} value={cl}>{COVERAGE_LEVEL_LABELS[cl]}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Primary Control?">
            <div style={{ display: 'flex', gap: '16px', paddingTop: '4px' }}>
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map(opt => (
                <label
                  key={String(opt.value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--foreground)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="isPrimaryRisk"
                    checked={isPrimary === opt.value}
                    onChange={() => setIsPrimary(opt.value)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Mapping Notes */}
        <Field label="Mapping Notes" helpText="Explain how this control relates to the risk.">
          <TextareaInput
            value={mappingNotes}
            onChange={e => setMappingNotes(e.target.value)}
            placeholder="Optional explanation..."
            rows={2}
          />
        </Field>
      </div>
    </FormModal>
  );
}