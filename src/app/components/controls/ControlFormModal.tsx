import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { Control, ControlType, ControlFrequency, ControlEffectiveness, ControlStatus } from '../../data/controlData';
import {
  CONTROL_TYPE_LABELS, CONTROL_FREQUENCY_LABELS, CONTROL_EFFECTIVENESS_LABELS,
  CONTROL_STATUS_LABELS,
} from '../../data/controlData';

interface ControlFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Control | null;
}

type FormErrors = Partial<Record<string, string>>;

const EMPTY: Omit<Control, 'id' | 'createdAt' | 'updatedAt'> = {
  owner: null,
  department: '',
  name: '',
  description: '',
  controlType: 'preventive',
  frequency: 'quarterly',
  effectiveness: 'not_tested',
  isAutomated: false,
  lastTestedDate: '',
  nextTestDate: '',
  status: 'in_design',
  frameworkRef: '',
};

export function ControlFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ControlFormModalProps) {
  const { getActiveOptions } = useApp();
  const controlTypes      = getActiveOptions('Control', 'Type');
  const controlFreqs      = getActiveOptions('Control', 'Frequency');
  const controlStatuses   = getActiveOptions('Control', 'Status');
  const controlEffects    = getActiveOptions('Control', 'Effectiveness');
  const departments       = getActiveOptions('Control', 'Department');

  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          owner: initialData.owner,
          department: initialData.department,
          name: initialData.name,
          description: initialData.description,
          controlType: initialData.controlType,
          frequency: initialData.frequency,
          effectiveness: initialData.effectiveness,
          isAutomated: initialData.isAutomated,
          lastTestedDate: initialData.lastTestedDate,
          nextTestDate: initialData.nextTestDate,
          status: initialData.status,
          frameworkRef: initialData.frameworkRef,
        });
      } else {
        setForm({ ...EMPTY });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'Control name is required.';
    if (!form.department) e.department = 'Department is required.';
    if (!form.controlType) e.controlType = 'Control type is required.';
    if (!form.frequency) e.frequency = 'Frequency is required.';
    if (!form.status) e.status = 'Status is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave(form);
    onClose();
  }

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  return (
    <FormModal
      title={initialData ? 'Edit Control' : 'Add Control'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Control'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name */}
        <Field label="Control Name" required error={errors.name}>
          <TextInput
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Mandatory Security Awareness Training"
            hasError={!!errors.name}
          />
        </Field>

        {/* Description */}
        <Field label="Description" helpText="Detailed description of the control activity and how it operates.">
          <TextareaInput
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe the control..."
            rows={3}
          />
        </Field>

        {/* Two-column row: Type & Frequency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Control Type" required error={errors.controlType}>
            <SelectInput
              value={form.controlType}
              onChange={e => set('controlType', e.target.value as ControlType)}
              hasError={!!errors.controlType}
            >
              {controlTypes.map(t => (
                <option key={t} value={t}>{CONTROL_TYPE_LABELS[t as ControlType] ?? t}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Frequency" required error={errors.frequency}>
            <SelectInput
              value={form.frequency}
              onChange={e => set('frequency', e.target.value as ControlFrequency)}
              hasError={!!errors.frequency}
            >
              {controlFreqs.map(f => (
                <option key={f} value={f}>{CONTROL_FREQUENCY_LABELS[f as ControlFrequency] ?? f}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Two-column row: Status & Effectiveness */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Status" required error={errors.status}>
            <SelectInput
              value={form.status}
              onChange={e => set('status', e.target.value as ControlStatus)}
              hasError={!!errors.status}
            >
              {controlStatuses.map(s => (
                <option key={s} value={s}>{CONTROL_STATUS_LABELS[s as ControlStatus] ?? s}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Effectiveness">
            <SelectInput
              value={form.effectiveness}
              onChange={e => set('effectiveness', e.target.value as ControlEffectiveness)}
            >
              {controlEffects.map(ef => (
                <option key={ef} value={ef}>{CONTROL_EFFECTIVENESS_LABELS[ef as ControlEffectiveness] ?? ef}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Two-column row: Department & Owner */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Department" required error={errors.department}>
            <SelectInput
              value={form.department}
              onChange={e => set('department', e.target.value)}
              hasError={!!errors.department}
            >
              <option value="">Select department...</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Owner">
            <UserPickerInput
              value={form.owner}
              onChange={u => set('owner', u)}
            />
          </Field>
        </div>

        {/* Automated — radio buttons (2-option choice per Appian guidelines) */}
        <Field label="Automated?">
          <div style={{ display: 'flex', gap: '16px', paddingTop: '4px' }}>
            {[
              { value: true, label: 'Yes — Runs without manual intervention' },
              { value: false, label: 'No — Manual execution required' },
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
                  name="isAutomated"
                  checked={form.isAutomated === opt.value}
                  onChange={() => set('isAutomated', opt.value)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </Field>

        {/* Framework Reference */}
        <Field label="Framework Reference" helpText="e.g. ISO27001-A.9.2.1, SOC2-CC6.1, NIST-DE.CM-4">
          <TextInput
            value={form.frameworkRef}
            onChange={e => set('frameworkRef', e.target.value)}
            placeholder="e.g. ISO27001-A.9.2.1"
          />
        </Field>

        {/* Two-column row: Last Tested & Next Test */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Last Tested Date">
            <TextInput
              type="date"
              value={form.lastTestedDate}
              onChange={e => set('lastTestedDate', e.target.value)}
            />
          </Field>

          <Field label="Next Test Date">
            <TextInput
              type="date"
              value={form.nextTestDate}
              onChange={e => set('nextTestDate', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </FormModal>
  );
}