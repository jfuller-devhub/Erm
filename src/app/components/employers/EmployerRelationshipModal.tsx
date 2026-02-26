import React, { useState, useEffect } from 'react';
import { FormModal, Field } from '../shared/FormModal';
import type { Employer, EmployerRelationship, EmployerRelationshipType } from '../../data/employerData';
import { RELATIONSHIP_TYPE_OPTIONS, RELATIONSHIP_TYPE_LABELS } from '../../data/employerData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (relatedEmployerId: string, relationshipType: EmployerRelationshipType) => void;
  currentEmployer: Employer;
  allEmployers: Employer[];
  existingRelationships: EmployerRelationship[];
  editingRelationship?: EmployerRelationship | null;
}

type FormErrors = { relatedEmployerId?: string; relationshipType?: string };

export function EmployerRelationshipModal({
  isOpen,
  onClose,
  onSave,
  currentEmployer,
  allEmployers,
  existingRelationships,
  editingRelationship,
}: Props) {
  const [relatedId, setRelatedId]       = useState('');
  const [relType,   setRelType]         = useState<EmployerRelationshipType>('Affiliate');
  const [errors,    setErrors]          = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (editingRelationship) {
        // Determine "the other side" of the relationship
        const otherId =
          editingRelationship.employerId === currentEmployer.id
            ? editingRelationship.relatedEmployerId
            : editingRelationship.employerId;
        setRelatedId(otherId);
        setRelType(editingRelationship.relationshipType);
      } else {
        setRelatedId('');
        setRelType('Affiliate');
      }
      setErrors({});
    }
  }, [isOpen, editingRelationship, currentEmployer.id]);

  // Employers already related to currentEmployer (exclude when adding new)
  const alreadyRelatedIds = new Set(
    existingRelationships
      .filter(r => r.id !== editingRelationship?.id)
      .flatMap(r => [r.employerId, r.relatedEmployerId])
      .filter(id => id !== currentEmployer.id),
  );

  const availableEmployers = allEmployers.filter(
    e => e.id !== currentEmployer.id && !alreadyRelatedIds.has(e.id),
  );

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!relatedId) errs.relatedEmployerId = 'Please select a related employer.';
    if (!relType)   errs.relationshipType  = 'Please select a relationship type.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(relatedId, relType);
  }

  const selectStyle: React.CSSProperties = {
    height: '36px',
    padding: '0 10px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-input)',
    background: 'var(--input-background)',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-regular)',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <FormModal
      title={editingRelationship ? 'Edit Relationship' : 'Add Employer Relationship'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={editingRelationship ? 'Save Changes' : 'Add Relationship'}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Source employer — read-only context */}
        <div style={{
          background: 'var(--muted)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
            whiteSpace: 'nowrap',
          }}>
            Source Employer
          </span>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
          }}>
            {currentEmployer.name}
          </span>
          <span style={{
            fontFamily: 'var(--font-family-primary)', fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)', color: 'var(--muted-foreground)',
          }}>
            ({currentEmployer.code})
          </span>
        </div>

        {/* Related Employer — dropdown (3+ options → per guidelines) */}
        <Field label="Related Employer" required error={errors.relatedEmployerId}
          helpText="Select the employer to create a relationship with.">
          <select
            value={relatedId}
            onChange={e => setRelatedId(e.target.value)}
            style={{ ...selectStyle, borderColor: errors.relatedEmployerId ? 'var(--destructive)' : 'var(--border)' }}
          >
            <option value="">— Select employer —</option>
            {editingRelationship && relatedId && !availableEmployers.find(e => e.id === relatedId) && (
              /* Keep the current value visible during edit even if it would be filtered */
              (() => {
                const e = allEmployers.find(emp => emp.id === relatedId);
                return e ? <option key={e.id} value={e.id}>{e.name} ({e.code})</option> : null;
              })()
            )}
            {availableEmployers.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
            ))}
          </select>
        </Field>

        {/* Relationship Type — dropdown (6 options → per guidelines) */}
        <Field label="Relationship Type" required error={errors.relationshipType}
          helpText="Describes the nature of the relationship between the two employers.">
          <select
            value={relType}
            onChange={e => setRelType(e.target.value as EmployerRelationshipType)}
            style={{ ...selectStyle, borderColor: errors.relationshipType ? 'var(--destructive)' : 'var(--border)' }}
          >
            {RELATIONSHIP_TYPE_OPTIONS.map(t => (
              <option key={t} value={t}>{RELATIONSHIP_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </Field>

      </div>
    </FormModal>
  );
}
