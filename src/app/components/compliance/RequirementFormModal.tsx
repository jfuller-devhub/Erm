import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import type { FrameworkRequirement } from '../../data/frameworkRequirementData';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RequirementFormData = Omit<FrameworkRequirement, 'id'>;

interface RequirementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RequirementFormData) => void;
  initial?: FrameworkRequirement;
  /** Pre-set for new requirements */
  frameworkId: string;
  /** When adding a child requirement, pass the parent domain */
  parentDomain?: FrameworkRequirement;
  /** Is this framework HITRUST? Controls maturityLevel visibility */
  isHitrust: boolean;
  /** Existing domains for the framework (for the domain dropdown when adding at top-level) */
  existingDomains: FrameworkRequirement[];
}

export function RequirementFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
  frameworkId,
  parentDomain,
  isHitrust,
  existingDomains,
}: RequirementFormModalProps) {
  const isEditing = !!initial;
  const isDomainLevel = initial ? initial.parentRequirementId === '' : !parentDomain;

  const [referenceCode, setReferenceCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [maturityLevel, setMaturityLevel] = useState<string>('');
  const [isRequired, setIsRequired] = useState(true);
  const [sortOrder, setSortOrder] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setReferenceCode(initial.referenceCode);
        setTitle(initial.title);
        setDescription(initial.description);
        setDomain(initial.domain);
        setMaturityLevel(initial.maturityLevel !== null ? String(initial.maturityLevel) : '');
        setIsRequired(initial.isRequired);
        setSortOrder(String(initial.sortOrder));
      } else {
        setReferenceCode('');
        setTitle('');
        setDescription('');
        // When adding a child under a domain, pre-fill the domain label
        setDomain(parentDomain ? parentDomain.domain : '');
        setMaturityLevel('');
        setIsRequired(true);
        setSortOrder('');
      }
      setErrors({});
    }
  }, [isOpen, initial, parentDomain]);

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!referenceCode.trim()) errs.referenceCode = 'Reference code is required.';
    if (!title.trim()) errs.title = 'Title is required.';
    if (!domain.trim()) errs.domain = 'Domain is required.';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const parsedMaturity = maturityLevel ? parseInt(maturityLevel, 10) : null;
    const parsedSort = sortOrder ? parseInt(sortOrder, 10) : 0;

    onSave({
      frameworkId: initial?.frameworkId ?? frameworkId,
      parentRequirementId: initial
        ? initial.parentRequirementId
        : parentDomain
        ? parentDomain.id
        : '',
      referenceCode: referenceCode.trim(),
      title: title.trim(),
      description: description.trim(),
      domain: domain.trim(),
      maturityLevel: isHitrust ? parsedMaturity : null,
      isRequired,
      sortOrder: parsedSort,
    });
    onClose();
  }

  const modalTitle = isEditing
    ? isDomainLevel
      ? 'Edit Domain'
      : 'Edit Requirement'
    : isDomainLevel
    ? 'Add Domain'
    : 'Add Requirement';

  const submitLabel = isEditing ? 'Save Changes' : isDomainLevel ? 'Add Domain' : 'Add Requirement';

  return (
    <FormModal
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Reference Code" required error={errors.referenceCode}>
            <TextInput
              value={referenceCode}
              onChange={e => setReferenceCode(e.target.value)}
              placeholder={isDomainLevel ? 'e.g. 01, A.8, CC6' : 'e.g. 01.a, A.8.2, CC6.1'}
              hasError={!!errors.referenceCode}
            />
          </Field>
          <Field label="Sort Order" helpText="Numeric value to control display order.">
            <TextInput
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              placeholder="e.g. 100"
            />
          </Field>
        </div>

        <Field label="Title" required error={errors.title}>
          <TextInput
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={isDomainLevel ? 'e.g. Access Control' : 'e.g. Access Control Policy'}
            hasError={!!errors.title}
          />
        </Field>

        <Field label="Domain" required error={errors.domain} helpText="Top-level grouping label for this requirement.">
          {isDomainLevel && !isEditing ? (
            <TextInput
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. Access Control"
              hasError={!!errors.domain}
            />
          ) : !isDomainLevel && !isEditing && parentDomain ? (
            /* Child requirement: domain is inherited from parent, shown read-only */
            <TextInput
              value={domain}
              readOnly
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', cursor: 'default' }}
            />
          ) : (
            <TextInput
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. Access Control"
              hasError={!!errors.domain}
            />
          )}
        </Field>

        <Field label="Description">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the requirement scope, intent, and applicability..."
            rows={4}
          />
        </Field>

        {/* Maturity Level — only for HITRUST frameworks */}
        {isHitrust && (
          <Field
            label="Implementation Level"
            helpText="HITRUST implementation level (1-3). Leave blank for domain-level requirements."
          >
            <SelectInput value={maturityLevel} onChange={e => setMaturityLevel(e.target.value)}>
              <option value="">— Not Set —</option>
              <option value="1">1 — Foundational</option>
              <option value="2">2 — Managed</option>
              <option value="3">3 — Advanced</option>
            </SelectInput>
          </Field>
        )}

        {/* Is Required — 2 options → radio buttons per Appian guidelines */}
        <Field label="Required" helpText="Is this requirement mandatory for compliance?">
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
                name="isRequired"
                checked={isRequired}
                onChange={() => setIsRequired(true)}
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
                name="isRequired"
                checked={!isRequired}
                onChange={() => setIsRequired(false)}
                style={{ accentColor: 'var(--primary)' }}
              />
              No
            </label>
          </div>
        </Field>
      </div>
    </FormModal>
  );
}
