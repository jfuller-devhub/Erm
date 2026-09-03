import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Tag } from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { AppUser } from '../../data/mockData';
import { generateId } from '../../data/mockData';
import type { Plan, PlanStatus, PlanProcessAssociation } from '../../data/planData';
import { loadPlans, savePlans, createPlan, updatePlan } from '../../data/planData';
import { loadProducts } from '../../data/productData';
import { loadProcesses } from '../../data/processData';

// ─── Props ───────────────────────────────────────────────────────────────────

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Plan) => void;
  editingPlan?: Plan | null;
  defaultProductId?: string;
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInputValue('');
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: value.length > 0 ? '6px' : 0 }}>
        {value.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              height: '22px', padding: '0 8px',
              border: '1px solid var(--border)', borderRadius: '100px',
              fontFamily: 'var(--font-family-primary)', fontSize: '12px',
              color: 'var(--foreground)', background: 'var(--muted)',
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter(t => t !== tag))}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 0 0 2px', display: 'flex', alignItems: 'center',
                color: 'var(--muted-foreground)',
              }}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(inputValue); }
            if (e.key === 'Backspace' && !inputValue && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder="Add tag and press Enter"
          style={{
            flex: 1, height: '36px', padding: '0 12px',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
            background: 'var(--input-background)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', color: 'var(--foreground)', outline: 'none',
          }}
          onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--primary)'; }}
          onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = 'var(--border)'; add(inputValue); }}
        />
        <button
          type="button"
          onClick={() => add(inputValue)}
          style={{
            height: '36px', padding: '0 12px', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-button)', background: 'var(--muted)',
            color: 'var(--foreground)', fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--text-base)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <Tag size={12} /> Add
        </button>
      </div>
    </div>
  );
}

// ─── Collapsible Section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
          borderRadius: open ? 'var(--radius-card) var(--radius-card) 0 0' : 'var(--radius-card)',
        }}
      >
        {title}
        {open
          ? <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />
          : <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />
        }
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: '16px' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vendor Picker ────────────────────────────────────────────────────────────

function VendorPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { vendors } = useApp();

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(v => v !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div
      style={{
        maxHeight: '160px', overflowY: 'auto',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
      }}
    >
      {vendors.length === 0 ? (
        <div style={{ padding: '12px', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
          No vendors available.
        </div>
      ) : (
        vendors.map(v => (
          <label
            key={v.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', cursor: 'pointer',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
              color: 'var(--foreground)',
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(v.id)}
              onChange={() => toggle(v.id)}
              style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ flex: 1 }}>{v.name}</span>
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{v.category}</span>
          </label>
        ))
      )}
    </div>
  );
}

// ─── Process Association Picker ────────────────────────────────────────────────

function ProcessAssocPicker({
  value,
  onChange,
}: {
  value: PlanProcessAssociation[];
  onChange: (assocs: PlanProcessAssociation[]) => void;
}) {
  const processes = loadProcesses();

  function toggle(processId: string, subProcessId?: string) {
    const key = subProcessId ? `${processId}::${subProcessId}` : processId;
    const existing = value.find(a =>
      a.processId === processId &&
      (subProcessId ? a.subProcessId === subProcessId : !a.subProcessId)
    );
    if (existing) {
      onChange(value.filter(a => !(a.processId === processId && a.subProcessId === subProcessId)));
    } else {
      onChange([...value, { processId, subProcessId }]);
    }
  }

  function isChecked(processId: string, subProcessId?: string) {
    return value.some(a =>
      a.processId === processId &&
      (subProcessId ? a.subProcessId === subProcessId : !a.subProcessId)
    );
  }

  return (
    <div
      style={{
        maxHeight: '200px', overflowY: 'auto',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-input)',
        background: 'var(--input-background)',
      }}
    >
      {processes.length === 0 ? (
        <div style={{ padding: '12px', fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)', color: 'var(--muted-foreground)' }}>
          No processes available.
        </div>
      ) : (
        processes.map(proc => (
          <div key={proc.id}>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                fontFamily: 'var(--font-family-primary)', fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
                background: 'var(--muted)',
              }}
            >
              <input
                type="checkbox"
                checked={isChecked(proc.id)}
                onChange={() => toggle(proc.id)}
                style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0 }}
              />
              {proc.name}
            </label>
            {proc.subProcesses.map(sub => (
              <label
                key={sub.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px 6px 28px', cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--font-family-primary)', fontSize: '13px',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked(proc.id, sub.id)}
                  onChange={() => toggle(proc.id, sub.id)}
                  style={{ width: '13px', height: '13px', cursor: 'pointer', flexShrink: 0 }}
                />
                {sub.name}
              </label>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function PlanFormModal({
  isOpen,
  onClose,
  onSave,
  editingPlan,
  defaultProductId,
}: PlanFormModalProps) {
  const isEditing = !!editingPlan;
  const products = loadProducts();

  // ─── Form state ────────────────────────────────────────────────────────
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<PlanStatus>('Draft');
  const [effectiveStartDate, setEffectiveStartDate] = useState('');
  const [effectiveEndDate, setEffectiveEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState<AppUser | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [processAssociations, setProcessAssociations] = useState<PlanProcessAssociation[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editingPlan) {
      setProductId(editingPlan.productId);
      setName(editingPlan.name);
      setStatus(editingPlan.status);
      setEffectiveStartDate(editingPlan.effectiveStartDate);
      setEffectiveEndDate(editingPlan.effectiveEndDate);
      setDescription(editingPlan.description);
      setOwner(editingPlan.owner);
      setTags(editingPlan.tags);
      setVendorIds(editingPlan.vendorIds);
      setProcessAssociations(editingPlan.processAssociations);
    } else {
      setProductId(defaultProductId ?? (products[0]?.id ?? ''));
      setName('');
      setStatus('Draft');
      setEffectiveStartDate('');
      setEffectiveEndDate('');
      setDescription('');
      setOwner(null);
      setTags([]);
      setVendorIds([]);
      setProcessAssociations([]);
    }
    setErrors({});
  }, [isOpen, editingPlan, defaultProductId]);

  // ─── Validation ────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Plan name is required.';
    if (!productId) errs.productId = 'Product is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Submit ────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!validate()) return;

    const data = {
      productId,
      name: name.trim(),
      status,
      effectiveStartDate,
      effectiveEndDate,
      description,
      owner,
      tags,
      vendorIds,
      departmentIds: editingPlan?.departmentIds ?? [],
      processAssociations,
      roadmapPurposeAlignment: editingPlan?.roadmapPurposeAlignment ?? '',
      roadmapPlanning: editingPlan?.roadmapPlanning ?? '',
      roadmapProtection: editingPlan?.roadmapProtection ?? '',
      roadmapPriceCompetitiveness: editingPlan?.roadmapPriceCompetitiveness ?? '',
      roadmapPerformanceMeasurement: editingPlan?.roadmapPerformanceMeasurement ?? '',
      roadmapParticipantExperience: editingPlan?.roadmapParticipantExperience ?? '',
    };

    const plans = loadPlans();
    let saved: Plan;

    if (isEditing && editingPlan) {
      saved = updatePlan(editingPlan, data);
      const updated = plans.map(p => (p.id === saved.id ? saved : p));
      savePlans(updated);
    } else {
      saved = createPlan(data);
      savePlans([...plans, saved]);
    }

    onSave(saved);
    onClose();
  }

  return (
    <FormModal
      title={isEditing ? 'Edit Plan' : 'New Plan'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Plan'}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Product */}
        <Field label="Product" required error={errors.productId}>
          <SelectInput
            value={productId}
            onChange={e => setProductId(e.target.value)}
            hasError={!!errors.productId}
          >
            <option value="">Select a product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </SelectInput>
        </Field>

        {/* Two-column row: Name + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '16px' }}>
          <Field label="Plan Name" required error={errors.name}>
            <TextInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. PPO Medical Plan 2025"
              hasError={!!errors.name}
            />
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={e => setStatus(e.target.value as PlanStatus)}>
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Archived">Archived</option>
            </SelectInput>
          </Field>
        </div>

        {/* Effective dates */}
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

        {/* Description */}
        <Field label="Description">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the plan..."
            rows={3}
          />
        </Field>

        {/* Owner */}
        <Field label="Plan Owner">
          <UserPickerInput
            value={owner}
            onChange={setOwner}
            placeholder="Select plan owner..."
          />
        </Field>

        {/* Tags */}
        <Field label="Tags" helpText="Press Enter or comma to add a tag.">
          <TagInput value={tags} onChange={setTags} />
        </Field>

        {/* Vendor Associations */}
        <CollapsibleSection title="Vendor Associations">
          <VendorPicker selectedIds={vendorIds} onChange={setVendorIds} />
          {vendorIds.length > 0 && (
            <p style={{
              marginTop: '8px', fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', color: 'var(--muted-foreground)',
            }}>
              {vendorIds.length} vendor{vendorIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </CollapsibleSection>

        {/* Process Associations */}
        <CollapsibleSection title="Process Associations">
          <ProcessAssocPicker value={processAssociations} onChange={setProcessAssociations} />
          {processAssociations.length > 0 && (
            <p style={{
              marginTop: '8px', fontFamily: 'var(--font-family-primary)',
              fontSize: '12px', color: 'var(--muted-foreground)',
            }}>
              {processAssociations.length} process association{processAssociations.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </CollapsibleSection>
      </div>
    </FormModal>
  );
}
