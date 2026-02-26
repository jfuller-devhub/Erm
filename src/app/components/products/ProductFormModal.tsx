import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Tag, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { FormModal, Field, TextInput, TextareaInput, SelectInput } from '../shared/FormModal';
import { UserPickerInput } from '../shared/UserPicker';
import { useApp } from '../../context/AppContext';
import type { AppUser } from '../../data/mockData';
import { generateId } from '../../data/mockData';
import type {
  Product, ProductType, ProductStatus, ProcessAssociation,
} from '../../data/productData';
import type { Process } from '../../data/processData';
import { loadProcesses } from '../../data/processData';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  editingProduct?: Product | null;
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  function add(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInputValue('');
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: value.length > 0 ? '6px' : 0,
        }}
      >
        {value.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(35,34,240,0.08)',
              color: 'var(--primary)',
              borderRadius: '100px',
              padding: '2px 8px',
              fontFamily: 'var(--font-family-primary)',
              fontSize: '11px',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            <Tag size={9} />
            {tag}
            <button
              onClick={() => onChange(value.filter(t => t !== tag))}
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
              <X size={9} />
            </button>
          </span>
        ))}
      </div>
      <TextInput
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
            e.preventDefault();
            add(inputValue);
          }
        }}
        onBlur={() => { if (inputValue.trim()) add(inputValue); }}
        placeholder="Type a tag and press Enter..."
      />
    </div>
  );
}

// ─── Process Association Picker ──────────────────────────────────────────────

function ProcessAssociationPicker({
  associations,
  onChange,
}: {
  associations: ProcessAssociation[];
  onChange: (assocs: ProcessAssociation[]) => void;
}) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProcesses(loadProcesses());
  }, []);

  const associatedProcessIds = new Set(associations.map(a => a.processId));
  const associatedSubIds = new Set(
    associations.filter(a => a.subProcessId).map(a => `${a.processId}::${a.subProcessId}`)
  );

  function toggleProcess(processId: string) {
    if (associatedProcessIds.has(processId)) {
      // Remove process-level and all sub-level associations for this process
      onChange(associations.filter(a => a.processId !== processId));
    } else {
      onChange([...associations, { processId }]);
    }
  }

  function toggleSubProcess(processId: string, subProcessId: string) {
    const key = `${processId}::${subProcessId}`;
    if (associatedSubIds.has(key)) {
      onChange(associations.filter(a => !(a.processId === processId && a.subProcessId === subProcessId)));
    } else {
      onChange([...associations, { processId, subProcessId }]);
    }
  }

  if (processes.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-input)',
          background: 'var(--muted)',
          fontFamily: 'var(--font-family-primary)',
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-weight-regular)',
          color: 'var(--muted-foreground)',
          textAlign: 'center',
        }}
      >
        No processes available. Create processes first in the Process Registry.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        maxHeight: '260px',
        overflowY: 'auto',
      }}
    >
      {processes.map(proc => {
        const isProcessChecked = associatedProcessIds.has(proc.id);
        const subs = proc.subProcesses ?? [];
        const isExpanded = expanded[proc.id] ?? false;

        return (
          <div key={proc.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                background: isProcessChecked ? 'rgba(35,34,240,0.04)' : 'var(--card)',
              }}
            >
              {subs.length > 0 && (
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [proc.id]: !prev[proc.id] }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'var(--muted-foreground)',
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              )}
              {subs.length === 0 && <span style={{ width: '16px' }} />}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isProcessChecked}
                  onChange={() => toggleProcess(proc.id)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                />
                {proc.name}
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {proc.status}
              </span>
            </div>

            {/* Sub-processes */}
            {isExpanded && subs.map(sp => {
              const subKey = `${proc.id}::${sp.id}`;
              const isSubChecked = associatedSubIds.has(subKey);
              return (
                <div
                  key={sp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px 6px 42px',
                    borderBottom: '1px solid var(--border)',
                    background: isSubChecked ? 'rgba(35,34,240,0.04)' : 'var(--muted)',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-regular)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSubChecked}
                      onChange={() => toggleSubProcess(proc.id, sp.id)}
                      style={{ accentColor: 'var(--primary)', width: '13px', height: '13px' }}
                    />
                    {sp.name}
                  </label>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Vendor Picker ───────────────────────────────────────────────────────────

function VendorPicker({
  vendors,
  selectedIds,
  onChange,
}: {
  vendors: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');

  function toggleVendor(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-input)',
        maxHeight: '260px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--card)',
        }}
      >
        <TextInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendors..."
          style={{ width: '100%' }}
        />
      </div>
      {vendors
        .filter(v => v.name.toLowerCase().includes(search.toLowerCase()))
        .map(v => (
          <div key={v.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderBottom: '1px solid var(--border)',
                background: selectedIds.includes(v.id) ? 'rgba(35,34,240,0.04)' : 'var(--card)',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(v.id)}
                  onChange={() => toggleVendor(v.id)}
                  style={{ accentColor: 'var(--primary)', width: '14px', height: '14px' }}
                />
                {v.name}
              </label>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function ProductFormModal({
  isOpen,
  onClose,
  onSave,
  editingProduct,
}: ProductFormModalProps) {
  const isEditing = !!editingProduct;
  const today = new Date().toISOString().split('T')[0];
  const { vendors, getActiveOptions } = useApp();

  const benefitCategories = getActiveOptions('Product', 'Benefit Category');
  const serviceCategories = getActiveOptions('Product', 'Service Category');
  const productStatuses   = getActiveOptions('Product', 'Status');

  // ─── Form state ────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('Benefit');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProductStatus>('Draft');
  const [tags, setTags] = useState<string[]>([]);
  const [owner, setOwner] = useState<AppUser | null>(null);
  const [effectiveStartDate, setEffectiveStartDate] = useState('');
  const [effectiveEndDate, setEffectiveEndDate] = useState('');
  const [processAssociations, setProcessAssociations] = useState<ProcessAssociation[]>([]);
  const [vendorIds, setVendorIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assocOpen, setAssocOpen] = useState(false);
  const [vendorAssocOpen, setVendorAssocOpen] = useState(false);

  // ─── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setName(editingProduct.name);
      setType(editingProduct.type);
      setCategory(editingProduct.category);
      setDescription(editingProduct.description);
      setStatus(editingProduct.status);
      setTags([...editingProduct.tags]);
      setOwner(editingProduct.owner);
      setEffectiveStartDate(editingProduct.effectiveStartDate);
      setEffectiveEndDate(editingProduct.effectiveEndDate);
      setProcessAssociations([...editingProduct.processAssociations]);
      setVendorIds([...(editingProduct.vendorIds ?? [])]);
      setAssocOpen(editingProduct.processAssociations.length > 0);
      setVendorAssocOpen((editingProduct.vendorIds ?? []).length > 0);
    } else {
      setName('');
      setType('Benefit');
      setCategory('');
      setDescription('');
      setStatus('Draft');
      setTags([]);
      setOwner(null);
      setEffectiveStartDate('');
      setEffectiveEndDate('');
      setProcessAssociations([]);
      setVendorIds([]);
      setAssocOpen(false);
      setVendorAssocOpen(false);
    }
    setErrors({});
  }, [isOpen, editingProduct]);

  // When type changes, clear category if it doesn't belong to new type
  useEffect(() => {
    const cats = type === 'Benefit' ? benefitCategories : serviceCategories;
    if (category && !cats.includes(category)) {
      setCategory('');
    }
  }, [type]);

  const categories = type === 'Benefit' ? benefitCategories : serviceCategories;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Benefit or Service name is required.';
    if (!category) errs.category = 'Category is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const product: Product = {
      id: editingProduct?.id ?? 'PRD-' + generateId(),
      name: name.trim(),
      type,
      category,
      description: description.trim(),
      status,
      tags,
      owner,
      effectiveStartDate,
      effectiveEndDate,
      processAssociations,
      vendorIds,
      createdDate: editingProduct?.createdDate ?? today,
      updatedDate: today,
    };
    onSave(product);
    onClose();
  }

  return (
    <FormModal
      title={isEditing ? 'Edit Benefit or Service' : 'New Benefit or Service'}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? 'Save Changes' : 'Create Benefit or Service'}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Row: Name + Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '16px' }}>
          <Field label="Benefit or Service Name" required error={errors.name}>
            <TextInput
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Medical PPO Plan"
              hasError={!!errors.name}
            />
          </Field>
          <Field label="Type" required>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['Benefit', 'Service'] as ProductType[]).map(t => (
                <label
                  key={t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--text-base)',
                    fontWeight: type === t ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    color: type === t ? 'var(--primary)' : 'var(--foreground)',
                  }}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </Field>
        </div>

        {/* Row: Category + Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Category" required error={errors.category}>
            <SelectInput
              value={category}
              onChange={e => setCategory(e.target.value)}
              hasError={!!errors.category}
            >
              <option value="">Select category...</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Status">
            <SelectInput value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
              {productStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </Field>
        </div>

        {/* Description */}
        <Field label="Description" helpText="Brief description of the benefit or service offering.">
          <TextareaInput
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the product or service offering..."
            rows={3}
          />
        </Field>

        {/* Owner */}
        <Field label="Benefit or Service Owner" helpText="The individual accountable for this benefit or service.">
          <UserPickerInput value={owner} onChange={setOwner} />
        </Field>

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

        {/* Tags */}
        <Field label="Tags" helpText="Press Enter or comma to add a tag.">
          <TagInput value={tags} onChange={setTags} />
        </Field>

        {/* Process Associations (collapsible) */}
        <div>
          <button
            onClick={() => setAssocOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {assocOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Process Associations
            {processAssociations.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                  background: 'rgba(35,34,240,0.08)',
                  borderRadius: '100px',
                  padding: '1px 8px',
                }}
              >
                {processAssociations.length}
              </span>
            )}
          </button>
          {assocOpen && (
            <div style={{ marginTop: '8px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 8px 0',
                }}
              >
                Select the processes and sub-processes this benefit or service is associated with.
              </p>
              <ProcessAssociationPicker
                associations={processAssociations}
                onChange={setProcessAssociations}
              />
            </div>
          )}
        </div>

        {/* Vendor Associations (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setVendorAssocOpen(o => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}
          >
            {vendorAssocOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Building2 size={14} style={{ color: 'var(--muted-foreground)' }} />
            Vendor Associations
            {vendorIds.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '11px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--primary)',
                  background: 'rgba(35,34,240,0.08)',
                  borderRadius: '100px',
                  padding: '1px 8px',
                }}
              >
                {vendorIds.length}
              </span>
            )}
          </button>
          {vendorAssocOpen && (
            <div style={{ marginTop: '8px' }}>
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--muted-foreground)',
                  margin: '0 0 8px 0',
                }}
              >
                Link this benefit or service to the vendors that deliver or support it.
              </p>
              <VendorPicker
                vendors={vendors}
                selectedIds={vendorIds}
                onChange={setVendorIds}
              />
            </div>
          )}
        </div>
      </div>
    </FormModal>
  );
}