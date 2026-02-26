import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput } from '../shared/FormModal';
import type { Employer } from '../../data/employerData';
import { generateEmployerCode } from '../../data/employerData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Employer, 'id' | 'createdAt' | 'createdBy' | 'modifiedAt' | 'modifiedBy'>) => void;
  initialData?: Employer | null;
  allEmployers: Employer[];
  currentUser?: string;
}

type FormErrors = { name?: string; code?: string };

function empty(allEmployers: Employer[]): { name: string; code: string; isActive: boolean } {
  return { name: '', code: '', isActive: true };
}

export function EmployerFormModal({ isOpen, onClose, onSave, initialData, allEmployers, currentUser = 'Admin' }: Props) {
  const [form, setForm] = useState(empty(allEmployers));
  const [errors, setErrors] = useState<FormErrors>({});
  const [codeManuallySet, setCodeManuallySet] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({ name: initialData.name, code: initialData.code, isActive: initialData.isActive });
        setCodeManuallySet(true);
      } else {
        setForm(empty(allEmployers));
        setCodeManuallySet(false);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  function handleNameChange(val: string) {
    setForm(f => {
      const updated = { ...f, name: val };
      if (!codeManuallySet && !initialData) {
        updated.code = generateEmployerCode(val, allEmployers);
      }
      return updated;
    });
  }

  function handleCodeChange(val: string) {
    setCodeManuallySet(true);
    setForm(f => ({ ...f, code: val.toUpperCase() }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.code.trim()) errs.code = 'Code is required.';
    const duplicate = allEmployers.find(
      e => e.code.toUpperCase() === form.code.toUpperCase() && e.id !== initialData?.id,
    );
    if (duplicate) errs.code = 'This code is already in use.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({ name: form.name.trim(), code: form.code.trim().toUpperCase(), isActive: form.isActive });
  }

  const inputStyle: React.CSSProperties = {
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
    outline: 'none',
    boxSizing: 'border-box',
  };

  const radioLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontFamily: 'var(--font-family-primary)',
    fontSize: 'var(--text-base)',
    fontWeight: 'var(--font-weight-regular)',
    color: 'var(--foreground)',
  };

  return (
    <FormModal
      title={initialData ? 'Edit Employer' : 'Add Employer'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Employer'}
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Name */}
        <Field label="Employer Name" required error={errors.name}>
          <input
            style={{ ...inputStyle, borderColor: errors.name ? 'var(--destructive)' : 'var(--border)' }}
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Enter employer name"
          />
        </Field>

        {/* Code */}
        <Field
          label="Code"
          required
          helpText="Unique identifier — auto-generated from name, or enter manually."
          error={errors.code}
        >
          <input
            style={{ ...inputStyle, borderColor: errors.code ? 'var(--destructive)' : 'var(--border)' }}
            value={form.code}
            onChange={e => handleCodeChange(e.target.value)}
            placeholder="e.g. DMBA-001"
          />
        </Field>

        {/* Status — 2 options → radio buttons per guidelines */}
        <Field label="Status" required>
          <div style={{ display: 'flex', gap: '24px', paddingTop: '4px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="employer-status"
                checked={form.isActive === true}
                onChange={() => setForm(f => ({ ...f, isActive: true }))}
                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Active
            </label>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                name="employer-status"
                checked={form.isActive === false}
                onChange={() => setForm(f => ({ ...f, isActive: false }))}
                style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Inactive
            </label>
          </div>
        </Field>

        {/* Audit fields — read-only, shown in edit mode */}
        {initialData && (
          <div
            style={{
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px 24px',
            }}
          >
            {[
              { label: 'Created', value: initialData.createdAt },
              { label: 'Created By', value: initialData.createdBy },
              { label: 'Last Modified', value: initialData.modifiedAt },
              { label: 'Modified By', value: initialData.modifiedBy },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)',
                }}>
                  {label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-regular)', color: 'var(--foreground)',
                }}>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormModal>
  );
}
