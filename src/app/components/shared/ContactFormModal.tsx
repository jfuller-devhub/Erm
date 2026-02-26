import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from './FormModal';
import { useApp } from '../../context/AppContext';
import type { VendorContact, ContactType } from '../../data/mockData';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<VendorContact, 'id'>) => void;
  vendorId: string;
  initialData?: VendorContact | null;
}

type FormErrors = Partial<Record<keyof VendorContact, string>>;

function emptyForm(vendorId: string): Omit<VendorContact, 'id'> {
  return {
    vendorId,
    name: '',
    title: '',
    email: '',
    phone: '',
    type: 'External',
    department: '',
    notes: '',
  };
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSave,
  vendorId,
  initialData,
}: ContactFormModalProps) {
  const { getActiveOptions } = useApp();
  const contactTypes = getActiveOptions('Contact', 'Type');

  const [form, setForm] = useState<Omit<VendorContact, 'id'>>(emptyForm(vendorId));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              vendorId: initialData.vendorId,
              name: initialData.name,
              title: initialData.title,
              email: initialData.email,
              phone: initialData.phone,
              type: initialData.type,
              department: initialData.department,
              notes: initialData.notes,
            }
          : emptyForm(vendorId)
      );
      setErrors({});
    }
  }, [isOpen, initialData, vendorId]);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Contact name is required.';
    if (!form.email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(form);
    onClose();
  }

  return (
    <FormModal
      title={initialData ? 'Edit Contact' : 'Add Contact'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Contact'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Row 1: Name + Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Full Name" required error={errors.name}>
            <TextInput
              value={form.name}
              onChange={e => set('name', e.target.value)}
              hasError={!!errors.name}
              placeholder="e.g. Jane Smith"
            />
          </Field>
          <Field label="Contact Type" required>
            <SelectInput
              value={form.type}
              onChange={e => set('type', e.target.value)}
            >
              {contactTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Row 2: Title + Department */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Job Title" helpText="Role or position at the organization.">
            <TextInput
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Account Executive"
            />
          </Field>
          <Field label="Department" helpText="Team or business unit.">
            <TextInput
              value={form.department}
              onChange={e => set('department', e.target.value)}
              placeholder="e.g. Client Services"
            />
          </Field>
        </div>

        {/* Row 3: Email + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Email Address" required error={errors.email}>
            <TextInput
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              hasError={!!errors.email}
              placeholder="contact@company.com"
            />
          </Field>
          <Field label="Phone Number" helpText="Include country code for international numbers.">
            <TextInput
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </Field>
        </div>

        {/* Row 4: Notes */}
        <Field label="Notes" helpText="Any relevant context about this contact.">
          <TextareaInput
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Add any relevant notes..."
          />
        </Field>
      </div>
    </FormModal>
  );
}