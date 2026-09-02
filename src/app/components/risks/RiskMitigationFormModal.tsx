import React, { useState, useEffect } from 'react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type {
  RiskMitigationAction,
  MitigationActionType,
  MitigationStatus,
  MitigationPriority,
} from '../../data/riskMitigationData';
import {
  ACTION_TYPE_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  EFFECTIVENESS_LABELS,
} from '../../data/riskMitigationData';
import type { AppUser } from '../../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiskMitigationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<RiskMitigationAction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: RiskMitigationAction | null;
  riskId: string;
}

type FormErrors = Partial<Record<string, string>>;

interface FormState {
  title: string;
  description: string;
  actionType: MitigationActionType;
  status: MitigationStatus;
  priority: MitigationPriority;
  assignedTo: AppUser | null;
  approvedBy: AppUser | null;
  dueDate: string;
  completionDate: string;
  costEstimate: string;
  effectivenessScore: number | null;
}

const EMPTY: FormState = {
  title: '',
  description: '',
  actionType: 'mitigate',
  status: 'open',
  priority: 'medium',
  assignedTo: null,
  approvedBy: null,
  dueDate: '',
  completionDate: '',
  costEstimate: '',
  effectivenessScore: null,
};

// ─── Score Selector (1-5) ────────────────────────────────────────────────────

function EffectivenessSelector({
  value,
  onChange,
  hasError,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  hasError?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(n => {
          const isActive = n === value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(isActive ? null : n)}
              style={{
                width: '40px',
                height: '36px',
                border: `1px solid ${hasError ? 'var(--destructive)' : isActive ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-input)',
                background: isActive ? 'var(--primary)' : 'var(--input-background)',
                color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer',
                transition: 'all 0.1s',
                padding: 0,
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          lineHeight: '14px',
        }}
      >
        {value ? EFFECTIVENESS_LABELS[value] : 'Click to rate'}
      </span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RiskMitigationFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  riskId,
}: RiskMitigationFormModalProps) {
  const { getActiveOptions } = useApp();
  const actionTypes    = getActiveOptions('Mitigation', 'Action Type');
  const priorities     = getActiveOptions('Mitigation', 'Priority');
  const mitigStatuses  = getActiveOptions('Mitigation', 'Status');

  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          title: initialData.title,
          description: initialData.description,
          actionType: initialData.actionType,
          status: initialData.status,
          priority: initialData.priority,
          assignedTo: initialData.assignedTo,
          approvedBy: initialData.approvedBy,
          dueDate: initialData.dueDate,
          completionDate: initialData.completionDate ?? '',
          costEstimate: initialData.costEstimate != null ? String(initialData.costEstimate) : '',
          effectivenessScore: initialData.effectivenessScore,
        });
      } else {
        setForm({ ...EMPTY });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const isCompleted = form.status === 'complete';

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    else if (form.title.trim().length > 200) errs.title = 'Title must be 200 characters or fewer.';
    if (!form.assignedTo) errs.assignedTo = 'Assigned to is required.';
    if (!form.dueDate) errs.dueDate = 'Due date is required.';
    if (isCompleted && !form.completionDate) errs.completionDate = 'Completion date is required when status is Complete.';
    if (form.costEstimate.trim()) {
      const c = parseFloat(form.costEstimate);
      if (isNaN(c) || c < 0) errs.costEstimate = 'Must be a positive number.';
    }
    if (isCompleted && form.effectivenessScore == null) {
      errs.effectivenessScore = 'Effectiveness rating is required for completed actions.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const cost = form.costEstimate.trim() ? parseFloat(form.costEstimate) : null;
    onSave({
      riskId,
      assignedTo: form.assignedTo,
      approvedBy: form.approvedBy,
      title: form.title.trim(),
      description: form.description.trim(),
      actionType: form.actionType,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      completionDate: isCompleted && form.completionDate ? form.completionDate : null,
      costEstimate: cost,
      effectivenessScore: isCompleted ? form.effectivenessScore : null,
    });
    onClose();
  }

  return (
    <FormModal
      title={initialData ? 'Edit Mitigation Action' : 'New Mitigation Action'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={initialData ? 'Save Changes' : 'Add Action'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Title */}
        <Field label="Title" required error={errors.title} helpText="Short description of the action to be taken.">
          <TextInput
            value={form.title}
            onChange={e => set('title', e.target.value)}
            hasError={!!errors.title}
            placeholder="e.g. Deploy EDR to remaining endpoints"
            maxLength={200}
          />
        </Field>

        {/* Description */}
        <Field label="Description" helpText="Detailed description including expected outcome and success criteria.">
          <TextareaInput
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe what needs to be done, the expected outcome, and how success will be measured..."
          />
        </Field>

        {/* Separator */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            margin: '4px 0',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '0',
              background: 'var(--card)',
              paddingRight: '8px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Classification
          </span>
        </div>

        {/* Row: Action Type + Priority + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <Field label="Action Type" required>
            <SelectInput
              value={form.actionType}
              onChange={e => set('actionType', e.target.value as MitigationActionType)}
            >
              {actionTypes.map(t => (
                <option key={t} value={t}>{ACTION_TYPE_LABELS[t as MitigationActionType] ?? t}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Priority" required>
            <SelectInput
              value={form.priority}
              onChange={e => set('priority', e.target.value as MitigationPriority)}
            >
              {priorities.map(p => (
                <option key={p} value={p}>{PRIORITY_LABELS[p as MitigationPriority] ?? p}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status" required>
            <SelectInput
              value={form.status}
              onChange={e => set('status', e.target.value as MitigationStatus)}
            >
              {mitigStatuses.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s as MitigationStatus] ?? s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Separator */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            margin: '4px 0',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '0',
              background: 'var(--card)',
              paddingRight: '8px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Assignment
          </span>
        </div>

        {/* Assigned To */}
        <Field label="Assigned To" required error={errors.assignedTo} helpText="Person responsible for executing this action.">
          <UserPickerInput
            value={form.assignedTo}
            onChange={u => set('assignedTo', u)}
            placeholder="Select assignee..."
            hasError={!!errors.assignedTo}
          />
        </Field>

        {/* Approved By */}
        <Field label="Approved By" helpText="Manager or risk owner who approved the action plan. Optional for low-priority actions.">
          <UserPickerInput
            value={form.approvedBy}
            onChange={u => set('approvedBy', u)}
            placeholder="Select approver (optional)..."
          />
        </Field>

        {/* Separator */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            margin: '4px 0',
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '-10px',
              left: '0',
              background: 'var(--card)',
              paddingRight: '8px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '12px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Schedule & Cost
          </span>
        </div>

        {/* Row: Due Date + Completion Date + Cost */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <Field label="Due Date" required error={errors.dueDate}>
            <TextInput
              type="date"
              value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)}
              hasError={!!errors.dueDate}
            />
          </Field>
          <Field
            label="Completion Date"
            required={isCompleted}
            error={errors.completionDate}
            helpText={isCompleted ? 'Required when status is Complete.' : 'Set when action is completed.'}
          >
            <TextInput
              type="date"
              value={form.completionDate}
              onChange={e => set('completionDate', e.target.value)}
              hasError={!!errors.completionDate}
              disabled={!isCompleted}
              style={{ opacity: isCompleted ? 1 : 0.5 }}
            />
          </Field>
          <Field label="Cost Estimate (USD)" error={errors.costEstimate} helpText="Estimated cost for this action.">
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={form.costEstimate}
              onChange={e => set('costEstimate', e.target.value)}
              hasError={!!errors.costEstimate}
              placeholder="e.g. 45000"
            />
          </Field>
        </div>

        {/* Effectiveness Score — only for completed */}
        {isCompleted && (
          <>
            <div
              style={{
                borderTop: '1px solid var(--border)',
                margin: '4px 0',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '0',
                  background: 'var(--card)',
                  paddingRight: '8px',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Closure Review
              </span>
            </div>
            <Field
              label="Effectiveness Score"
              required
              error={errors.effectivenessScore}
              helpText="Rate how effective this action was at reducing risk (1–5)."
            >
              <EffectivenessSelector
                value={form.effectivenessScore}
                onChange={v => set('effectivenessScore', v)}
                hasError={!!errors.effectivenessScore}
              />
            </Field>
          </>
        )}
      </div>
    </FormModal>
  );
}