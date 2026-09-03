import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import type { Department, DeptType, DeptStatus } from '../../data/departmentData';
import { getDeptDescendants } from '../../data/departmentData';
import { MOCK_USERS, type AppUser } from '../../data/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dept: Department) => void;
  editingDept?: Department;
  allDepartments: Department[];
}

interface FormState {
  name: string;
  code: string;
  type: DeptType;
  status: DeptStatus;
  description: string;
  leadId: string;
  parentId: string;
  reportingStartDate: string;
  reportingEndDate: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

function toInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 6);
}

function emptyForm(): FormState {
  return {
    name: '', code: '', type: 'Department', status: 'Active',
    description: '', leadId: '', parentId: '',
    reportingStartDate: '', reportingEndDate: '',
  };
}

function fromDept(d: Department): FormState {
  return {
    name: d.name, code: d.code, type: d.type, status: d.status,
    description: d.description, leadId: d.leadId, parentId: d.parentId,
    reportingStartDate: d.reportingStartDate, reportingEndDate: d.reportingEndDate,
  };
}

export function DepartmentFormModal({ isOpen, onClose, onSave, editingDept, allDepartments }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Errors>({});
  const [codeManual, setCodeManual] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingDept) {
      setForm(fromDept(editingDept));
      setCodeManual(true);
    } else {
      setForm(emptyForm());
      setCodeManual(false);
    }
    setErrors({});
  }, [isOpen, editingDept]);

  const excludedIds = new Set([
    ...(editingDept ? [editingDept.id, ...getDeptDescendants(allDepartments, editingDept.id)] : []),
  ]);

  const parentOptions = allDepartments.filter(d => !excludedIds.has(d.id));

  const leadUser: AppUser | null = MOCK_USERS.find(u => u.id === form.leadId) ?? null;

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  function handleNameChange(val: string) {
    setForm(f => {
      const updated = { ...f, name: val };
      if (!codeManual) updated.code = toInitials(val);
      return updated;
    });
    if (errors.name) setErrors(e => ({ ...e, name: undefined }));
  }

  function handleCodeChange(val: string) {
    setCodeManual(true);
    set('code', val.toUpperCase());
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.code.trim()) errs.code = 'Code is required.';
    const dup = allDepartments.find(
      d => d.code.toUpperCase() === form.code.toUpperCase() && d.id !== editingDept?.id
    );
    if (dup) errs.code = `Code "${form.code}" is already used by "${dup.name}".`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const today = new Date().toISOString().split('T')[0];
    const base: Department = editingDept
      ? {
          ...editingDept,
          ...form,
          updatedDate: today,
        }
      : {
          id: 'DEPT-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
          ...form,
          createdDate: today,
          updatedDate: today,
        };
    onSave(base);
  }

  return (
    <FormModal
      title={editingDept ? 'Edit Department' : 'New Department'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={editingDept ? 'Save Changes' : 'Create Department'}
      size="lg"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Name" required error={errors.name}>
            <TextInput
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Benefits Administration"
              hasError={!!errors.name}
            />
          </Field>
        </div>

        <Field label="Code" required error={errors.code} helpText="Short identifier — auto-suggested from name">
          <TextInput
            value={form.code}
            onChange={e => handleCodeChange(e.target.value)}
            placeholder="e.g. BA"
            hasError={!!errors.code}
            style={{ fontFamily: 'var(--font-family-mono, monospace)', letterSpacing: '0.05em' }}
          />
        </Field>

        <Field label="Type" required>
          <SelectInput value={form.type} onChange={e => set('type', e.target.value as DeptType)}>
            <option value="Division">Division</option>
            <option value="Department">Department</option>
            <option value="Team">Team</option>
            <option value="Unit">Unit</option>
          </SelectInput>
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Description">
            <TextareaInput
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of this unit's purpose and responsibilities…"
              rows={3}
            />
          </Field>
        </div>

        <Field label="Status" required>
          <SelectInput value={form.status} onChange={e => set('status', e.target.value as DeptStatus)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </SelectInput>
        </Field>

        <Field label="Department Lead">
          <UserPickerInput
            value={leadUser}
            onChange={u => set('leadId', u?.id ?? '')}
            placeholder="Search for a lead…"
          />
        </Field>

        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Reports To (Parent)" helpText="Leave blank for top-level / root unit">
            <SelectInput value={form.parentId} onChange={e => set('parentId', e.target.value)}>
              <option value="">— None (Top Level) —</option>
              {parentOptions.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {form.parentId && (
          <>
            <Field label="Reporting Start Date">
              <TextInput
                type="date"
                value={form.reportingStartDate}
                onChange={e => set('reportingStartDate', e.target.value)}
              />
            </Field>
            <Field label="Reporting End Date" helpText="Leave blank if ongoing">
              <TextInput
                type="date"
                value={form.reportingEndDate}
                onChange={e => set('reportingEndDate', e.target.value)}
              />
            </Field>
          </>
        )}
      </div>
    </FormModal>
  );
}
