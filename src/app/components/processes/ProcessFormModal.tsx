import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronRight, GitBranch,
  ListOrdered, Tag, X, Building2,
} from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { AppUser, Vendor } from '../../data/mockData';
import { generateId } from '../../data/mockData';
import type { Process, SubProcess, Step, ProcessStatus, StepType } from '../../data/processData';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProcessFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (process: Process) => void;
  editingProcess?: Process | null;
  existingProcesses: Process[];
  /** Optional: all vendors available for association */
  vendors?: Vendor[];
  /** Optional: IDs of vendors currently associated with this process */
  associatedVendorIds?: string[];
  /** Optional: called on save with the new set of vendor IDs */
  onVendorAssociationsChange?: (vendorIds: string[]) => void;
}

// ─── Draft types ─────────────────────────────────────────────────────────────

interface StepDraft {
  id: string;
  type: StepType;
  description: string;
  input: string;
  output: string;
  entryCriteria: string;
  exitCriteria: string;
  systemTool: string;
  responsibleRole: string;
  sortOrder: number;
  linkedStepIds: string[];
}

interface SubProcessDraft {
  id: string;
  name: string;
  description: string;
  objective: string;
  boundaryStart: string;
  boundaryEnd: string;
  owner: AppUser | null;
  tags: string[];
  steps: StepDraft[];
}

const emptyStepDraft = (sortOrder: number = 1): StepDraft => ({
  id: 'STP-' + generateId(),
  type: 'Task',
  description: '',
  input: '',
  output: '',
  entryCriteria: '',
  exitCriteria: '',
  systemTool: '',
  responsibleRole: '',
  sortOrder,
  linkedStepIds: [],
});

const emptySubDraft = (): SubProcessDraft => ({
  id: 'SUB-' + generateId(),
  name: '',
  description: '',
  objective: '',
  boundaryStart: '',
  boundaryEnd: '',
  owner: null,
  tags: [],
  steps: [],
});

// ─── Tag Input Component ─────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInputValue('');
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag));
  }

  return (
    <div
      style={{
        minHeight: '36px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
        display: 'flex',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        padding: '4px 8px',
        gap: '4px',
        boxSizing: 'border-box',
      }}
    >
      {value.map(tag => (
        <span
          key={tag}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(35,34,240,0.08)',
            color: 'var(--primary)',
            borderRadius: '100px',
            padding: '2px 8px 2px 8px',
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            lineHeight: '18px',
            whiteSpace: 'nowrap',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '1px',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--primary)',
            }}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? 'Type tag and press Enter...' : ''}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--foreground)',
          flex: 1,
          minWidth: '100px',
          height: '26px',
          padding: '0 2px',
        }}
      />
    </div>
  );
}

// ─── Process Dependency Picker ───────────────────────────────────────────────

function DependencyPicker({
  value,
  onChange,
  currentProcessId,
  existingProcesses,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  currentProcessId: string;
  existingProcesses: Process[];
}) {
  const available = existingProcesses.filter(p => p.id !== currentProcessId);

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (available.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          padding: '8px 0',
        }}
      >
        No other processes available to link as dependencies.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
        maxHeight: '140px',
        overflowY: 'auto',
      }}
    >
      {available.map(proc => {
        const checked = value.includes(proc.id);
        return (
          <label
            key={proc.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
              background: checked ? 'rgba(35,34,240,0.04)' : 'transparent',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: checked ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: 'var(--foreground)',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(proc.id)}
              style={{ accentColor: 'var(--primary)', width: '14px', height: '14px', margin: 0 }}
            />
            <span style={{ flex: 1 }}>{proc.name}</span>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
              }}
            >
              {proc.id}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Vendor Association Picker ───────────────────────────────────────────────

function VendorAssociationPicker({
  value,
  onChange,
  vendors,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  vendors: Vendor[];
}) {
  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  if (vendors.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--font-family-primary)',
          fontSize: '12px',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          padding: '8px 0',
        }}
      >
        No vendors available for association.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
        maxHeight: '140px',
        overflowY: 'auto',
      }}
    >
      {vendors.map(vendor => {
        const checked = value.includes(vendor.id);
        return (
          <label
            key={vendor.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
              background: checked ? 'rgba(35,34,240,0.04)' : 'transparent',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: checked ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              color: 'var(--foreground)',
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(vendor.id)}
              style={{ accentColor: 'var(--primary)', width: '14px', height: '14px', margin: 0 }}
            />
            <span style={{ flex: 1 }}>{vendor.name}</span>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '11px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
              }}
            >
              {vendor.id}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function ProcessFormModal({
  isOpen,
  onClose,
  onSave,
  editingProcess,
  existingProcesses,
  vendors,
  associatedVendorIds,
  onVendorAssociationsChange,
}: ProcessFormModalProps) {
  const { getActiveOptions } = useApp();
  const domainOptions  = getActiveOptions('Process', 'Business Domain');
  const statusOptions  = getActiveOptions('Process', 'Status');

  // ─── Process-level fields ────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [scope, setScope] = useState('');
  const [businessDomain, setBusinessDomain] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [owner, setOwner] = useState<AppUser | null>(null);
  const [status, setStatus] = useState<ProcessStatus>('Draft');
  const [effectiveStartDate, setEffectiveStartDate] = useState('');
  const [effectiveEndDate, setEffectiveEndDate] = useState('');
  const [dependsOnProcessIds, setDependsOnProcessIds] = useState<string[]>([]);
  const [vendorAssociations, setVendorAssociations] = useState<string[]>(associatedVendorIds ?? []);

  // ─── Sub-processes ──────────────────────────────────────────────────────
  const [subProcesses, setSubProcesses] = useState<SubProcessDraft[]>([]);
  const [pendingSub, setPendingSub] = useState<SubProcessDraft>(emptySubDraft());
  const [subPanelOpen, setSubPanelOpen] = useState(true);
  const [vendorPanelOpen, setVendorPanelOpen] = useState(false);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  // ─── Validation ─────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form on open / process changes
  useEffect(() => {
    if (isOpen) {
      if (editingProcess) {
        setName(editingProcess.name);
        setShortDescription(editingProcess.shortDescription);
        setPurpose(editingProcess.purpose);
        setScope(editingProcess.scope);
        setBusinessDomain(editingProcess.businessDomain);
        setTags([...editingProcess.tags]);
        setOwner(editingProcess.owner);
        setStatus(editingProcess.status);
        setEffectiveStartDate(editingProcess.effectiveStartDate);
        setEffectiveEndDate(editingProcess.effectiveEndDate);
        setDependsOnProcessIds([...editingProcess.dependsOnProcessIds]);
        setSubProcesses(
          editingProcess.subProcesses.map(sp => ({
            ...sp,
            tags: [...sp.tags],
            steps: sp.steps.map(st => ({ ...st, linkedStepIds: [...st.linkedStepIds] })),
          }))
        );
      } else {
        setName('');
        setShortDescription('');
        setPurpose('');
        setScope('');
        setBusinessDomain('');
        setTags([]);
        setOwner(null);
        setStatus('Draft');
        setEffectiveStartDate('');
        setEffectiveEndDate('');
        setDependsOnProcessIds([]);
        setSubProcesses([]);
      }
      setPendingSub(emptySubDraft());
      setErrors({});
      setExpandedSub(null);
      setVendorAssociations(associatedVendorIds ?? []);
    }
  }, [isOpen, editingProcess, associatedVendorIds]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Process name is required.';
    if (!owner) errs.owner = 'Owner is required.';
    if (!status) errs.status = 'Status is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Sub-process CRUD ──────────────────────────────────────────────────
  function handleAddSubProcess() {
    if (!pendingSub.name.trim()) return;
    setSubProcesses(prev => [...prev, { ...pendingSub }]);
    setPendingSub(emptySubDraft());
  }

  function handleRemoveSubProcess(id: string) {
    setSubProcesses(prev => prev.filter(s => s.id !== id));
    if (expandedSub === id) setExpandedSub(null);
  }

  function handleUpdateSubProcess(id: string, changes: Partial<SubProcessDraft>) {
    setSubProcesses(prev =>
      prev.map(s => (s.id === id ? { ...s, ...changes } : s))
    );
  }

  // ─── Step CRUD within a sub-process ─────────────────────────────────────
  function handleAddStep(subId: string, step: StepDraft) {
    setSubProcesses(prev =>
      prev.map(sp =>
        sp.id === subId ? { ...sp, steps: [...sp.steps, step] } : sp
      )
    );
  }

  function handleUpdateStep(subId: string, stepId: string, changes: Partial<StepDraft>) {
    setSubProcesses(prev =>
      prev.map(sp =>
        sp.id === subId
          ? {
              ...sp,
              steps: sp.steps.map(st =>
                st.id === stepId ? { ...st, ...changes } : st
              ),
            }
          : sp
      )
    );
  }

  function handleRemoveStep(subId: string, stepId: string) {
    setSubProcesses(prev =>
      prev.map(sp =>
        sp.id === subId
          ? { ...sp, steps: sp.steps.filter(st => st.id !== stepId) }
          : sp
      )
    );
  }

  // ─── Submit ────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!validate()) return;

    // Auto-save: include pending sub-process if name is filled
    let finalSubs = [...subProcesses];
    if (pendingSub.name.trim()) {
      finalSubs = [...finalSubs, { ...pendingSub }];
    }

    const today = new Date().toISOString().split('T')[0];

    const process: Process = {
      id: editingProcess?.id ?? 'PRC-' + generateId(),
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      purpose: purpose.trim(),
      scope: scope.trim(),
      businessDomain: businessDomain.trim(),
      tags,
      owner,
      status,
      effectiveStartDate,
      effectiveEndDate,
      subProcesses: finalSubs,
      dependsOnProcessIds,
      createdDate: editingProcess?.createdDate ?? today,
      updatedDate: today,
    };

    onSave(process);
    if (onVendorAssociationsChange) {
      onVendorAssociationsChange(vendorAssociations);
    }
    onClose();
  }

  // domainOptions and statusOptions come from Configuration via getActiveOptions

  return (
    <FormModal
      title={editingProcess ? 'Edit Process' : 'New Process'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={editingProcess ? 'Save Changes' : 'Create Process'}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* ─── Section: Process Details ──────────────────────────────────── */}
        <SectionHeader label="Process Details" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Process Name" required error={errors.name}>
            <TextInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Vendor Onboarding"
              hasError={!!errors.name}
            />
          </Field>

          <Field label="Business Domain">
            <SelectInput
              value={businessDomain}
              onChange={e => setBusinessDomain(e.target.value)}
            >
              <option value="">-- Select domain --</option>
              {domainOptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="Short Description" helpText="A brief one-line summary of this process.">
          <TextInput
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
            placeholder="Brief summary..."
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Purpose" helpText="Why does this process exist?">
            <TextareaInput
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Describe the purpose of this process..."
              style={{ minHeight: '72px' }}
            />
          </Field>
          <Field label="Scope" helpText="What is covered and excluded?">
            <TextareaInput
              value={scope}
              onChange={e => setScope(e.target.value)}
              placeholder="Describe what is in scope..."
              style={{ minHeight: '72px' }}
            />
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Owner" required error={errors.owner}>
            <UserPickerInput
              value={owner}
              onChange={setOwner}
              placeholder="Select process owner..."
              hasError={!!errors.owner}
            />
          </Field>

          <Field label="Status" required error={errors.status}>
            <SelectInput
              value={status}
              onChange={e => setStatus(e.target.value as ProcessStatus)}
              hasError={!!errors.status}
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Effective Start Date">
            <TextInput
              type="date"
              value={effectiveStartDate}
              onChange={e => setEffectiveStartDate(e.target.value)}
            />
          </Field>
          <Field label="Effective End Date">
            <TextInput
              type="date"
              value={effectiveEndDate}
              onChange={e => setEffectiveEndDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Tags" helpText="Press Enter or comma to add a tag.">
          <TagInput value={tags} onChange={setTags} />
        </Field>

        <Field label="Depends On (Other Processes)" helpText="Select processes this process depends on.">
          <DependencyPicker
            value={dependsOnProcessIds}
            onChange={setDependsOnProcessIds}
            currentProcessId={editingProcess?.id ?? ''}
            existingProcesses={existingProcesses}
          />
        </Field>

        {/* ─── Section: Vendor Associations ──────────────────────────────── */}
        {vendors && (
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setVendorPanelOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                width: '100%',
              }}
            >
              {vendorPanelOpen ? (
                <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              ) : (
                <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              )}
              <Building2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                Vendor Associations
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  background: 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 8px',
                  lineHeight: '18px',
                }}
              >
                {vendorAssociations.length}
              </span>
            </button>

            {vendorPanelOpen && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <VendorAssociationPicker
                  value={vendorAssociations}
                  onChange={setVendorAssociations}
                  vendors={vendors}
                />
              </div>
            )}
          </div>
        )}

        {/* ─── Section: Sub-Processes ────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            marginTop: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setSubPanelOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              width: '100%',
            }}
          >
            {subPanelOpen ? (
              <ChevronDown size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            ) : (
              <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
            )}
            <GitBranch size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
              }}
            >
              Sub-Processes
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: '12px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--muted-foreground)',
                background: 'var(--muted)',
                borderRadius: '100px',
                padding: '1px 8px',
                lineHeight: '18px',
              }}
            >
              {subProcesses.length}
            </span>
          </button>

          {subPanelOpen && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Existing sub-processes */}
              {subProcesses.map((sp, idx) => (
                <SubProcessCard
                  key={sp.id}
                  sub={sp}
                  index={idx}
                  isExpanded={expandedSub === sp.id}
                  onToggleExpand={() => setExpandedSub(prev => (prev === sp.id ? null : sp.id))}
                  onUpdate={changes => handleUpdateSubProcess(sp.id, changes)}
                  onRemove={() => handleRemoveSubProcess(sp.id)}
                  onAddStep={step => handleAddStep(sp.id, step)}
                  onUpdateStep={(stepId, changes) => handleUpdateStep(sp.id, stepId, changes)}
                  onRemoveStep={stepId => handleRemoveStep(sp.id, stepId)}
                />
              ))}

              {/* Pending sub-process entry */}
              <div
                style={{
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--radius-card)',
                  padding: '12px',
                  background: 'var(--muted)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--muted-foreground)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Add Sub-Process
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <TextInput
                      value={pendingSub.name}
                      onChange={e =>
                        setPendingSub(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Sub-process name"
                    />
                    <UserPickerInput
                      value={pendingSub.owner}
                      onChange={u =>
                        setPendingSub(prev => ({ ...prev, owner: u }))
                      }
                      placeholder="Owner / SME (optional)"
                    />
                  </div>
                  <TextareaInput
                    value={pendingSub.description}
                    onChange={e =>
                      setPendingSub(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Description (optional)"
                    style={{ minHeight: '48px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleAddSubProcess}
                      disabled={!pendingSub.name.trim()}
                      style={{
                        height: '28px',
                        padding: '0 12px',
                        border: '1px solid var(--primary)',
                        borderRadius: 'var(--radius-button)',
                        background: 'transparent',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-semibold)',
                        cursor: pendingSub.name.trim() ? 'pointer' : 'not-allowed',
                        opacity: pendingSub.name.trim() ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.1s',
                      }}
                    >
                      <Plus size={12} />
                      Add
                    </button>
                  </div>
                </div>

                {/* Auto-save hint */}
                <div
                  style={{
                    marginTop: '8px',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'var(--muted-foreground)',
                    fontStyle: 'italic',
                  }}
                >
                  Tip: If you fill in a name above but forget to click &quot;Add&quot;, it will be auto-saved when you submit the form.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--muted-foreground)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        paddingBottom: '4px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '4px',
      }}
    >
      {label}
    </div>
  );
}

// ─── Sub-Process Card ────────────────────────────────────────────────────────

function SubProcessCard({
  sub,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
}: {
  sub: SubProcessDraft;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (changes: Partial<SubProcessDraft>) => void;
  onRemove: () => void;
  onAddStep: (step: StepDraft) => void;
  onUpdateStep: (stepId: string, changes: Partial<StepDraft>) => void;
  onRemoveStep: (stepId: string) => void;
}) {
  const [pendingStep, setPendingStep] = useState<StepDraft>(emptyStepDraft(sub.steps.length + 1));
  const [stepsOpen, setStepsOpen] = useState(true);

  function handleAddStepClick() {
    if (!pendingStep.description.trim()) return;
    onAddStep({ ...pendingStep });
    setPendingStep(emptyStepDraft(sub.steps.length + 2));
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--card)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--muted)',
          borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
        }}
      >
        <button
          type="button"
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--muted-foreground)',
          }}
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            flexShrink: 0,
          }}
        >
          #{index + 1}
        </span>
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sub.name || 'Untitled Sub-Process'}
        </span>
        {sub.steps.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--muted-foreground)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '100px',
              padding: '1px 6px',
            }}
          >
            <ListOrdered size={10} />
            {sub.steps.length} step{sub.steps.length !== 1 ? 's' : ''}
          </span>
        )}
        {sub.tags.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            <Tag size={10} />
            {sub.tags.length}
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--destructive)',
            flexShrink: 0,
          }}
          title="Remove sub-process"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Expanded edit fields */}
      {isExpanded && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Field label="Name" required>
              <TextInput
                value={sub.name}
                onChange={e => onUpdate({ name: e.target.value })}
                placeholder="Sub-process name"
              />
            </Field>
            <Field label="Owner / SME">
              <UserPickerInput
                value={sub.owner}
                onChange={u => onUpdate({ owner: u })}
                placeholder="Select owner..."
              />
            </Field>
          </div>

          <Field label="Objective">
            <TextareaInput
              value={sub.objective}
              onChange={e => onUpdate({ objective: e.target.value })}
              placeholder="What is the objective of this sub-process?"
              style={{ minHeight: '48px' }}
            />
          </Field>

          <Field label="Description">
            <TextareaInput
              value={sub.description}
              onChange={e => onUpdate({ description: e.target.value })}
              placeholder="Description..."
              style={{ minHeight: '48px' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Field label="Boundary Start" helpText="Trigger event that initiates this sub-process.">
              <TextInput
                value={sub.boundaryStart}
                onChange={e => onUpdate({ boundaryStart: e.target.value })}
                placeholder="e.g. Request submitted"
              />
            </Field>
            <Field label="Boundary End" helpText="Event that marks the sub-process as complete.">
              <TextInput
                value={sub.boundaryEnd}
                onChange={e => onUpdate({ boundaryEnd: e.target.value })}
                placeholder="e.g. Approval granted"
              />
            </Field>
          </div>

          <Field label="Tags" helpText="Press Enter or comma to add.">
            <TagInput value={sub.tags} onChange={t => onUpdate({ tags: t })} />
          </Field>

          {/* ─── Steps / Activities Section ──────────────────────────────── */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              paddingTop: '12px',
              marginTop: '4px',
            }}
          >
            <button
              type="button"
              onClick={() => setStepsOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                width: '100%',
              }}
            >
              {stepsOpen ? (
                <ChevronDown size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              ) : (
                <ChevronRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
              )}
              <ListOrdered size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                Steps / Activities
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                  background: 'var(--muted)',
                  borderRadius: '100px',
                  padding: '1px 6px',
                }}
              >
                {sub.steps.length}
              </span>
            </button>

            {stepsOpen && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sub.steps.map((step, sIdx) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={sIdx}
                    onUpdate={changes => onUpdateStep(step.id, changes)}
                    onRemove={() => onRemoveStep(step.id)}
                  />
                ))}

                {/* Pending step entry */}
                <div
                  style={{
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '10px',
                    background: 'var(--muted)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--muted-foreground)',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Add Step / Activity
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
                    <SelectInput
                      value={pendingStep.type}
                      onChange={e =>
                        setPendingStep(prev => ({ ...prev, type: e.target.value as StepType }))
                      }
                      style={{ height: '32px', fontSize: '12px' }}
                    >
                      <option value="Task">Task</option>
                      <option value="Decision">Decision</option>
                      <option value="Hand-off">Hand-off</option>
                    </SelectInput>
                    <TextInput
                      value={pendingStep.description}
                      onChange={e =>
                        setPendingStep(prev => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Step description..."
                      style={{ height: '32px', fontSize: '12px' }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '6px',
                      marginTop: '6px',
                    }}
                  >
                    <TextInput
                      value={pendingStep.responsibleRole}
                      onChange={e =>
                        setPendingStep(prev => ({ ...prev, responsibleRole: e.target.value }))
                      }
                      placeholder="Responsible role"
                      style={{ height: '32px', fontSize: '12px' }}
                    />
                    <TextInput
                      value={pendingStep.systemTool}
                      onChange={e =>
                        setPendingStep(prev => ({ ...prev, systemTool: e.target.value }))
                      }
                      placeholder="System / tool used"
                      style={{ height: '32px', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={handleAddStepClick}
                      disabled={!pendingStep.description.trim()}
                      style={{
                        height: '24px',
                        padding: '0 10px',
                        border: '1px solid var(--primary)',
                        borderRadius: 'var(--radius-button)',
                        background: 'transparent',
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '11px',
                        fontWeight: 'var(--font-weight-semibold)',
                        cursor: pendingStep.description.trim() ? 'pointer' : 'not-allowed',
                        opacity: pendingStep.description.trim() ? 1 : 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Plus size={10} />
                      Add Step
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step Card ───────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  onUpdate,
  onRemove,
}: {
  step: StepDraft;
  index: number;
  onUpdate: (changes: Partial<StepDraft>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<string, { bg: string; fg: string }> = {
    Task: { bg: '#E8F5EE', fg: '#1C8A45' },
    Decision: { bg: '#FFF3E0', fg: '#E07B00' },
    'Hand-off': { bg: '#E0F5F5', fg: '#00A3A3' },
  };

  const colors = typeColors[step.type] ?? { bg: '#F0F0F0', fg: '#6B7489' };

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--card)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: expanded ? 'var(--muted)' : 'transparent',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded(o => !o)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            color: 'var(--muted-foreground)',
          }}
        >
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </button>
        <span
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: '11px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--muted-foreground)',
            flexShrink: 0,
          }}
        >
          {index + 1}.
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: '16px',
            padding: '0 6px',
            borderRadius: '100px',
            background: colors.bg,
            color: colors.fg,
            fontFamily: 'var(--font-family-primary)',
            fontSize: '10px',
            fontWeight: 'var(--font-weight-semibold)',
            flexShrink: 0,
          }}
        >
          {step.type}
        </span>
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-family-primary)',
            fontSize: '12px',
            fontWeight: 'var(--font-weight-regular)',
            color: 'var(--foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {step.description || 'No description'}
        </span>
        {step.responsibleRole && (
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '10px',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--muted-foreground)',
              flexShrink: 0,
            }}
          >
            {step.responsibleRole}
          </span>
        )}
        <button
          type="button"
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--destructive)',
            flexShrink: 0,
          }}
          title="Remove step"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px' }}>
            <Field label="Type">
              <SelectInput
                value={step.type}
                onChange={e => onUpdate({ type: e.target.value as StepType })}
                style={{ height: '32px', fontSize: '12px' }}
              >
                <option value="Task">Task</option>
                <option value="Decision">Decision</option>
                <option value="Hand-off">Hand-off</option>
              </SelectInput>
            </Field>
            <Field label="Description">
              <TextInput
                value={step.description}
                onChange={e => onUpdate({ description: e.target.value })}
                placeholder="Step description..."
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <Field label="Input">
              <TextInput
                value={step.input}
                onChange={e => onUpdate({ input: e.target.value })}
                placeholder="What goes in?"
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
            <Field label="Output">
              <TextInput
                value={step.output}
                onChange={e => onUpdate({ output: e.target.value })}
                placeholder="What comes out?"
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <Field label="Entry Criteria">
              <TextInput
                value={step.entryCriteria}
                onChange={e => onUpdate({ entryCriteria: e.target.value })}
                placeholder="Conditions to start..."
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
            <Field label="Exit Criteria">
              <TextInput
                value={step.exitCriteria}
                onChange={e => onUpdate({ exitCriteria: e.target.value })}
                placeholder="Conditions to complete..."
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <Field label="System / Tool">
              <TextInput
                value={step.systemTool}
                onChange={e => onUpdate({ systemTool: e.target.value })}
                placeholder="e.g. Appian, SharePoint"
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
            <Field label="Responsible Role">
              <TextInput
                value={step.responsibleRole}
                onChange={e => onUpdate({ responsibleRole: e.target.value })}
                placeholder="e.g. Risk Analyst"
                style={{ height: '32px', fontSize: '12px' }}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}