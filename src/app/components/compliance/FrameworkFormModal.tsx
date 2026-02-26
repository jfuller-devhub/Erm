import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { useApp } from '../../context/AppContext';
import type { ComplianceFramework, FrameworkStatus } from '../../data/complianceFrameworkData';
import { FRAMEWORK_STATUS_LABELS } from '../../data/complianceFrameworkData';

interface FrameworkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ComplianceFramework, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initial?: ComplianceFramework;
}

export function FrameworkFormModal({ isOpen, onClose, onSave, initial }: FrameworkFormModalProps) {
  const { getActiveOptions } = useApp();
  const frameworkStatuses = getActiveOptions('Framework', 'Status');

  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [governingBody, setGoverningBody] = useState('');
  const [status, setStatus] = useState<FrameworkStatus>('draft');
  const [certificationRequired, setCertificationRequired] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [nextAssessmentDate, setNextAssessmentDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setName(initial.name);
        setVersion(initial.version);
        setGoverningBody(initial.governingBody);
        setStatus(initial.status);
        setCertificationRequired(initial.certificationRequired);
        setEffectiveDate(initial.effectiveDate);
        setNextAssessmentDate(initial.nextAssessmentDate);
        setDescription(initial.description);
      } else {
        setName('');
        setVersion('');
        setGoverningBody('');
        setStatus('draft');
        setCertificationRequired(false);
        setEffectiveDate('');
        setNextAssessmentDate('');
        setDescription('');
      }
      setErrors({});
    }
  }, [isOpen, initial]);

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Framework name is required.';
    if (!version.trim()) errs.version = 'Version is required.';
    if (!governingBody.trim()) errs.governingBody = 'Governing body is required.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({
      name: name.trim(),
      version: version.trim(),
      governingBody: governingBody.trim(),
      status,
      certificationRequired,
      effectiveDate,
      nextAssessmentDate,
      description: description.trim(),
    });
    onClose();
  }

  return (
    <FormModal
      title={initial ? 'Edit Framework' : 'Add Framework'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initial ? 'Save Changes' : 'Add Framework'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Framework Name" required error={errors.name}>
            <TextInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. HITRUST CSF"
              hasError={!!errors.name}
            />
          </Field>
          <Field label="Version" required error={errors.version}>
            <TextInput
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="e.g. v11.3"
              hasError={!!errors.version}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Governing Body" required error={errors.governingBody}>
            <TextInput
              value={governingBody}
              onChange={e => setGoverningBody(e.target.value)}
              placeholder="e.g. HITRUST Alliance"
              hasError={!!errors.governingBody}
            />
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={e => setStatus(e.target.value as FrameworkStatus)}>
              {frameworkStatuses.map(s => (
                <option key={s} value={s}>{FRAMEWORK_STATUS_LABELS[s as FrameworkStatus] ?? s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Effective Date">
            <TextInput type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
          </Field>
          <Field label="Next Assessment Date">
            <TextInput type="date" value={nextAssessmentDate} onChange={e => setNextAssessmentDate(e.target.value)} />
          </Field>
        </div>

        {/* Certification Required — 2 options → radio buttons per Appian guidelines */}
        <Field label="Certification Required" helpText="Does this framework require formal certification or attestation?">
          <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
            <label
              style={{
                display: 'flex',
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
                name="certReq"
                checked={certificationRequired}
                onChange={() => setCertificationRequired(true)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Yes
            </label>
            <label
              style={{
                display: 'flex',
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
                name="certReq"
                checked={!certificationRequired}
                onChange={() => setCertificationRequired(false)}
                style={{ accentColor: 'var(--primary)' }}
              />
              No
            </label>
          </div>
        </Field>

        <Field label="Description">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the framework scope, purpose, and applicability..."
            rows={4}
          />
        </Field>
      </div>
    </FormModal>
  );
}