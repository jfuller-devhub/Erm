import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldCheck, BookOpen } from 'lucide-react';
import { FormModal, Field, SelectInput, TextareaInput, TextInput } from '../shared/FormModal';
import { useApp } from '../../context/AppContext';
import type { ComplianceFramework } from '../../data/complianceFrameworkData';
import type { FrameworkRequirement } from '../../data/frameworkRequirementData';
import { getRequirementsForFramework, getChildRequirements } from '../../data/frameworkRequirementData';
import type { Control } from '../../data/controlData';
import type { ControlRequirementMapping, ImplementationStatus } from '../../data/controlRequirementData';
import {
  IMPLEMENTATION_STATUS_LABELS,
} from '../../data/controlRequirementData';

// ─── Link a Control to a Framework Requirement ──────────────────────────────

interface LinkControlToRequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: Omit<ControlRequirementMapping, 'id' | 'lastAssessedDate' | 'assessor'>) => void;
  controlId: string;
  frameworks: ComplianceFramework[];
  requirements: FrameworkRequirement[];
  existingMappings: ControlRequirementMapping[];
}

export function LinkControlToRequirementModal({
  isOpen,
  onClose,
  onSave,
  controlId,
  frameworks,
  requirements,
  existingMappings,
}: LinkControlToRequirementModalProps) {
  const { getActiveOptions } = useApp();
  const implStatusOpts = getActiveOptions('Compliance', 'Implementation Status');

  const [selectedFrameworkId, setSelectedFrameworkId] = useState('');
  const [selectedRequirementId, setSelectedRequirementId] = useState('');
  const [implementationStatus, setImplementationStatus] = useState<ImplementationStatus>('not_started');
  const [maturityScore, setMaturityScore] = useState<string>('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [gapNotes, setGapNotes] = useState('');
  const [remediationTargetDate, setRemediationTargetDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get leaf requirements (children of domains) for the selected framework
  const availableRequirements = useMemo(() => {
    if (!selectedFrameworkId) return [];
    const frameworkReqs = getRequirementsForFramework(requirements, selectedFrameworkId);
    // Get only leaf-level requirements (those that have a parent)
    return frameworkReqs.filter(r => r.parentRequirementId !== '');
  }, [requirements, selectedFrameworkId]);

  // Filter out already-mapped requirements
  const unmappedRequirements = useMemo(() => {
    const existingReqIds = new Set(
      existingMappings.filter(m => m.controlId === controlId).map(m => m.requirementId)
    );
    return availableRequirements.filter(r => !existingReqIds.has(r.id));
  }, [availableRequirements, existingMappings, controlId]);

  // Is this a HITRUST framework?
  const isHitrust = useMemo(() => {
    const fw = frameworks.find(f => f.id === selectedFrameworkId);
    return fw?.name?.toLowerCase().includes('hitrust') ?? false;
  }, [frameworks, selectedFrameworkId]);

  useEffect(() => {
    if (isOpen) {
      setSelectedFrameworkId('');
      setSelectedRequirementId('');
      setImplementationStatus('not_started');
      setMaturityScore('');
      setEvidenceDescription('');
      setGapNotes('');
      setRemediationTargetDate('');
      setErrors({});
    }
  }, [isOpen]);

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!selectedFrameworkId) errs.framework = 'Select a framework.';
    if (!selectedRequirementId) errs.requirement = 'Select a requirement.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      controlId,
      requirementId: selectedRequirementId,
      implementationStatus,
      maturityScore: maturityScore ? parseInt(maturityScore, 10) : null,
      evidenceDescription: evidenceDescription.trim(),
      gapNotes: gapNotes.trim(),
      remediationTargetDate,
    });
    onClose();
  }

  return (
    <FormModal
      title="Link to Framework Requirement"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Link Requirement"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Framework selection — 3+ options → dropdown */}
        <Field label="Framework" required error={errors.framework}>
          <SelectInput
            value={selectedFrameworkId}
            onChange={e => { setSelectedFrameworkId(e.target.value); setSelectedRequirementId(''); }}
            hasError={!!errors.framework}
          >
            <option value="">— Select Framework —</option>
            {frameworks.map(f => (
              <option key={f.id} value={f.id}>{f.name} {f.version}</option>
            ))}
          </SelectInput>
        </Field>

        {/* Requirement selection */}
        {selectedFrameworkId && (
          <Field label="Requirement" required error={errors.requirement}>
            {unmappedRequirements.length === 0 ? (
              <div
                style={{
                  padding: '12px',
                  background: 'var(--muted)',
                  borderRadius: 'var(--radius-input)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--muted-foreground)',
                  textAlign: 'center',
                }}
              >
                All requirements for this framework are already mapped to this control.
              </div>
            ) : (
              <SelectInput
                value={selectedRequirementId}
                onChange={e => setSelectedRequirementId(e.target.value)}
                hasError={!!errors.requirement}
              >
                <option value="">— Select Requirement —</option>
                {unmappedRequirements.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.referenceCode} — {r.title}
                  </option>
                ))}
              </SelectInput>
            )}
          </Field>
        )}

        {/* Implementation Status */}
        <Field label="Implementation Status">
          <SelectInput
            value={implementationStatus}
            onChange={e => setImplementationStatus(e.target.value as ImplementationStatus)}
          >
            {implStatusOpts.map(s => (
              <option key={s} value={s}>{IMPLEMENTATION_STATUS_LABELS[s as ImplementationStatus] ?? s}</option>
            ))}
          </SelectInput>
        </Field>

        {/* Maturity Score — only for HITRUST */}
        {isHitrust && (
          <Field
            label="Maturity Score (PRISMA)"
            helpText="HITRUST CSF uses a 1-5 maturity scale: 1=Policy, 2=Procedure, 3=Implemented, 4=Measured, 5=Managed"
          >
            <SelectInput value={maturityScore} onChange={e => setMaturityScore(e.target.value)}>
              <option value="">— Not Scored —</option>
              <option value="1">1 — Policy</option>
              <option value="2">2 — Procedure</option>
              <option value="3">3 — Implemented</option>
              <option value="4">4 — Measured</option>
              <option value="5">5 — Managed</option>
            </SelectInput>
          </Field>
        )}

        {/* Evidence */}
        <Field label="Evidence Description" helpText="Describe the evidence that demonstrates compliance.">
          <TextareaInput
            value={evidenceDescription}
            onChange={e => setEvidenceDescription(e.target.value)}
            placeholder="e.g. Quarterly access reviews with sign-off sheets..."
            rows={3}
          />
        </Field>

        {/* Gap Notes */}
        <Field label="Gap Notes" helpText="Describe any gaps in meeting this requirement.">
          <TextareaInput
            value={gapNotes}
            onChange={e => setGapNotes(e.target.value)}
            placeholder="e.g. Missing formal testing procedure..."
            rows={2}
          />
        </Field>

        {/* Remediation target */}
        {(implementationStatus === 'not_started' || implementationStatus === 'in_progress') && (
          <Field label="Remediation Target Date">
            <TextInput
              type="date"
              value={remediationTargetDate}
              onChange={e => setRemediationTargetDate(e.target.value)}
            />
          </Field>
        )}
      </div>
    </FormModal>
  );
}

// ─── Link a Requirement to a Control (from Framework Detail page) ────────────

interface LinkRequirementToControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mapping: Omit<ControlRequirementMapping, 'id' | 'lastAssessedDate' | 'assessor'>) => void;
  requirementId: string;
  isHitrust: boolean;
  controls: Control[];
  existingMappings: ControlRequirementMapping[];
}

export function LinkRequirementToControlModal({
  isOpen,
  onClose,
  onSave,
  requirementId,
  isHitrust,
  controls,
  existingMappings,
}: LinkRequirementToControlModalProps) {
  const { getActiveOptions } = useApp();
  const implStatusOpts = getActiveOptions('Compliance', 'Implementation Status');

  const [selectedControlId, setSelectedControlId] = useState('');
  const [implementationStatus, setImplementationStatus] = useState<ImplementationStatus>('not_started');
  const [maturityScore, setMaturityScore] = useState<string>('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [gapNotes, setGapNotes] = useState('');
  const [remediationTargetDate, setRemediationTargetDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter out already-mapped controls
  const unmappedControls = useMemo(() => {
    const existingControlIds = new Set(
      existingMappings.filter(m => m.requirementId === requirementId).map(m => m.controlId)
    );
    return controls.filter(c => !existingControlIds.has(c.id));
  }, [controls, existingMappings, requirementId]);

  const filteredControls = useMemo(() => {
    if (!searchTerm.trim()) return unmappedControls;
    const q = searchTerm.toLowerCase();
    return unmappedControls.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  }, [unmappedControls, searchTerm]);

  useEffect(() => {
    if (isOpen) {
      setSelectedControlId('');
      setImplementationStatus('not_started');
      setMaturityScore('');
      setEvidenceDescription('');
      setGapNotes('');
      setRemediationTargetDate('');
      setSearchTerm('');
      setErrors({});
    }
  }, [isOpen]);

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!selectedControlId) errs.control = 'Select a control.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    onSave({
      controlId: selectedControlId,
      requirementId,
      implementationStatus,
      maturityScore: maturityScore ? parseInt(maturityScore, 10) : null,
      evidenceDescription: evidenceDescription.trim(),
      gapNotes: gapNotes.trim(),
      remediationTargetDate,
    });
    onClose();
  }

  return (
    <FormModal
      title="Map Control to Requirement"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Map Control"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Control selection */}
        <Field label="Control" required error={errors.control}>
          {filteredControls.length === 0 && unmappedControls.length === 0 ? (
            <div
              style={{
                padding: '12px',
                background: 'var(--muted)',
                borderRadius: 'var(--radius-input)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                color: 'var(--muted-foreground)',
                textAlign: 'center',
              }}
            >
              All controls are already mapped to this requirement.
            </div>
          ) : (
            <>
              {/* Search */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
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
                  placeholder="Search controls..."
                  style={{
                    height: '36px',
                    width: '100%',
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-input)',
                    background: 'var(--input-background)',
                    color: 'var(--foreground)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {/* Scrollable list */}
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-input)',
                }}
              >
                {filteredControls.map(c => (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: selectedControlId === c.id ? 'rgba(35,34,240,0.06)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <input
                      type="radio"
                      name="ctlSelect"
                      checked={selectedControlId === c.id}
                      onChange={() => setSelectedControlId(c.id)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        {c.id} · {c.department}
                      </div>
                    </div>
                  </label>
                ))}
                {filteredControls.length === 0 && (
                  <div
                    style={{
                      padding: '16px',
                      textAlign: 'center',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    No matching controls found.
                  </div>
                )}
              </div>
            </>
          )}
        </Field>

        {/* Implementation Status */}
        <Field label="Implementation Status">
          <SelectInput
            value={implementationStatus}
            onChange={e => setImplementationStatus(e.target.value as ImplementationStatus)}
          >
            {implStatusOpts.map(s => (
              <option key={s} value={s}>{IMPLEMENTATION_STATUS_LABELS[s as ImplementationStatus] ?? s}</option>
            ))}
          </SelectInput>
        </Field>

        {/* Maturity Score — only for HITRUST */}
        {isHitrust && (
          <Field
            label="Maturity Score (PRISMA)"
            helpText="1=Policy, 2=Procedure, 3=Implemented, 4=Measured, 5=Managed"
          >
            <SelectInput value={maturityScore} onChange={e => setMaturityScore(e.target.value)}>
              <option value="">— Not Scored —</option>
              <option value="1">1 — Policy</option>
              <option value="2">2 — Procedure</option>
              <option value="3">3 — Implemented</option>
              <option value="4">4 — Measured</option>
              <option value="5">5 — Managed</option>
            </SelectInput>
          </Field>
        )}

        {/* Evidence */}
        <Field label="Evidence Description">
          <TextareaInput
            value={evidenceDescription}
            onChange={e => setEvidenceDescription(e.target.value)}
            placeholder="Describe evidence of compliance..."
            rows={3}
          />
        </Field>

        {/* Gap Notes */}
        <Field label="Gap Notes">
          <TextareaInput
            value={gapNotes}
            onChange={e => setGapNotes(e.target.value)}
            placeholder="Describe any gaps..."
            rows={2}
          />
        </Field>
      </div>
    </FormModal>
  );
}